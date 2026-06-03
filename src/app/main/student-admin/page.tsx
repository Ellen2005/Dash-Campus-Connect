"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DlgDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Ticket, Megaphone, Flag, CalendarCheck, Users, CheckCircle2,
  XCircle, Clock, AlertTriangle, Loader2, Eye, ArrowRight, Plus, Send,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type SupportTicket = {
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
  organizer: { name: string; username: string };
  createdAt: string;
};

type FlaggedContent = {
  id: string;
  reason: string;
  status: string;
  reports: number;
  content: string;
  user: { name: string; username: string };
  createdAt: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
};

export default function StudentAdminPage() {
  const { toast } = useToast();
  const { user, dashUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "NORMAL" });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  useEffect(() => {
    if (!user || (dashUser?.role !== "student_admin" && dashUser?.role !== "admin")) {
      router.push("/main");
      return;
    }
    fetchData();
  }, [user, dashUser, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, eventsRes, flagsRes, announcementsRes] = await Promise.all([
        fetch("/api/support?status=OPEN&priority=HIGH", { cache: "no-store" }),
        fetch("/api/events?approvalStatus=PENDING", { cache: "no-store" }),
        fetch("/api/moderation/flags?status=PENDING", { cache: "no-store" }),
        dashUser?.schoolId
          ? fetch(`/api/announcements?schoolId=${dashUser.schoolId}`, { cache: "no-store" })
          : Promise.resolve(null),
      ]);

      const ticketsJson = await ticketsRes.json().catch(() => ({}));
      const eventsJson = await eventsRes.json().catch(() => ({}));
      const flagsJson = await flagsRes.json().catch(() => ({}));

      if (Array.isArray(ticketsJson?.tickets)) setTickets(ticketsJson.tickets);
      if (Array.isArray(eventsJson?.events)) setPendingEvents(eventsJson.events);
      if (Array.isArray(flagsJson?.flags)) setFlaggedContent(flagsJson.flags);

      if (announcementsRes?.ok) {
        const announcementsJson = await announcementsRes.json().catch(() => ({}));
        if (Array.isArray(announcementsJson?.announcements)) setAnnouncements(announcementsJson.announcements);
      }
    } catch (e) {
      console.error("Failed to fetch student admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser?.schoolId) return;
    setCreatingAnnouncement(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: announcementForm.title.trim(),
          content: announcementForm.content.trim(),
          schoolId: dashUser.schoolId,
          authorId: dashUser.id,
          priority: announcementForm.priority,
          status: "PUBLISHED",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create announcement.");
      setAnnouncementDialogOpen(false);
      setAnnouncementForm({ title: "", content: "", priority: "NORMAL" });
      toast({ title: "Announcement published!" });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const approveEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "APPROVED", approverId: dashUser?.id }),
      });
      if (res.ok) {
        toast({ title: "Event approved", description: "The event is now visible." });
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Error", description: json?.error ?? "Failed to approve.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const rejectEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "REJECTED", approverId: dashUser?.id }),
      });
      if (res.ok) {
        toast({ title: "Event rejected" });
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Error", description: json?.error ?? "Failed to reject.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const dismissFlag = async (flagId: string) => {
    try {
      const res = await fetch(`/api/moderation/flags/${flagId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      if (res.ok) {
        toast({ title: "Flag dismissed", description: "The flag has been dismissed." });
        setFlaggedContent((prev) => prev.filter((f) => f.id !== flagId));
      }
    } catch {
      toast({ title: "Error", description: "Failed to dismiss flag.", variant: "destructive" });
    }
  };

  if (!user || (dashUser?.role !== "student_admin" && dashUser?.role !== "admin")) {
    return null;
  }

  const stats = [
    { label: "Open Tickets", value: tickets.length, icon: Ticket, color: "text-blue-500" },
    { label: "Pending Events", value: pendingEvents.length, icon: CalendarCheck, color: "text-amber-500" },
    { label: "Flagged Content", value: flaggedContent.length, icon: Flag, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Student Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage support tickets, event approvals, and flagged content.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {dashUser.fullName}
        </Badge>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="tickets">
            <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start">
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Support Tickets ({tickets.length})
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Event Approvals ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="flags"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Flagged Content ({flaggedContent.length})
              </TabsTrigger>
              <TabsTrigger
                value="announcements"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Announcements ({announcements.length})
              </TabsTrigger>
            </TabsList>

            {/* Support Tickets */}
            <TabsContent value="tickets" className="pt-4 space-y-3">
              {tickets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No open support tickets.</p>
                  </CardContent>
                </Card>
              ) : (
                tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{ticket.title}</CardTitle>
                            <Badge
                              variant={
                                ticket.priority === "URGENT"
                                  ? "destructive"
                                  : ticket.priority === "HIGH"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {ticket.priority}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <span>#{ticket.id.slice(-6)}</span>
                            <span>·</span>
                            <span>{ticket.category}</span>
                            <span>·</span>
                            <span>by @{ticket.user?.username || "unknown"}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {ticket.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                        <Link href={`/main/support/${ticket.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Event Approvals */}
            <TabsContent value="events" className="pt-4 space-y-3">
              {pendingEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pending event approvals.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{event.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 flex-wrap">
                            <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                            <span>·</span>
                            <span>📍 {event.location}</span>
                            <span>·</span>
                            <span>by @{event.organizer?.username || "unknown"}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Submitted {new Date(event.createdAt).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
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
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Flagged Content */}
            <TabsContent value="flags" className="pt-4 space-y-3">
              {flaggedContent.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No flagged content to review.</p>
                  </CardContent>
                </Card>
              ) : (
                flaggedContent.map((flag) => (
                  <Card key={flag.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium">{flag.reason}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {flag.reports} reports
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {flag.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px]">
                              {flag.user?.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            @{flag.user?.username || "unknown"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => dismissFlag(flag.id)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                          >
                            Remove Content
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Announcements */}
            <TabsContent value="announcements" className="pt-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="dash-button-primary h-8 text-xs gap-1"
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  <Megaphone className="w-3.5 h-3.5" /> New Announcement
                </Button>
              </div>

              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No announcements yet.</p>
                    <p className="text-xs mt-1">Create your first announcement.</p>
                  </CardContent>
                </Card>
              ) : (
                announcements.map((a) => (
                  <Card key={a.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{a.title}</CardTitle>
                            <Badge
                              className={`text-[9px] ${
                                a.priority === "EMERGENCY"
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : a.priority === "URGENT"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {a.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px]">{a.status}</Badge>
                          </div>
                          <CardDescription>
                            {a.publishedAt
                              ? new Date(a.publishedAt).toLocaleDateString()
                              : new Date(a.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{a.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Create announcement dialog */}
              <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Announcement</DialogTitle>
                    <DlgDescription>Create a campus announcement that students will see.</DlgDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Title</Label>
                      <Input value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" className="h-9 text-sm bg-muted/30" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Content</Label>
                      <Textarea value={announcementForm.content} onChange={e => setAnnouncementForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." className="min-h-[100px] text-sm bg-muted/30 resize-none" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Priority</Label>
                      <Select value={announcementForm.priority} onValueChange={(v) => setAnnouncementForm(f => ({ ...f, priority: v }))}>
                        <SelectTrigger className="h-9 text-sm bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" size="sm" className="dash-button-primary" disabled={creatingAnnouncement || !announcementForm.title.trim() || !announcementForm.content.trim()}>
                        {creatingAnnouncement ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Publish
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}