"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, Clock, ShieldCheck, Loader2, ChevronRight, AlertTriangle, HelpCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type MyTicket = {
  id: string; title: string; category: string; status: string; createdAt: string;
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ON_HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  RESOLVED: "bg-primary/10 text-primary border-primary/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

const categoryMap: Record<string, string> = {
  "tech-support": "TECHNICAL", "report-behavior": "BEHAVIORAL",
  "account": "INQUIRY", "marketplace": "INQUIRY", "general-inquiry": "INQUIRY",
};

export default function SupportPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [lastTicketId, setLastTicketId] = useState("");

  const loadTickets = async () => {
    if (!dashUser?.id) return;
    setTicketsLoading(true);
    try {
      const res = await fetch(`/api/support?userId=${dashUser.id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.tickets)) setMyTickets(json.tickets);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => { void loadTickets(); }, [dashUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser?.id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: dashUser.id,
          title: subject.trim(),
          description: description.trim(),
          category: categoryMap[category] ?? "INQUIRY",
          priority: "NORMAL",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to submit ticket.");
      setLastTicketId(json.ticket?.id?.slice(-6) ?? "???");
      setSubmitted(true);
      toast({ title: t("ticketSubmitted"), description: t("ticketFollowUp") });
      await loadTickets();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickCategories = [
    { icon: HelpCircle, labelKey: "techSupport" as const, descKey: "techSupportDesc" as const, val: "tech-support", color: "text-primary" },
    { icon: AlertTriangle, labelKey: "reportBehavior" as const, descKey: "reportBehaviorDesc" as const, val: "report-behavior", color: "text-destructive" },
    { icon: MessageSquare, labelKey: "generalInquiry" as const, descKey: "generalInquiryDesc" as const, val: "general-inquiry", color: "text-primary" },
  ];

  return (
    <div className="space-y-6 pb-16 page-enter">
      <div>
        <h1 className="text-xl font-headline font-bold">{t("supportCenter")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("supportSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickCategories.map((item, i) => (
          <button
            key={item.val}
            className="dash-card p-4 flex items-start gap-3 cursor-pointer hover:border-primary/25 transition-all duration-150 text-left animate-in fade-in duration-200"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => setCategory(item.val)}
          >
            <div className={cn("p-2 rounded-xl bg-muted/50 border border-border shrink-0", item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{t(item.labelKey)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t(item.descKey)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto self-center shrink-0" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Ticket */}
        <div className="dash-card p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{t("submitTicket")}</h2>
              <p className="text-[11px] text-muted-foreground">{t("avgResponseTime")}</p>
            </div>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{t("ticketReceived")}</h3>
                <p className="text-sm text-muted-foreground">
                  Reference: <span className="font-mono text-primary">#{lastTicketId}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border">
                <ShieldCheck className="w-3 h-3 text-primary" />
                {t("closedLoopFeedback")}
              </div>
              <Button onClick={() => { setSubmitted(false); setSubject(""); setCategory(""); setDescription(""); }} variant="outline" size="sm">
                {t("submitAnother")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-sm bg-muted/30"><SelectValue placeholder={t("selectCategory")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech-support">{t("techSupport")}</SelectItem>
                    <SelectItem value="report-behavior">{t("reportBehavior")}</SelectItem>
                    <SelectItem value="account">{t("account")}</SelectItem>
                    <SelectItem value="marketplace">{t("market")}</SelectItem>
                    <SelectItem value="general-inquiry">{t("generalInquiry")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("subject")}</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder={t("briefDescription")} className="h-9 text-sm bg-muted/30" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("details")}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder={t("describeIssue")} className="min-h-[100px] bg-muted/30 border-border resize-none text-sm" maxLength={2000} required />
                <p className="text-[10px] text-muted-foreground text-right">{description.length}/2000</p>
              </div>
              <Button type="submit" className="w-full dash-button-primary h-9" disabled={isSubmitting || !category || !subject.trim() || !dashUser}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ticket className="w-4 h-4 mr-2" />}
                {t("submit")}
              </Button>
            </form>
          )}
        </div>

        {/* My Tickets */}
        <div className="dash-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">{t("myTickets")}</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{myTickets.length} total</span>
          </div>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : myTickets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTickets.map((ticket, i) => (
                <div key={ticket.id} className="p-3.5 rounded-xl bg-muted/20 border border-border hover:border-primary/20 transition-all duration-150 cursor-pointer group animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">#{ticket.id.slice(-6)}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{ticket.category}</span>
                      </div>
                    </div>
                    <Badge className={cn("text-[9px] font-bold border shrink-0", statusColors[ticket.status] ?? "bg-muted text-muted-foreground border-border")}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" /> {t("updatedAt")} {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-primary" />
            {t("reportsPrivate")}
          </div>
        </div>
      </div>
    </div>
  );
}
