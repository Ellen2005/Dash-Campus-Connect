"use client";

import { useUser } from "@/firebase/provider";
import MainLayout from "./(main)/layout";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, PlusCircle, Filter, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user is logged in, show the main feed
  if (user) {
    return (
      <MainLayout>
        <AuthenticatedFeed />
      </MainLayout>
    );
  }

  // If not logged in, show a beautiful landing/hero
  return (
    <div className="min-h-screen bg-obsidian text-near-white selection:bg-gold/30 selection:text-gold overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl champagne-gradient flex items-center justify-center font-headline font-bold text-2xl text-obsidian shadow-lg">
            D
          </div>
          <span className="font-headline font-bold text-xl tracking-tight hidden sm:block">Dash</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-bold text-muted-foreground hover:text-gold">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="champagne-gradient text-obsidian font-bold rounded-full px-6 h-10">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Exclusive University Connection
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold leading-[1.1] tracking-tight">
            The Social Layer <br />
            <span className="text-gold">For Campus Life.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
            One platform for your social feed, administrative alerts, marketplace, and student connections. Exclusively for your university.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link href="/register">
              <Button className="champagne-gradient text-obsidian font-bold text-lg px-8 h-14 rounded-2xl group w-full sm:w-auto">
                Join Your Campus
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Institutional Security Layer Active
            </div>
          </div>
        </div>

        <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <div className="relative aspect-square max-w-[500px] mx-auto">
            {/* Mockup Card 1 */}
            <div className="absolute top-0 right-0 w-[80%] obsidian-card p-4 rotate-6 shadow-2xl z-20 backdrop-blur-md bg-navy/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold/20" />
                <div className="space-y-1">
                  <div className="w-20 h-2 bg-white/20 rounded" />
                  <div className="w-12 h-1.5 bg-white/10 rounded" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="w-full h-2 bg-white/10 rounded" />
                <div className="w-[80%] h-2 bg-white/10 rounded" />
              </div>
              <div className="w-full aspect-video bg-white/5 rounded-lg border border-white/5" />
            </div>
            {/* Mockup Card 2 */}
            <div className="absolute bottom-10 left-0 w-[70%] obsidian-card p-4 -rotate-3 shadow-2xl z-10 backdrop-blur-md bg-card/80">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold text-gold uppercase tracking-widest">🚨 Emergency Alert</div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <p className="text-xs font-bold mb-2">Campus Closure Update</p>
              <p className="text-[10px] text-muted-foreground">The main library will be closing at 8 PM today for scheduled maintenance.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Daily Users", value: "8.4k+" },
            { label: "Student Posts", value: "150k+" },
            { label: "Market Items", value: "2.5k+" },
            { label: "Help Resolved", value: "99.2%" },
          ].map(stat => (
            <div key={stat.label} className="space-y-1">
              <div className="text-3xl font-headline font-extrabold text-gold">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-40">
        &copy; 2025 DASH — CAMPUS CONNECT • BUILT FOR STUDENTS
      </footer>
    </div>
  );
}

function AuthenticatedFeed() {
  const announcements = [
    {
      id: "a1",
      author: {
        name: "University Registry",
        username: "registry_official",
        avatar: "https://picsum.photos/seed/reg/100/100",
        isVerified: true,
      },
      content: "IMPORTANT: Graduation registration for Class of 2025 is now open. Please ensure all outstanding fees are settled by Friday to avoid delays.",
      timestamp: "2 hours ago",
      likes: 45,
      comments: 12,
      isAnnouncement: true,
    }
  ];

  const posts = [
    {
      id: "p1",
      author: {
        name: "Alex Rivera",
        username: "arivera_comp",
        avatar: "https://picsum.photos/seed/alex/100/100",
      },
      content: "Just finished the distributed systems project! If anyone needs help with the Raft algorithm implementation, hit me up. #ComputerScience #Raft",
      image: "https://picsum.photos/seed/code/800/400",
      timestamp: "15 mins ago",
      likes: 124,
      comments: 18,
    },
    {
      id: "p2",
      author: {
        name: "Campus Dining",
        username: "dine_dash",
        avatar: "https://picsum.photos/seed/dine/100/100",
        isVerified: true,
      },
      content: "Friday Special: Sushi Bar is back at the main cafeteria! Students get a 10% discount with their Dash profile QR code. 🍣✨",
      timestamp: "1 hour ago",
      likes: 89,
      comments: 4,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-headline font-bold">Campus Feed</h1>
          <Button size="sm" className="gap-2 rounded-full champagne-gradient">
            <PlusCircle className="w-4 h-4" />
            Create Post
          </Button>
        </div>
        
        <Tabs defaultValue="following" className="w-full">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="following" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium">Following</TabsTrigger>
              <TabsTrigger value="explore" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium">Explore</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </Tabs>
      </div>

      {/* Announcements Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
          <Megaphone className="w-3 h-3 text-gold" />
          University Announcements
        </div>
        {announcements.map(announcement => (
          <PostCard key={announcement.id} {...announcement} />
        ))}
      </div>

      {/* Main Feed */}
      <div className="space-y-6 pb-20">
        {posts.map(post => (
          <PostCard key={post.id} {...post} />
        ))}
        
        <div className="flex justify-center pt-8">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/50 animate-bounce" />
            <p className="text-[10px] uppercase tracking-widest font-bold">Loading more posts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
