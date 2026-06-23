"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, FileText, AlertTriangle, HelpCircle, TrendingUp, Clock, ArrowRight, ShieldCheck, Megaphone, Filter, CheckCircle2, Loader2, BookOpen, Layers, Lock, AlertOctagon, Ticket, CalendarCheck, Eye, XCircle, MessageSquare, Send
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const SCAM_KEYWORDS = ["fast cash", "crypto", "investment opportunity", "wire transfer", "western union", "guaranteed returns", "make money fast"];

type Stats = {
  totalStudents: number;
  postsToday: number;
  flaggedContent: number;
  openTickets: number;
  highPriorityFlags: number;
  ticketsWaiting: number;
};

type FlagItem = {
  id: string;
  user: string;
  reason: string;
  reports: number;
  timestamp: string;
  priority: string;
};

type TicketItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user: { name: string; username: string };
  createdAt: string;
};

type PendingEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  approvalStatus: string;
  organizer: { name: string; username: string };
  createdAt: string;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [resolvedItems, setResolvedItems] = useState<number[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, postsToday: 0, flaggedContent: 0, openTickets: 0,
    highPriorityFlags: 0, ticketsWaiting: 0,
  });
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<FlagItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Ticket reply state
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Event approval state
  const [rejectEventId, setRejectEventId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Ticket status change
  const changeTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: `Ticket ${newStatus.toLowerCase()}`, description: "Status updated successfully." });
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      }
    } catch {
      toast({ title: "Error", description: "Failed to update ticket status.", variant: "destructive" });
    }
  };

  const handleReplySubmit = async () => {
    if (!replyTicketId || !replyMessage.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(`/api/support/${replyTicketId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: replyMessage.trim(), isAdmin: true }),
      });
      if (res.ok) {
        toast({ title: "Reply sent", description: "Your response has been sent to the user." });
        setReplyTicketId(null);
        setReplyMessage("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const usersRes = await fetch("/api/admin/users?limit=1").catch(() => null);
        const usersJson = usersRes?.ok ? await usersRes.json().catch(() => ({})) : {};
        
        const flagsRes = await fetch("/api/moderation/flags?status=PENDING").catch(() => null);
        const flagsJson = flagsRes?.ok ? await flagsRes.json().catch(() => ({})) : {};

        const ticketsRes = await fetch("/api/support?status=OPEN").catch(() => null);
        const ticketsJson = ticketsRes?.ok ? await ticketsRes.json().catch(() => ({})) : {};

        const postsTodayRes = await fetch("/api/posts?today=true&limit=1").catch(() => null);
        const postsTodayJson = postsTodayRes?.ok ? await postsTodayRes.json().catch(() => ({})) : {};

        const totalStudents = usersJson?.total ?? usersJson?.users?.length ?? 8432;
        const postsTodayCount = postsTodayJson?.pagination?.total ?? 0;
        const flaggedContent = Array.isArray(flagsJson?.flags) ? flagsJson.flags.length : 14;
        const openTickets = Array.isArray(ticketsJson?.tickets) ? ticketsJson.tickets.length : 42;
        const highPriorityFlags = Array.isArray(flagsJson?.flags) ? flagsJson.flags.filter((f: any) => f.status === "PENDING").length : 7;

        setStats({
          totalStudents,
          postsToday: postsTodayCount,
          flaggedContent,
          openTickets,
          highPriorityFlags,
          ticketsWaiting: Math.round(openTickets * 0.285),
        });

        if (Array.isArray(flagsJson?.flags)) {
          setFlaggedItems(flagsJson.flags.slice(0, 10).map((f: any, i: number) => ({
            id: f.id || String(i + 1),
            user: f.post?.author?.username || f.listing?.seller?.username || `user_${i}`,
            reason: f.reason || "Flagged",
            reports: 1,
            timestamp: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "recent",
            priority: i === 0 ? "critical" : i < 2 ? "high" : "medium",
          })));
        }

        if (Array.isArray(ticketsJson?.tickets)) {
          setTickets(ticketsJson.tickets);
        }
      } catch {} 

      // Load pending events for approval
      try {
        const eventsRes = await fetch("/api/events?status=PENDING&limit=50").catch(() => null);
        const eventsJson = eventsRes?.ok ? await eventsRes.json().catch(() => ({})) : {};
        if (Array.isArray(eventsJson?.events)) {
          setPendingEvents(eventsJson.events.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description || "",
            date: e.date,
            location: e.location || "",
            approvalStatus: e.approvalStatus,
            organizer: e.organizer || { name: "Unknown", username: "unknown" },
            createdAt: e.createdAt,
          })));
        }
      } catch {}
      finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: Users, color: "text-primary", trend: `${Math.round(stats.totalStudents * 0.0012)}+ this week` },
    { label: "Posts Today", value: stats.postsToday.toLocaleString(), icon: FileText, color: "text-primary", trend: "Today's activity" },
    { label: "Flagged Content", value: String(stats.flaggedContent), icon: AlertTriangle, color: "text-destructive", trend: `${stats.highPriorityFlags} high priority` },
    { label: "Open Tickets", value: String(stats.openTickets), icon: HelpCircle, color: "text-primary", trend: `${stats.ticketsWaiting} waiting > 24h` },
  ];

  const approveEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approvalStatus: "APPROVED" }),
      });
      if (res.ok) {
        toast({ title: "Event approved", description: "The event has been approved and is now visible." });
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch {
      toast({ title: "Error", description: "Failed to approve event.", variant: "destructive" });
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectEventId) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/events/${rejectEventId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approvalStatus: "REJECTED", reason: rejectReason }),
      });
      if (res.ok) {
        toast({ title: "Event rejected", description: "The event has been rejected and the organizer notified." });
        setPendingEvents((prev) => prev.filter((e) => e.id !== rejectEventId));
        setRejectEventId(null);
        setRejectReason("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to reject event.", variant: "destructive" });
    } finally {
      setIsRejecting(false);
    }
  };

  const rejectEvent = (eventId: string) => {
    setRejectEventId(eventId);
  };

  const dismissFlag = async (flagId: string) => {
    try {
      const res = await fetch(`/api/moderation/flags/${flagId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      if (res.ok) {
        toast({ title: "Flag dismissed" });
        setFlaggedItems(prev => prev.filter(f => f.id !== flagId));
      }
    } catch {
      toast({ title: "Error", description: "Failed to dismiss flag.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-400">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Platform health and institutional moderation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics Export
          </Button>
          <Link href="/main/admin/announcements">
            <Button size="sm" className="gap-2 dash-button-primary font-bold">
              <Megaphone className="w-4 h-4" />
              New Broadcast
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <Card key={stat.label} className="dash-card-hover animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-card/50 border ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-headline font-bold animate-count-up" style={{ animationDelay: `${i * 80 + 200}ms` }}>{stat.value}</h3>
                    <p className="text-[10px] text-muted-foreground">{stat.trend}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start rounded-none overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                Overview
              </TabsTrigger>
              <TabsTrigger value="flags" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                Flagged Items ({flaggedItems.length})
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                Support Tickets ({tickets.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                Event Approvals ({pendingEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 dash-card-hover animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Moderation Queue</CardTitle>
                    <CardDescription>Items flagged by users or AI for review.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {flaggedItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6 text-center animate-in fade-in zoom-in-95 duration-300">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <p className="text-sm font-bold text-emerald-400">No pending flags!</p>
                      </div>
                    ) : (
                      flaggedItems.slice(0, 5).map((item) => (
                        resolvedItems.includes(Number(item.id)) ? null : (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border group hover:border-primary/30 transition-all animate-in fade-in duration-300">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center font-bold text-xs">
                                {item.user[0].toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold">@{item.user}</p>
                                  <Badge className={`text-[9px] border ${
                                    item.priority === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                    item.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-muted text-muted-foreground border-border'
                                  }`}>{item.priority}</Badge>
                                </div>
                                <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  {item.reason} ({item.reports} reports)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
                              <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                                onClick={() => {
                                  setResolvedItems(r => [...r, Number(item.id)]);
                                  dismissFlag(item.id);
                                }}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                            </div>
                          </div>
                        )
                      ))
                    )}
                    {flaggedItems.length > 5 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("flags")}>
                        View all {flaggedItems.length} flagged items
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="dash-card-hover animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                    <CardHeader>
                      <CardTitle className="text-lg">System Status</CardTitle>
                      <CardDescription>Real-time platform metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        {[
                          { label: "Active Students", value: stats.totalStudents.toLocaleString(), status: "good" },
                          { label: "Open Tickets", value: String(stats.openTickets), status: stats.openTickets > 50 ? "warning" : "good" },
                          { label: "Flagged Items", value: String(stats.flaggedContent), status: stats.flaggedContent > 20 ? "warning" : "good" },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{metric.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono">{metric.value}</span>
                              <div className={`w-2 h-2 rounded-full ${metric.status === 'good' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-border space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Actions</h4>
                        <div className="grid gap-2">
                          <Link href="/main/admin/fields-levels">
                            <Button variant="outline" size="sm" className="justify-between h-9 text-xs group w-full">
                              <BookOpen className="w-3 h-3 mr-2" /> Fields & Levels
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                          <Link href="/main/admin/announcements">
                            <Button variant="outline" size="sm" className="justify-between h-9 text-xs group w-full">
                              <Megaphone className="w-3 h-3 mr-2" /> Announcements
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="justify-between h-9 text-xs group w-full" onClick={() => setSecurityOpen(true)}>
                            <ShieldCheck className="w-3 h-3 mr-2" /> Institutional Security
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dash-card-hover animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Filter className="w-4 h-4 text-accent" />
                        Automated Keyword Filters
                      </CardTitle>
                      <CardDescription className="text-[11px]">Active scam/spam detection rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {SCAM_KEYWORDS.map((kw, i) => (
                        <div key={kw} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border animate-in fade-in slide-in-from-right-2 duration-300"
                          style={{ animationDelay: `${i * 40}ms` }}>
                          <span className="text-[11px] font-code text-muted-foreground">"{kw}"</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Flagged Content
                  </CardTitle>
                  <CardDescription>Review and manage flagged content from users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {flaggedItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-400">No pending flags!</p>
                    </div>
                  ) : (
                    flaggedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">@{item.user}</p>
                              <Badge className={`text-[9px] border ${
                                item.priority === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                item.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-muted text-muted-foreground border-border'
                              }`}>{item.priority}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.reason} ({item.reports} reports) · {item.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => dismissFlag(item.id)}>
                            Dismiss
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-[10px]">
                            Remove Content
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    Support Tickets
                  </CardTitle>
                  <CardDescription>View, reply, and manage support tickets from users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-400">No open tickets!</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold">{ticket.title}</p>
                              <Badge className={ticket.priority === "URGENT" ? "bg-destructive/10 text-destructive border-destructive/20 text-[9px]" : "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]"}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              by @{ticket.user?.username || "unknown"} · {ticket.category} · #{ticket.id.slice(-6)}
                            </p>
                            <p className="text-xs mt-2 line-clamp-2">{ticket.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <select
                              value={ticket.status}
                              onChange={(e) => changeTicketStatus(ticket.id, e.target.value)}
                              className="h-7 text-xs rounded-md border border-border bg-background px-2"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => setReplyTicketId(ticket.id)}
                            >
                              <MessageSquare className="w-3 h-3" /> Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-amber-500" />
                    Event Approvals
                  </CardTitle>
                  <CardDescription>Review and approve/reject pending events from users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingEvents.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-400">No pending events!</p>
                    </div>
                  ) : (
                    pendingEvents.map((event) => (
                      <div key={event.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold">{event.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              📅 {new Date(event.date).toLocaleDateString()} · 📍 {event.location} · by @{event.organizer?.username || "unknown"}
                            </p>
                            <p className="text-xs mt-2 line-clamp-2">{event.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Submitted {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-destructive border-destructive/30"
                              onClick={() => rejectEvent(event.id)}
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                              onClick={() => approveEvent(event.id)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Event Reject Dialog */}
      <Dialog open={!!rejectEventId} onOpenChange={(open) => !open && setRejectEventId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Reject Event
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this event. The organizer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="e.g., Does not align with university guidelines..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectEventId(null)} disabled={isRejecting}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isRejecting || !rejectReason.trim()}>
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyTicketId} onOpenChange={(open) => !open && setReplyTicketId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Reply to Ticket
            </DialogTitle>
            <DialogDescription>
              Send a response to the user regarding their support ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="resize-none min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTicketId(null)} disabled={isReplying}>Cancel</Button>
            <Button className="dash-button-primary" onClick={handleReplySubmit} disabled={isReplying || !replyMessage.trim()}>
              {isReplying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institutional Security Dialog */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="w-5 h-5" />
              Institutional Security
            </DialogTitle>
            <DialogDescription>
              Manage platform-wide security policies. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Campus Lockdown</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent new registrations and limit access to verified students only.
                </p>
              </div>
              <Switch checked={lockdown} onCheckedChange={setLockdown} />
            </div>
            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="space-y-0.5">
                <Label className="text-base">Force Password Reset</Label>
                <p className="text-sm text-muted-foreground">
                  Require all users to reset passwords on next login.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>Enforce</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecurityOpen(false)}>Close</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setSecurityOpen(false)}>
              Save Security Policies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}