"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Megaphone, Send, ShieldAlert, CheckCircle2, Loader2, AtSign, X, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { uploadFile } from "@/lib/upload";

interface AISuggestion {
  suggestedTitle: string;
  revisedMessage: string;
  suggestedPriority: "Normal" | "Urgent" | "Emergency";
}

function mockAnnouncementAssistant(draft: string): AISuggestion {
  const lower = draft.toLowerCase();
  const priority: AISuggestion["suggestedPriority"] =
    lower.includes("emergency") || lower.includes("urgent") || lower.includes("immediate") ? "Emergency"
    : lower.includes("deadline") || lower.includes("important") || lower.includes("required") ? "Urgent"
    : "Normal";
  return {
    suggestedTitle: draft.split(".")[0].trim().slice(0, 60) || "Campus Announcement",
    revisedMessage: `Dear Students, ${draft.trim()} Please acknowledge receipt by logging into your Dash account. — University Administration`,
    suggestedPriority: priority,
  };
}

type StudentTag = { id: string; name: string; username: string };

const COMMUNITIES = [
  { value: "all",      label: "All Students",         icon: Globe },
  { value: "specific", label: "Specific Students",  icon: AtSign },
];

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [audience, setAudience] = useState("all");
  const [expiry, setExpiry] = useState("24h");
  const [tagSearch, setTagSearch] = useState("");
  const [students, setStudents] = useState<StudentTag[]>([]);
  const [taggedStudents, setTaggedStudents] = useState<StudentTag[]>([]);
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentLink, setAttachmentLink] = useState("");

  const { dashUser, session } = useAuth();

  useEffect(() => {
    const run = async () => {
      if (!dashUser) return;
      try {
        const res = await fetch("/api/admin/users?status=active", { cache: "no-store" });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || !Array.isArray(json?.users)) return setStudents([]);

        const next: StudentTag[] = json.users
          .map((u: any) => ({
            id: u.id,
            name: u.name ?? u.username ?? "Student",
            username: u.username ?? "",
          }))
          .filter((u: StudentTag) => !!u.id && !!u.username);
        setStudents(next);
      } catch {
        setStudents([]);
      }
    };
    void run();
  }, [dashUser?.id, session]);

  const isSpecific = audience === "specific";
  const filteredStudents = students.filter(
    (s) =>
      (s.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
        s.username.toLowerCase().includes(tagSearch.toLowerCase())) &&
      !taggedStudents.find((t) => t.id === s.id)
  );

  const addTag = (s: StudentTag) => {
    setTaggedStudents((prev) => [...prev, s]);
    setTagSearch("");
  };

  const removeTag = (id: string) => setTaggedStudents((prev) => prev.filter((s) => s.id !== id));

  const handleGenerate = async () => {
    if (!draft.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftMessage: draft, context }),
      });
      const data = await res.json();
      setSuggestion(data);
      toast({ title: "Draft Optimized ✨", description: "AI has suggested a title and priority level." });
    } catch {
      setSuggestion(mockAnnouncementAssistant(draft));
      toast({ title: "Draft Optimized", description: "Using local AI (API unavailable)." });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSend = async () => {
    const message = (suggestion?.revisedMessage ?? draft).trim();
    if (!message) return;

    setSending(true);
    try {
      let actionUrl: string | undefined;
      if (attachmentFile) {
        if (!dashUser) throw new Error("Sign in required to upload attachments.");
        const uploaded = await uploadFile(attachmentFile, "posts", dashUser.id);
        if (uploaded.error || !uploaded.url) throw new Error(uploaded.error ?? "Attachment upload failed.");
        actionUrl = uploaded.url;
      } else if (attachmentLink.trim()) {
        const raw = attachmentLink.trim();
        actionUrl = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
      }

      const title = (suggestion?.suggestedTitle ?? "School Announcement").trim().slice(0, 200);
      const targetUserIds = isSpecific ? taggedStudents.map((s) => s.id) : undefined;
      const payload = {
        title,
        message: message.slice(0, 500),
        actionUrl,
        targetUserIds: targetUserIds && targetUserIds.length > 0 ? targetUserIds : undefined,
      };

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? "Broadcast failed.");

      toast({
        title: "Announcement Sent ✅",
        description: `Delivered to ${json?.delivered ?? 0} students.`,
      });

      setDraft("");
      setSuggestion(null);
      setContext("");
      setTaggedStudents([]);
      setAttachmentFile(null);
      setAttachmentLink("");
      setExpiry("24h");
    } catch (e: any) {
      toast({ title: "Broadcast failed", description: e?.message ?? "Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 page-enter">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold">Campus Broadcasting</h1>
          <p className="text-sm text-muted-foreground">Draft and deliver official university alerts to specific audiences.</p>
        </div>
      </div>

      <Card className="dash-card-hover">
        <CardHeader>
          <CardTitle className="text-lg">Compose Announcement</CardTitle>
          <CardDescription>Write your message, choose your audience, then let AI refine it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Message Draft</Label>
            <Textarea
              placeholder="What is the announcement about?"
              className="min-h-[120px] bg-muted/30 resize-none text-sm"
              value={draft} onChange={e => setDraft(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Target Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="h-10 text-sm bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <c.icon className="w-3.5 h-3.5" />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSpecific && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tag Students</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-muted/30 border border-border">
                {taggedStudents.map(s => (
                  <Badge key={s.id} className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
                    @{s.username}
                    <button onClick={() => removeTag(s.id)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                <input
                  value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                  placeholder="Search student…"
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {tagSearch && filteredStudents.length > 0 && (
                <div className="dash-card p-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {filteredStudents.map(s => (
                    <button key={s.id} onClick={() => addTag(s)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 text-left transition-colors">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold">{s.name[0]}</div>
                      <div>
                        <p className="text-xs font-semibold">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{s.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {isSpecific && taggedStudents.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Search and tag specific students above. Only they will receive this announcement.</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Context (Optional)</Label>
            <Input placeholder="e.g. For final year students only" className="h-9 text-sm bg-muted/30" value={context} onChange={e => setContext(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Attachment (Optional)</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="dash-card p-3.5 flex items-center justify-between gap-3 rounded-xl border border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {attachmentFile ? attachmentFile.name : "Upload PDF/Image"}
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Choose</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    setAttachmentFile(e.target.files?.[0] ?? null);
                  }}
                />
              </label>

              <Input
                value={attachmentLink}
                onChange={(e) => setAttachmentLink(e.target.value)}
                placeholder="Or paste a link (https://...)"
                className="h-11 bg-muted/30 border-border"
              />
            </div>
          </div>

          <Button className="w-full dash-button-primary" onClick={handleGenerate} disabled={isAiLoading || !draft.trim()}>
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isAiLoading ? "Processing with AI…" : "Optimize with AI Assistant"}
          </Button>
        </CardContent>
      </Card>

      {suggestion && (
        <Card className="dash-card border-primary/30 bg-primary/[0.03] animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> AI Suggested Draft
              </CardTitle>
              <CardDescription>Refined for clarity and impact</CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              suggestion.suggestedPriority === "Emergency" ? "bg-destructive/10 text-destructive border-destructive/20"
              : suggestion.suggestedPriority === "Urgent" ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-muted text-muted-foreground border-border"
            }`}>
              {suggestion.suggestedPriority} Priority
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
              <div className="p-3 bg-muted/30 rounded-lg border border-border font-semibold text-sm">{suggestion.suggestedTitle}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Revised Message</Label>
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm leading-relaxed italic text-muted-foreground">"{suggestion.revisedMessage}"</div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sending to</p>
              <div className="flex items-center gap-2 flex-wrap">
                {isSpecific ? (
                  taggedStudents.length > 0
                    ? taggedStudents.map(s => <Badge key={s.id} className="text-[10px] bg-primary/10 text-primary border-primary/20">@{s.username}</Badge>)
                    : <p className="text-xs text-muted-foreground">No students tagged</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Globe className="w-4 h-4 text-primary" />
                    {COMMUNITIES.find(c => c.value === audience)?.label}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expiry</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger className="h-9 text-sm bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setSuggestion(null)}>Discard</Button>
              <Button
                className="flex-1 dash-button-primary"
                onClick={() => void handleSend()}
                disabled={sending || (isSpecific && taggedStudents.length === 0)}>
                <Send className="w-4 h-4 mr-2" /> Broadcast Announcement
              </Button>
            </div>

            {suggestion.suggestedPriority === "Emergency" && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-[11px] font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                This will override "Do Not Disturb" on student devices and show a full-screen alert.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
