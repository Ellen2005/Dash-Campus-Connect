"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostDialog } from "@/components/feed/create-post-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryViewer, type Story } from "@/components/shared/story-viewer";
import { Megaphone, PlusCircle, Filter, Bell, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import { AddStoryDialog } from "@/components/shared/add-story-dialog";
import Link from "next/link";

const MOCK_STORIES: Story[] = [
  { id: "s1", user: "Football 🏈", avatar: "", isLive: true, items: [{ type: "text", text: "LIVE: Campus vs Tech — 2nd Half!", bg: "bg-gradient-to-br from-destructive/80 to-destructive/40" }] },
  { id: "s2", user: "Hackathon",   avatar: "", items: [{ type: "image", src: "https://picsum.photos/seed/hack/400/700" }] },
  { id: "s3", user: "Cafe Deals",  avatar: "", items: [{ type: "text", text: "☕ 20% off all drinks today!", bg: "bg-gradient-to-br from-amber-600/80 to-amber-400/40" }] },
  { id: "s4", user: "Library",     avatar: "", items: [{ type: "image", src: "https://picsum.photos/seed/lib/400/700" }] },
];

const ALL_POSTS = [
  { id: "p1", author: { name: "Alex Rivera",   username: "arivera_comp",    avatar: "https://picsum.photos/seed/alex/100/100",   flair: "Engineering '26" }, content: "Just finished the distributed systems project! If anyone needs help with the Raft algorithm implementation, hit me up. #ComputerScience #Raft", image: "https://picsum.photos/seed/code/800/400", timestamp: "15m ago", score: 124, comments: 18, channel: "general" },
  { id: "p2", author: { name: "Campus Dining", username: "dine_dash",       avatar: "https://picsum.photos/seed/dine/100/100",   isVerified: true },          content: "Friday Special: Sushi Bar is back at the main cafeteria! Students get a 10% discount with their Dash profile QR code. 🍣✨", timestamp: "1h ago", score: 89, comments: 4, channel: "general" },
  { id: "p3", author: { name: "Jordan Lee",    username: "jlee_arts",       avatar: "https://picsum.photos/seed/jordan/100/100", flair: "Arts '25" },          content: "Lost my blue North Face jacket near the library yesterday evening. Has my student ID inside. Please DM if found! 🙏", timestamp: "3h ago", score: 34, comments: 7, channel: "lost-and-found" },
  { id: "p4", author: { name: "Study Squad",   username: "study_squad_eng", avatar: "https://picsum.photos/seed/squad/100/100", flair: "Study Group" },        content: "Looking for 2 more people to join our Algorithms study group! We meet every Tuesday at 6pm in the library. DM to join. 📚", timestamp: "5h ago", score: 56, comments: 11, channel: "course-reviews" },
];

const ANNOUNCEMENTS = [{
  id: "a1",
  author: { name: "University Registry", username: "registry_official", avatar: "https://picsum.photos/seed/reg/100/100", isVerified: true },
  content: "IMPORTANT: Graduation registration for Class of 2025 is now open. Please ensure all outstanding fees are settled by Friday to avoid delays.",
  timestamp: "2h ago", score: 45, comments: 12, isAnnouncement: true,
}];

const CHANNELS = ["all", "general", "lost-and-found", "course-reviews", "housing"];

export function AuthenticatedFeed() {
  const { t } = useI18n();
  const [activeChannel, setActiveChannel] = useState("all");
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyIdx, setStoryIdx] = useState(0);
  const [addStoryOpen, setAddStoryOpen] = useState(false);

  const posts = activeChannel === "all" ? ALL_POSTS : ALL_POSTS.filter(p => p.channel === activeChannel);

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-headline font-bold">{t("campusFeed")}</h1>
        <div className="flex items-center gap-2">
          <button className="relative w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
            <Link href="/main/notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
            </Link>
          </button>
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

      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 border-b border-border/50">
        <button onClick={() => setAddStoryOpen(true)} className="flex flex-col items-center gap-1 min-w-[60px] group">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/20 hover:border-primary/40 transition-colors">
            <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground">{t("addStory")}</span>
        </button>
        {MOCK_STORIES.map((s, i) => (
          <button key={s.id} onClick={() => { setStoryIdx(i); setStoryOpen(true); }} className="flex flex-col items-center gap-1 min-w-[60px] group">
            <div className={cn("w-12 h-12 rounded-full border-2 p-0.5 transition-transform group-hover:scale-105",
              s.isLive ? "border-destructive" : "border-primary/50"
            )}>
              <div className={cn("w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold",
                s.isLive ? "bg-destructive text-white" : "bg-primary/15 text-primary"
              )}>
                {s.isLive ? t("liveNow") : s.user[0]}
              </div>
            </div>
            <span className="text-[9px] font-semibold text-foreground/80 truncate max-w-[60px]">{s.user}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Megaphone className="w-3 h-3 text-primary" /> {t("officialAnnouncements")}
        </div>
        {ANNOUNCEMENTS.map((a, i) => (
          <div key={a.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
            <PostCard {...a} />
          </div>
        ))}
      </div>

      <div className="space-y-4 pb-16">
        {posts.map((p, i) => (
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

      <StoryViewer stories={MOCK_STORIES} initialIndex={storyIdx} open={storyOpen} onClose={() => setStoryOpen(false)} />
      <AddStoryDialog open={addStoryOpen} onClose={() => setAddStoryOpen(false)} />
      <OnboardingTour />
    </div>
  );
}
