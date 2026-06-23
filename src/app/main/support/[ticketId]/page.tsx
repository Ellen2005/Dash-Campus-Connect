"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, Clock, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Ticket = {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  category: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  isAdmin: boolean;
  sender?: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
};

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [ticketRes, messagesRes] = await Promise.all([
          fetch(`/api/support/${resolvedParams.ticketId}`),
          fetch(`/api/support/${resolvedParams.ticketId}/messages`)
        ]);

        if (ticketRes.ok) {
          const t = await ticketRes.json();
          setTicket(t.ticket);
        } else {
          toast({ title: "Error", description: "Failed to load ticket", variant: "destructive" });
        }

        if (messagesRes.ok) {
          const m = await messagesRes.json();
          setMessages(m.messages);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.ticketId, toast]);

  const sendReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);

    try {
      const res = await fetch(`/api/support/${resolvedParams.ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      if (!res.ok) throw new Error("Failed to send reply");
      
      const newMsg = await res.json();
      
      // We don't get the populated sender back from POST immediately, so we mock it for the UI
      setMessages(prev => [...prev, {
        id: newMsg.message.id,
        content: replyContent,
        createdAt: new Date().toISOString(),
        isAdmin: false, // Student replying
        sender: { id: user?.id || "", name: user?.name || "Me" }
      }]);
      setReplyContent("");
      
      if (ticket?.status === "OPEN") {
        setTicket({ ...ticket, status: "IN_PROGRESS" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-muted-foreground">Ticket not found or you don't have permission to view it.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold font-headline">{ticket.subject}</h1>
            <Badge variant={ticket.status === "RESOLVED" ? "secondary" : "default"} className="text-[10px]">
              {ticket.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Opened {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender?.id === user?.id;
          const isAdmin = msg.isAdmin;

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 shrink-0">
                {isAdmin ? (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Shield className="w-4 h-4" />
                  </div>
                ) : (
                  <>
                    <AvatarImage src={msg.sender?.profilePhoto || ""} />
                    <AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback>
                  </>
                )}
              </Avatar>

              <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-medium">{isAdmin ? "Support Team" : msg.sender?.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                </div>
                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : 
                  isAdmin ? "bg-amber-500/10 border border-amber-500/20 text-foreground rounded-tl-sm" : 
                  "bg-muted/50 border border-border text-foreground rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Box */}
      {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
        <div className="pt-4 border-t border-border mt-8">
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/30"
            />
            <Button 
              className="shrink-0 h-auto" 
              disabled={!replyContent.trim() || sending}
              onClick={sendReply}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
