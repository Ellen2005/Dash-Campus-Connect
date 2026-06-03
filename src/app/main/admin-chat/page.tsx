"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  id: string; senderId: string; senderName: string; senderRole: string;
  content: string; createdAt: string;
};

export default function AdminChatPage() {
  const router = useRouter();
  const { dashUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const isAllowed = dashUser?.role === "admin" || dashUser?.role === "student_admin";

  const loadMessages = async () => {
    if (!dashUser?.schoolId || !isAllowed) return;
    const res = await fetch(
      `/api/admin-chat?schoolId=${dashUser.schoolId}&senderId=${dashUser.id}&senderRole=${dashUser.role}`,
      { cache: "no-store" }
    ).catch(() => null);
    if (!res?.ok) return;
    const json = await res.json().catch(() => ({}));
    if (Array.isArray(json?.messages)) setMessages(json.messages);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAllowed) { router.replace("/main"); return; }
    void loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [dashUser?.id, isAllowed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !dashUser || !isAllowed) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schoolId: dashUser.schoolId,
          senderId: dashUser.id,
          senderName: dashUser.fullName,
          senderRole: dashUser.role,
          content: content.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to send.");
      setContent("");
      await loadMessages();
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!isAllowed) return null;

  const roleColor = (role: string) =>
    role === "admin" ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Channel</p>
          <p className="text-[10px] text-muted-foreground">Private — Main admin & student admins only</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Start the admin conversation.</p>
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.senderId === dashUser?.id;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {!isMe && (
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                    {msg.senderName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold">{msg.senderName}</span>
                    <Badge className={`text-[8px] border px-1 py-0 ${roleColor(msg.senderRole)}`}>
                      {msg.senderRole === "admin" ? "Main Admin" : "Student Admin"}
                    </Badge>
                  </div>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/60 border border-border rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-muted-foreground px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 pt-3 border-t border-border shrink-0">
        <Input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Message admin channel…"
          className="flex-1 h-10 text-sm bg-muted/30"
          disabled={sending}
          autoComplete="off"
        />
        <Button type="submit" size="icon" className="h-10 w-10 dash-button-primary shrink-0" disabled={sending || !content.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
