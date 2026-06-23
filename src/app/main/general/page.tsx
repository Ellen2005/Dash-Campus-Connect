"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Megaphone, TrendingUp, Users, Calendar, ShoppingBag, HelpCircle,
  Users2, BookOpen, AlertTriangle, X, CheckCircle2, ExternalLink,
  Send, Loader2, Sparkles, Library
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { LibraryTab } from "@/components/library/library-tab";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishedAt: string;
  dismissed?: boolean;
};

type TrendingTag = { tag: string; posts: number };
type SuggestedUser = { id: string; name: string; username: string; avatar?: string | null; verified?: boolean };

type CampusStats = {
  students: number;
  communities: number;
  eventsThisWeek: number;
};

export default function GeneralPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [stats, setStats] = useState<CampusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Broadcast dialog state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dashUser?.schoolId) params.set("schoolId", dashUser.schoolId);
        if (dashUser?.id) params.set("currentUserId", dashUser.id);

        const [annRes, sideRes, statsRes, userRes] = await Promise.all([
          fetch(`/api/announcements?${params}`, { cache: "no-store" }),
          fetch(`/api/sidebar?${params}`, { cache: "no-store" }),
          fetch(`/api/campus-stats?${params}`, { cache: "no-store" }),
          dashUser?.id ? fetch(`/api/users/${dashUser.id}`, { cache: "no-store" }) : Promise.resolve(null),
        ]);

        const annJson = await annRes.json().catch(() => ({}));
        const sideJson = await sideRes.json().catch(() => ({}));
        const statsJson = await statsRes.json().catch(() => ({}));
        const userJson = dashUser?.id ? await userRes?.json().catch(() => ({})) : {};

        const dismissedAnnouncements = Array.isArray(userJson?.notificationPrefs?.dismissedAnnouncements)
          ? userJson.notificationPrefs.dismissedAnnouncements
          : [];

        if (Array.isArray(annJson?.announcements)) {
          setAnnouncements(
            annJson.announcements
              .filter((a: any) => !dismissedAnnouncements.includes(a.id))
              .map((a: any) => ({
                id: a.id,
                title: a.title,
                content: a.content,
                priority: a.priority,
                publishedAt: a.publishedAt,
              }))
          );
        }
        if (Array.isArray(sideJson?.trending)) setTrending(sideJson.trending);
        if (Array.isArray(sideJson?.suggested)) setSuggested(sideJson.suggested);
        if (statsJson?.stats) setStats(statsJson.stats);
      } catch (e) {
        console.error("Failed to load campus hub:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dashUser?.schoolId, dashUser?.id]);

  const dismissAnnouncement = async (id: string) => {
    setDismissingId(id);
    try {
      await fetch(`/api/announcements/${id}/dismiss`, { method: "POST" });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      toast({ title: "Error", description: "Failed to dismiss announcement", variant: "destructive" });
    } finally {
      setDismissingId(null);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to send");
      toast({ title: "📢 Announcement sent!", description: `Delivered to ${json?.delivered ?? 0} students.` });
      setBroadcastOpen(false);
      setBroadcastMsg("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const isAdmin = dashUser?.role === "ADMIN" || dashUser?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6 pb-20 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-extrabold tracking-tight">Campus Hub</h1>
          <p className="text-sm text-muted-foreground">Your central campus dashboard</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="dash-button-primary h-8 text-xs gap-1.5" onClick={() => setBroadcastOpen(true)}>
            <Megaphone className="w-3.5 h-3.5" /> Broadcast
          </Button>
        )}
      </div>

      {/* Scam/Spam Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/80">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Stay safe on campus. Report suspicious messages, scams, or fake listings. Never share personal or financial info with strangers.</span>
        <Link href="/main/support">
          <Button variant="outline" size="sm" className="h-7 text-[10px] border-destructive/30 text-destructive shrink-0">Report</Button>
        </Link>
      </div>

      {/* Campus Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-headline font-bold">{stats.students.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Students</p>
            </CardContent>
          </Card>
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <Users2 className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-headline font-bold">{stats.communities.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Communities</p>
            </CardContent>
          </Card>
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-headline font-bold">{stats.eventsThisWeek}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Events This Week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Events", href: "/main/events", icon: Calendar },
          { label: "Marketplace", href: "/main/marketplace", icon: ShoppingBag },
          { label: "Support", href: "/main/support", icon: HelpCircle },
          { label: "Communities", href: "/main/communities", icon: Users2 },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="dash-card-hover cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <link.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start rounded-none">
          {[
            { v: "announcements", label: "Announcements", icon: Megaphone },
            { v: "trending", label: "Trending", icon: TrendingUp },
            { v: "suggested", label: "Suggested", icon: Users },
            { v: "library", label: "Library", icon: Library },
          ].map(({ v, label, icon: Icon }) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground gap-1.5">
              <Icon className="w-3.5 h-3.5" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="announcements" className="pt-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No announcements yet</p>
            </div>
          ) : (
            announcements.map((a, i) => (
              <Card key={a.id} className="dash-card animate-in fade-in duration-200" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      {a.priority === "URGENT" || a.priority === "EMERGENCY" ? (
                        <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 font-bold">Urgent</Badge>
                      ) : null}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismissAnnouncement(a.id)} disabled={dismissingId === a.id}>
                      {dismissingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(a.publishedAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="trending" className="pt-5">
          {trending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No trending topics yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trending.map((trend, i) => (
                <Link key={trend.tag} href={`/main/search?q=${encodeURIComponent(trend.tag)}`}>
                  <Card className="dash-card-hover cursor-pointer animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                        <span className="text-sm font-semibold text-primary">#{trend.tag}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{trend.posts} posts</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="pt-5">
          {suggested.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No suggested users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggested.map((u, i) => (
                <Card key={u.id} className="dash-card animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <Link href={`/main/profile/${u.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={u.avatar ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold truncate">{u.name}</p>
                          {u.verified && <span className="verified-badge text-[10px]">✓</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </Link>
                    <Button asChild size="sm" variant="outline" className="h-7 text-[10px] px-2.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 shrink-0">
                      <Link href={`/main/profile/${u.username}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="pt-5">
          <LibraryTab schoolId={dashUser?.schoolId} />
        </TabsContent>
      </Tabs>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Broadcast Announcement
            </DialogTitle>
            <DialogDescription>Send an official announcement to all students at your school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Message</Label>
              <Textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type your announcement..."
                className="min-h-[120px] resize-none text-sm bg-muted/30"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{broadcastMsg.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setBroadcastOpen(false)} disabled={sending}>Cancel</Button>
            <Button size="sm" className="dash-button-primary h-8 px-4 text-xs" onClick={sendBroadcast} disabled={sending || !broadcastMsg.trim()}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              Send to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}