"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, Clock, ShieldCheck, Loader2, ChevronRight, AlertTriangle, HelpCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockTickets = [
  { id: "TKT-001", subject: "Can't access my course materials", category: "Tech Support", status: "resolved", created: "2 days ago", updated: "1 day ago" },
  { id: "TKT-002", subject: "Reported scam post in marketplace", category: "Moderation", status: "in-review", created: "5 hours ago", updated: "3 hours ago" },
  { id: "TKT-003", subject: "Username change request", category: "Account", status: "open", created: "1 hour ago", updated: "1 hour ago" },
];

const statusConfig = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "in-review": { label: "In Review", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export default function SupportPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Ticket Submitted",
        description: "We'll review your request and follow up shortly.",
      });
    }, 1400);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-400">
        <h1 className="text-3xl font-headline font-extrabold tracking-tight">Support Center</h1>
        <p className="text-sm text-muted-foreground">Report issues, request help, or flag bad behavior. We close the loop — you'll hear back.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { icon: HelpCircle, label: "Tech Support", desc: "App bugs, login issues, feature requests", color: "text-blue-400" },
          { icon: AlertTriangle, label: "Report Behavior", desc: "Harassment, scams, or policy violations", color: "text-destructive" },
          { icon: MessageSquare, label: "General Inquiry", desc: "Account changes, feedback, suggestions", color: "text-accent" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="obsidian-card p-5 flex items-start gap-4 cursor-pointer hover:border-accent/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => setCategory(item.label.toLowerCase().replace(" ", "-"))}
          >
            <div className={cn("p-2.5 rounded-xl bg-muted/50 border border-border", item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto self-center" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit Ticket */}
        <div className="obsidian-card p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg">Submit a Ticket</h2>
              <p className="text-[11px] text-muted-foreground">Avg. response time: under 24 hours</p>
            </div>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-bold">Ticket Received!</h3>
                <p className="text-sm text-muted-foreground">Reference: <span className="font-code text-accent">TKT-{Math.floor(Math.random() * 900) + 100}</span></p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border">
                <ShieldCheck className="w-3 h-3 text-accent" />
                Closed-loop feedback active — you'll hear back
              </div>
              <Button onClick={() => { setSubmitted(false); setSubject(""); setCategory(""); setDescription(""); }} variant="outline" size="sm">
                Submit Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-background/50 border-border">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech-support">Tech Support</SelectItem>
                    <SelectItem value="report-behavior">Report Behavior</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="marketplace">Marketplace Dispute</SelectItem>
                    <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="bg-background/50 border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Details</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Include any relevant usernames, post IDs, or screenshots..."
                  className="min-h-[120px] bg-background/50 border-border resize-none text-sm"
                  maxLength={2000}
                  required
                />
                <p className="text-[10px] text-muted-foreground text-right">{description.length}/2000</p>
              </div>
              <Button type="submit" className="w-full champagne-gradient font-bold" disabled={isSubmitting || !category || !subject.trim()}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ticket className="w-4 h-4 mr-2" />}
                Submit Ticket
              </Button>
            </form>
          )}
        </div>

        {/* My Tickets */}
        <div className="obsidian-card p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg">My Tickets</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{mockTickets.length} total</span>
          </div>
          <div className="space-y-3">
            {mockTickets.map((ticket, i) => {
              const s = statusConfig[ticket.status as keyof typeof statusConfig];
              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl bg-muted/20 border border-border hover:border-accent/20 transition-all duration-200 cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{ticket.subject}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-code text-muted-foreground">{ticket.id}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{ticket.category}</span>
                      </div>
                    </div>
                    <Badge className={cn("text-[9px] font-bold border shrink-0", s.color)}>{s.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Updated {ticket.updated}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-accent" />
            All reports are reviewed privately. Your identity is protected.
          </div>
        </div>
      </div>
    </div>
  );
}
