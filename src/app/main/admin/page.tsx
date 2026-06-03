"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  Filter,
  CheckCircle2,
  Loader2
} from "lucide-react";
import Link from "next/link";

const SCAM_KEYWORDS = ["fast cash", "crypto", "investment opportunity", "wire transfer", "western union", "guaranteed returns", "make money fast"];

export default function AdminDashboard() {
  const [resolvedItems, setResolvedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Students", value: "—", icon: Users, color: "text-primary", trend: "Loading..." },
    { label: "Posts Today",     value: "—", icon: FileText, color: "text-primary",  trend: "Loading..." },
    { label: "Flagged Content", value: "—", icon: AlertTriangle, color: "text-destructive", trend: "Loading..." },
    { label: "Open Tickets",   value: "—", icon: HelpCircle, color: "text-primary",  trend: "Loading..." },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersRes, postsRes, flagsRes, ticketsRes] = await Promise.all([
          fetch("/api/admin/users?status=active", { cache: "no-store" }),
          fetch("/api/posts?limit=1&today=true", { cache: "no-store" }).catch(() => null),
          fetch("/api/moderation/flags?status=PENDING", { cache: "no-store" }).catch(() => null),
          fetch("/api/support?status=OPEN", { cache: "no-store" }).catch(() => null),
        ]);

        const usersJson = await usersRes.json().catch(() => ({}));
        const usersCount = Array.isArray(usersJson?.users) ? usersJson.users.length : "—";
        const usersTrend = typeof usersCount === "number" ? `${usersCount} active students` : "Loading...";

        // Posts - estimate from count header or length
        let postsCount = "—";
        let postsTrend = "Loading...";
        if (postsRes?.ok) {
          const postsJson = await postsRes.json().catch(() => ({}));
          if (Array.isArray(postsJson?.posts)) {
            postsCount = postsJson.posts.length;
            postsTrend = `${postsCount} today`;
          }
        }

        // Flags
        let flagsCount = "—";
        let flagsTrend = "Loading...";
        if (flagsRes?.ok) {
          const flagsJson = await flagsRes.json().catch(() => ({}));
          if (Array.isArray(flagsJson?.flags)) {
            flagsCount = flagsJson.flags.length;
            flagsTrend = `${flagsCount} pending review`;
          }
        }

        // Tickets
        let ticketsCount = "—";
        let ticketsTrend = "Loading...";
        if (ticketsRes?.ok) {
          const ticketsJson = await ticketsRes.json().catch(() => ({}));
          if (Array.isArray(ticketsJson?.tickets)) {
            ticketsCount = ticketsJson.tickets.length;
            const oldTickets = ticketsJson.tickets.filter((t: any) => {
              const age = Date.now() - new Date(t.createdAt).getTime();
              return age > 24 * 60 * 60 * 1000;
            }).length;
            ticketsTrend = `${oldTickets} waiting > 24h`;
          }
        }

        setStats([
          { label: "Total Students", value: String(usersCount), icon: Users, color: "text-primary", trend: usersTrend },
          { label: "Posts Today", value: String(postsCount), icon: FileText, color: "text-primary", trend: postsTrend },
          { label: "Flagged Content", value: String(flagsCount), icon: AlertTriangle, color: "text-destructive", trend: flagsTrend },
          { label: "Open Tickets", value: String(ticketsCount), icon: HelpCircle, color: "text-primary", trend: ticketsTrend },
        ]);
      } catch {
        // Keep default state
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const flaggedItems = [
    { id: 1, user: "jdoe23", reason: "Potential Spam", reports: 4, timestamp: "10m ago", priority: "high" },
    { id: 2, user: "sarah_m", reason: "Inappropriate Media", reports: 8, timestamp: "25m ago", priority: "critical" },
    { id: 3, user: "anon_user", reason: "Harassment", reports: 3, timestamp: "1h ago", priority: "medium" },
  ];

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
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analytics...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card
              key={stat.label}
              className="dash-card-hover animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 80}ms` }}
            >
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 dash-card-hover animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
          <CardHeader>
            <CardTitle className="text-lg">Recent Moderation Queue</CardTitle>
            <CardDescription>Items flagged by users or AI for review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flaggedItems.map((item) => (
              resolvedItems.includes(item.id) ? null : (
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                      onClick={() => setResolvedItems(r => [...r, item.id])}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              )
            ))}
            {resolvedItems.length === flaggedItems.length && (
              <div className="flex flex-col items-center gap-2 py-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-sm font-bold text-emerald-400">All items resolved!</p>
              </div>
            )}
            <Button variant="link" className="w-full text-xs text-muted-foreground">View all flagged content</Button>
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
                  { label: "Server Response", value: "48ms", status: "good" as const },
                  { label: "FCM Push Success", value: "98.2%", status: "good" as const },
                  { label: "Active Sessions", value: "1,452", status: "neutral" as const },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono">{metric.value}</span>
                      <div className={`w-2 h-2 rounded-full ${metric.status === 'good' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary'}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Actions</h4>
                <div className="grid gap-2">
                  <Button variant="outline" size="sm" className="justify-between h-9 text-xs group">
                    User Management
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="sm" className="justify-between h-9 text-xs group">
                    Institutional Security
                    <ShieldCheck className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Filter Panel */}
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
                <div
                  key={kw}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border animate-in fade-in slide-in-from-right-2 duration-300"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-[11px] font-code text-muted-foreground">"{kw}"</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}