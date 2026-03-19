
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Megaphone
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Students", value: "8,432", icon: Users, color: "text-blue-500", trend: "+12% this week" },
    { label: "Posts Today", value: "1,240", icon: FileText, color: "text-primary", trend: "+5% vs yesterday" },
    { label: "Flagged Content", value: "14", icon: AlertTriangle, color: "text-destructive", trend: "7 high priority" },
    { label: "Open Tickets", value: "42", icon: HelpCircle, color: "text-emerald-500", trend: "12 waiting > 24h" },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Console</h1>
          <p className="text-muted-foreground">Platform health and institutional moderation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics Export
          </Button>
          <Link href="/admin/announcements">
            <Button size="sm" className="gap-2 champagne-gradient font-bold">
              <Megaphone className="w-4 h-4" />
              New Broadcast
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="obsidian-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-card/50 border ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-headline font-bold">{stat.value}</h3>
                <p className="text-[10px] text-muted-foreground">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 obsidian-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Moderation Queue</CardTitle>
            <CardDescription>Items flagged by users or AI for review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 1, user: "jdoe23", reason: "Potential Spam", reports: 4, timestamp: "10m ago" },
              { id: 2, user: "sarah_m", reason: "Inappropriate Media", reports: 8, timestamp: "25m ago" },
              { id: 3, user: "anon_user", reason: "Harassment", reports: 3, timestamp: "1h ago" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center font-bold text-xs">
                    {item.user[0].toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">@{item.user}</p>
                    <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {item.reason} ({item.reports} reports)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
                  <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                    Review
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="link" className="w-full text-xs text-muted-foreground">View all flagged content</Button>
          </CardContent>
        </Card>

        <Card className="obsidian-card">
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>Real-time platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { label: "Server Response", value: "48ms", status: "good" },
                { label: "FCM Push Success", value: "98.2%", status: "good" },
                { label: "Active Sessions", value: "1,452", status: "neutral" },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-code">{metric.value}</span>
                    <div className={`w-2 h-2 rounded-full ${metric.status === 'good' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-border space-y-3">
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
      </div>
    </div>
  );
}
