"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ensureDbUser } from "@/lib/client-user";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Send, Search, Paperclip, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { uploadFile } from "@/lib/upload";

interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string;
  photo?: string;
  username?: string;
  otherUserId?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: {
    id: string;
    name: string;
    username?: string;
    profilePhoto?: string;
  };
  images?: string[];
  voiceUrl?: string;
}

interface SearchUser {
  id: string;
  name: string;
  username?: string;
  profilePhoto?: string;
}

export default function MessagesPage() {
  const { t } = useI18n();
  const { dashUser, session } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userResults, setUserResults] = useState<SearchUser[]>([]);

  const loadConversations = async () => {
    if (!dashUser) return;

    setLoadingList(true);
    try {
      await ensureDbUser(dashUser, session);
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(dashUser.id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load conversations.");

      const nextConversations = Array.isArray(json?.conversations) ? json.conversations : [];
      setConversations(nextConversations);
      setActiveConversationId((current) => current ?? nextConversations[0]?.id ?? null);
    } catch (error: any) {
      toast({ title: "Inbox unavailable", description: error?.message ?? "Please try again." });
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadThread = async (conversationId: string) => {
    if (!dashUser) return;

    setLoadingThread(true);
    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(dashUser.id)}&limit=100`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load messages.");
      setMessages(Array.isArray(json?.messages) ? json.messages : []);
    } catch (error: any) {
      toast({ title: "Thread unavailable", description: error?.message ?? "Please try again." });
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, [dashUser?.id]);

  useEffect(() => {
    if (activeConversationId) {
      void loadThread(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    const run = async () => {
      if (!dashUser) return;
      const needle = userSearch.trim();
      if (needle.length < 2) {
        setUserResults([]);
        return;
      }
      setSearchingUsers(true);
      try {
        const params = new URLSearchParams({ q: needle, currentUserId: dashUser.id });
        const res = await fetch(`/api/messages/users?${params.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "User search failed.");
        setUserResults(Array.isArray(json?.users) ? json.users : []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    };
    void run();
  }, [userSearch, dashUser?.id]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  const filteredConversations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(needle) ||
        conversation.username?.toLowerCase()?.includes(needle)
    );
  }, [conversations, query]);

  const handleSend = async () => {
    if (!dashUser || !activeConversation) return;

    setSending(true);
    try {
      const uploadedImages: string[] = [];
      for (const file of attachmentFiles) {
        const up = await uploadFile(file, "posts", dashUser.id);
        if (up.error || !up.url) throw new Error(up.error ?? "Attachment upload failed.");
        uploadedImages.push(up.url);
      }

      let voiceUrl: string | undefined;
      if (voiceFile) {
        const up = await uploadFile(voiceFile, "posts", dashUser.id);
        if (up.error || !up.url) throw new Error(up.error ?? "Audio upload failed.");
        voiceUrl = up.url;
      }

      const payload =
        activeConversation.type === "direct"
          ? { senderId: dashUser.id, recipient: activeConversation.otherUserId, content: draft.trim(), images: uploadedImages, voiceUrl }
          : { senderId: dashUser.id, chatGroupId: activeConversation.id, content: draft.trim(), images: uploadedImages, voiceUrl };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to send message.");

      setDraft("");
      setAttachmentFiles([]);
      setVoiceFile(null);
      await loadThread(activeConversation.id);
      await loadConversations();
    } catch (error: any) {
      toast({ title: "Message failed", description: error?.message ?? "Please try again." });
    } finally {
      setSending(false);
    }
  };

  const startDirectChat = (u: SearchUser) => {
    const conversationId = `direct-${u.id}`;
    const existing = conversations.find((c) => c.id === conversationId);
    if (!existing) {
      setConversations((prev) => [
        {
          id: conversationId,
          type: "direct",
          name: u.name,
          photo: u.profilePhoto,
          username: u.username,
          otherUserId: u.id,
        },
        ...prev,
      ]);
    }
    setActiveConversationId(conversationId);
    setUserSearch("");
    setUserResults([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-headline font-bold">{t("messages")}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchConversations")} className="pl-9" />
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search any user to start a chat..." className="pl-9" />
          </div>
          {(searchingUsers || userResults.length > 0) && (
            <div className="mb-3 space-y-1 rounded-xl border border-border p-2">
              {searchingUsers ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Searching users...
                </div>
              ) : userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDirectChat(u)}
                  className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.profilePhoto} />
                    <AvatarFallback>{u.name?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{u.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">@{u.username ?? "user"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {loadingList ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loadingConversations")}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t("noConversationsYet")}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active ? "border-primary/40 bg-primary/8" : "border-transparent hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.photo} />
                        <AvatarFallback>{conversation.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount != null && conversation.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{conversation.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : t("noConversationsYet")}
                      </p>
                    </div>
                    {conversation.unreadCount != null && conversation.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="flex min-h-[540px] flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activeConversation.photo} />
                  <AvatarFallback>{activeConversation.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{activeConversation.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {activeConversation.type === "group" ? t("groupConversation") : `@${activeConversation.username ?? "student"}`}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loadingMessages")}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">{t("noConversationsYet")} {t("startConversation")}</div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === dashUser?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {!mine && <p className="mb-1 text-[10px] font-semibold opacity-70">{message.sender?.name ?? "Student"}</p>}
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          {!!message.images?.length && (
                            <div className="mt-2 space-y-1">
                              {message.images.map((url, idx) => (
                                <a key={`${message.id}-img-${idx}`} href={url} target="_blank" rel="noreferrer" className="block text-[11px] underline opacity-90">
                                  Attachment {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                          {message.voiceUrl && (
                            <audio controls className="mt-2 w-full max-w-[240px]">
                              <source src={message.voiceUrl} />
                            </audio>
                          )}
                          <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,text/plain"
                      onChange={(e) => setAttachmentFiles(Array.from(e.target.files ?? []))}
                    />
                  </label>
                  <label className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border cursor-pointer">
                    <Mic className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => setVoiceFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("writeMessage")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <Button onClick={() => void handleSend()} disabled={sending || (!draft.trim() && attachmentFiles.length === 0 && !voiceFile)} className="dash-button-primary">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {(attachmentFiles.length > 0 || voiceFile) && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {attachmentFiles.length > 0 ? `${attachmentFiles.length} attachment(s) selected` : ""}
                    {attachmentFiles.length > 0 && voiceFile ? " · " : ""}
                    {voiceFile ? "Audio selected" : ""}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[540px] items-center justify-center text-sm text-muted-foreground">
              {t("selectConversation")}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
