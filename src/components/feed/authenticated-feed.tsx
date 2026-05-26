"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostDialog } from "@/components/feed/create-post-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Filter, Bell, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// Posts API is currently normalized as "general" for now.
const CHANNELS = ["all", "general"];

export function AuthenticatedFeed() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("all");
  const [realPosts, setRealPosts] = useState<any[]>([]);
  const [realAnnouncements, setRealAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const postsRes = await fetch("/api/posts?limit=50", { cache: "no-store" });
        const postsJson = await postsRes.json().catch(() => ({} as any));
        const normalizedPosts = Array.isArray(postsJson?.posts)
          ? postsJson.posts.map((p: any) => ({
              id: p.id,
              author: {
                name: p.author?.name ?? "Student",
                username: p.author?.username ?? "student",
                avatar: p.author?.profilePhoto ?? "",
              },
              content: p.content ?? "",
              image: Array.isArray(p.images) ? p.images[0] : undefined,
              timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : "now",
              score: Array.isArray(p.likes) ? p.likes.length : 0,
              comments: Array.isArray(p.comments) ? p.comments.length : 0,
              channel: "general",
            }))
          : [];
        setRealPosts(normalizedPosts);
      } catch {
        setRealPosts([]);
      }

      if (!user?.id) return;
      try {
        const annRes = await fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" });
        const annJson = await annRes.json().catch(() => ({} as any));
        const normalizedAnnouncements = Array.isArray(annJson?.notifications)
          ? annJson.notifications
              .filter((n: any) => n.type === "SYSTEM_ALERT")
              .map((n: any) => ({
                id: `an-${n.id}`,
                author: { name: "School Admin", username: "school_admin", avatar: "", isVerified: true },
                content: n.message,
                actionUrl: n.actionUrl ?? undefined,
                timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : "now",
                score: 0,
                comments: 0,
                isAnnouncement: true,
              }))
          : [];
        setRealAnnouncements(normalizedAnnouncements);
      } catch {
        setRealAnnouncements([]);
      }
    };
    run();
  }, [user?.id]);

  const posts = activeChannel === "all" ? realPosts : realPosts.filter((p: any) => p.channel === activeChannel);
  const mergedAnnouncements = realAnnouncements;

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-headline font-bold">{t("campusFeed")}</h1>
        <div className="flex items-center gap-2">
          <Link href="/main/notifications">
            <button className="relative w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
            </button>
          </Link>
          <CreatePostDialog />
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-xs text-destructive/80">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{t("scamFilterNotice")}</span>
      </div>

      <Tabs defaultValue="following">
        <div className="flex items-center justify-between border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-5">
            {(["following", "explore", "peek"] as const).map((v, i) => (
              <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
                {[t("following"), t("trending"), t("peek")][i]}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Tabs>

      {/* Channel filter pills — "all" shows everything, "general" shows only general posts */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {CHANNELS.map(ch => (
          <button key={ch} onClick={() => setActiveChannel(ch)}
            className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-150 whitespace-nowrap border",
              activeChannel === ch ? "channel-pill-active" : "channel-pill-inactive"
            )}>
            #{ch}
          </button>
        ))}
      </div>

      {/* Announcements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Megaphone className="w-3 h-3 text-primary" /> {t("officialAnnouncements")}
        </div>
        {mergedAnnouncements.map((a: any, i: number) => (
          <div key={a.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
            <PostCard {...a} />
          </div>
        ))}
      </div>

      {/* Feed posts */}
      <div className="space-y-4 pb-16">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No posts in #{activeChannel} yet.</p>
            <p className="text-xs mt-1">Be the first to post here!</p>
          </div>
        ) : posts.map((p: any, i: number) => (
          <div key={p.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
            <PostCard {...p} />
          </div>
        ))}
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">
            <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
            {t("allCaughtUp")}
          </div>
        </div>
      </div>

      <OnboardingTour />
    </div>
  );
}
