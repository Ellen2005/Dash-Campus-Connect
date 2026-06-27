"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Shield, Send, Loader2, Users } from "lucide-react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  senderName: string;
  senderRole: "admin" | "student_admin";
};

export default function AdminChatPage() {
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = dashUser?.role === "admin" || dashUser?.role === "student_admin";
  const isStudentAdmin = dashUser?.isStudentAdmin;

  useEffect(() => {
    if (!isAdmin && !isStudentAdmin) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [isAdmin, isStudentAdmin, dashUser?.schoolId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!dashUser?.schoolId) return;
    try {
      const params = new URLSearchParams({ schoolId: dashUser.schoolId });
      const res = await fetch(`/api/admin-chat?${params}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.messages)) {
        setMessages(json.messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          senderName: m.senderName,
          senderRole: m.senderRole,
        })));
        setGroupId(json.groupId);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setContent("");
      await loadMessages();
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin && !isStudentAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="dash-card max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="text-sm font-semibold">Access Denied</p>
            <p className="text-xs text-muted-foreground mt-1">Only admins and student admins can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-headline font-bold">Admin Chat</h1>
          <p className="text-xs text-muted-foreground">Coordination channel for admins and student admins</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Users className="w-3 h-3 mr-1" /> {isAdmin ? "Admin" : "Student Admin"}
        </Badge>
      </div>

      <Card className="dash-card flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation with your admin team</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderName === dashUser?.fullName;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={`text-xs font-bold ${msg.senderRole === "admin" ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-600"}`}>
                      {msg.senderName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-medium">{msg.senderName}</span>
                      {msg.senderRole === "admin" ? (
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold">Admin</Badge>
                      ) : (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Student Admin</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 border border-border text-foreground rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message to the admin team..."
              className="min-h-[60px] resize-none bg-muted/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              className="shrink-0 h-auto"
              disabled={!content.trim() || sending}
              onClick={sendMessage}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}