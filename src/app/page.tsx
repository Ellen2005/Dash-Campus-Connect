"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostDialog } from "@/components/feed/create-post-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryViewer, type Story } from "@/components/shared/story-viewer";
import {
  Megaphone, PlusCircle, Filter, Sparkles, ShieldCheck,
  ArrowRight, Bell, AlertTriangle, TrendingUp, Users, CalendarDays, ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const user = null;
  if (user) return <AuthenticatedFeed />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-headline font-black text-xl">D</div>
          <div>
            <span className="block font-headline font-bold text-lg tracking-tight leading-none">Dash</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Campus Connect</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-semibold">Sign In</Button></Link>
          <Link href="/register"><Button size="sm" className="dash-button-primary h-9 px-4 text-sm">Get Started</Button></Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-28 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-7 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Campus pulse, instantly.
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold leading-[1.08] tracking-tight">
            Your campus,<br /><span className="gradient-text">all in one place.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">
            Feed, marketplace, events, announcements — one verified platform for your entire university community.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link href="/register">
              <Button className="dash-button-primary h-11 px-6 text-sm group">
                Join Your Campus <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified .edu emails only
            </div>
          </div>
          <div className="flex items-center gap-6 pt-2">
            {[["10k+", "Students"], ["500+", "Events/mo"], ["98%", "Uptime"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-xl font-headline font-bold text-primary">{val}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in-95 duration-500 delay-150">
          <div className="relative max-w-sm mx-auto">
            <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-float" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/8 blur-3xl animate-float animation-delay-300" />
            <div className="dash-card p-4 rotate-2 shadow-2xl relative z-20 animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30" />
                <div className="space-y-1"><div className="w-20 h-2 bg-foreground/10 rounded" /><div className="w-12 h-1.5 bg-foreground/6 rounded" /></div>
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="space-y-1.5 mb-3"><div className="w-full h-2 bg-foreground/8 rounded" /><div className="w-3/4 h-2 bg-foreground/6 rounded" /></div>
              <div className="w-full h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/10" />
            </div>
            <div className="dash-card p-3.5 -rotate-2 shadow-xl relative z-10 -mt-6 ml-8 animate-slide-in-left" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest">📢 Official</div>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              </div>
              <p className="text-xs font-semibold mb-1">Campus Announcement</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Graduation registration is now open for Class of 2025.</p>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-border/50">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-headline font-bold">Everything you need</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">Built for students, trusted by institutions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, title: "Campus Feed", desc: "Real-time posts, memes, and questions from your campus." },
            { icon: Users, title: "Study Groups", desc: "Find and join groups by department, year, or interest." },
            { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell textbooks, gear, and more with peers." },
            { icon: CalendarDays, title: "Events", desc: "Discover clubs, workshops, and social gatherings." },
          ].map((f, i) => (
            <div key={f.title} className="feature-card-glow dash-card p-5 space-y-3 cursor-pointer animate-in fade-in duration-300" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-9 h-9 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest border-t border-border/30">
        © 2025 Dash — Campus Connect · Built for Students
      </footer>
    </div>
  );
}

const MOCK_STORIES: Story[] = [
  { id: "s1", user: "Football 🏈", avatar: "", isLive: true, items: [{ type: "text", text: "LIVE: Campus vs Tech — 2nd Half!", bg: "bg-gradient-to-br from-destructive/80 to-destructive/40" }] },
  { id: "s2", user: "Hackathon", avatar: "", items: [{ type: "image", src: "https://picsum.photos/seed/hack/400/700" }, { type: "text", text: "48 hours of building! 🚀", bg: "bg-gradient-to-br from-primary/80 to-primary/40" }] },
  { id: "s3", user: "Cafe Deals", avatar: "", items: [{ type: "text", text: "☕ 20% off all drinks today!", bg: "bg-gradient-to-br from-amber-600/80 to-amber-400/40" }] },
  { id: "s4", user: "Library", avatar: "", items: [{ type: "image", src: "https://picsum.photos/seed/lib/400/700" }] },
];

export function AuthenticatedFeed() {
  const { t } = useI18n();
  const [activeChannel, setActiveChannel] = useState("all");
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyIdx, setStoryIdx] = useState(0);

  const channels = ["all", "general", "lost-and-found", "course-reviews", "housing"];

  const announcements = [{
    id: "a1",
    author: { name: "University Registry", username: "registry_official", avatar: "https://picsum.photos/seed/reg/100/100", isVerified: true },
    content: "IMPORTANT: Graduation registration for Class of 2025 is now open. Please ensure all outstanding fees are settled by Friday to avoid delays.",
    timestamp: "2h ago", score: 45, comments: 12, isAnnouncement: true,
  }];

  const allPosts = [
    { id: "p1", author: { name: "Alex Rivera", username: "arivera_comp", avatar: "https://picsum.photos/seed/alex/100/100", flair: "Engineering '26" }, content: "Just finished the distributed systems project! If anyone needs help with the Raft algorithm implementation, hit me up. #ComputerScience #Raft", image: "https://picsum.photos/seed/code/800/400", timestamp: "15m ago", score: 124, comments: 18, channel: "general" },
    { id: "p2", author: { name: "Campus Dining", username: "dine_dash", avatar: "https://picsum.photos/seed/dine/100/100", isVerified: true }, content: "Friday Special: Sushi Bar is back at the main cafeteria! Students get a 10% discount with their Dash profile QR code. 🍣✨", timestamp: "1h ago", score: 89, comments: 4, channel: "general" },
    { id: "p3", author: { name: "Jordan Lee", username: "jlee_arts", avatar: "https://picsum.photos/seed/jordan/100/100", flair: "Arts '25" }, content: "Lost my blue North Face jacket near the library yesterday evening. Has my student ID inside. Please DM if found! 🙏", timestamp: "3h ago", score: 34, comments: 7, channel: "lost-and-found" },
    { id: "p4", author: { name: "Study Squad", username: "study_squad_eng", avatar: "https://picsum.photos/seed/squad/100/100", flair: "Study Group" }, content: "Looking for 2 more people to join our Algorithms study group! We meet every Tuesday at 6pm in the library. DM to join. 📚", timestamp: "5h ago", score: 56, comments: 11, channel: "course-reviews" },
  ];

  const posts = activeChannel === "all" ? allPosts : allPosts.filter(p => p.channel === activeChannel);

  const openStory = (idx: number) => { setStoryIdx(idx); setStoryOpen(true); };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-headline font-bold">{t("campusFeed")}</h1>
        <div className="flex items-center gap-2">
          <button className="relative w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
          </button>
          <CreatePostDialog />
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-xs text-destructive/80">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Automated scam filters active — flagged posts go to admin review.</span>
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
        {channels.map(ch => (
          <button key={ch} onClick={() => setActiveChannel(ch)}
            className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-150 whitespace-nowrap border",
              activeChannel === ch ? "channel-pill-active" : "channel-pill-inactive"
            )}>
            #{ch}
          </button>
        ))}
      </div>

      {/* Stories */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 border-b border-border/50">
        <button
          onClick={() => {/* open create story */ }}
          className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/20 hover:border-primary/40 transition-colors">
            <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground">{t("addStory")}</span>
        </button>
        {MOCK_STORIES.map((s, i) => (
          <button key={s.id} onClick={() => openStory(i)} className="flex flex-col items-center gap-1 min-w-[60px] group">
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
        {announcements.map((a, i) => (
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
    </div>
  );
}
