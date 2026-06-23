"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ticket, Megaphone, Flag, CalendarCheck, Users, CheckCircle2,
  XCircle, Clock, AlertTriangle, Loader2, Eye, ArrowRight, X
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export default function StudentAdminPage() {
  const { toast } = useToast();
  const { user, dashUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [activeTab, setActiveTab] = useState("tickets");

  // Event rejection state
  const [rejectEventId, setRejectEventId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    // Check if user is student admin
    if (!user) return;
    if (!dashUser?.isStudentAdmin && dashUser?.role !== "student_admin") {
      router.push("/main");
      return;
    }
    fetchData();
  }, [user, dashUser, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, eventsRes, flagsRes] = await Promise.all([
        fetch("/api/support?status=OPEN&priority=HIGH", { cache: "no-store" }),
        fetch("/api/events?status=PENDING", { cache: "no-store" }),
        fetch("/api/moderation/flags?status=PENDING", { cache: "no-store" }),
      ]);

      const ticketsJson = await ticketsRes.json().catch(() => ({}));
      const eventsJson = await eventsRes.json().catch(() => ({}));
      const flagsJson = await flagsRes.json().catch(() => ({}));

      if (Array.isArray(ticketsJson?.tickets)) setTickets(ticketsJson.tickets);
      if (Array.isArray(eventsJson?.events)) setPendingEvents(eventsJson.events);
      if (Array.isArray(flagsJson?.flags)) setFlaggedContent(flagsJson.flags);
    } catch (e) {
      console.error("Failed to fetch student admin data:", e);
    } finally {
      setLoading(false);
    }
  };

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
        toast({ title: "Flag dismissed", description: "The flag has been dismissed." });
        setFlaggedContent((prev) => prev.filter((f) => f.id !== flagId));
      }
    } catch {
      toast({ title: "Error", description: "Failed to dismiss flag.", variant: "destructive" });
    }
  };

  if (!user || !dashUser?.isStudentAdmin) {
    return null;
  }

  const stats = [
    { label: "Open Tickets", value: tickets.length, icon: Ticket, color: "text-blue-500", tab: "tickets" },
    { label: "Pending Events", value: pendingEvents.length, icon: CalendarCheck, color: "text-amber-500", tab: "events" },
    { label: "Flagged Content", value: flaggedContent.length, icon: Flag, color: "text-red-500", tab: "flags" },
  ];

  const navigateToEvents = () => setActiveTab("events");

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
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs gap-1.5 dash-button-primary" onClick={navigateToEvents}>
            <CalendarCheck className="w-3.5 h-3.5" /> 
            {pendingEvents.length > 0 ? `Approvals (${pendingEvents.length})` : "Event Approvals"}
          </Button>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {dashUser.fullName}
          </Badge>
        </div>
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
              <Card key={stat.label} onClick={() => setActiveTab(stat.tab)} className="cursor-pointer hover:bg-muted/50 transition-colors border-border">
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          </Tabs>

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
                  {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}