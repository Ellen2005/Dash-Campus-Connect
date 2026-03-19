
"use client";

import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, PlusCircle, Filter } from "lucide-react";

export default function HomePage() {
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
    },
    {
      id: "p3",
      author: {
        name: "Maya Chen",
        username: "mayac",
        avatar: "https://picsum.photos/seed/maya/100/100",
      },
      content: "Selling my Advanced Organic Chemistry textbook (latest edition). Practically new, no highlights. DM if interested! #Marketplace #Chemistry",
      timestamp: "4 hours ago",
      likes: 12,
      comments: 3,
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
          <Megaphone className="w-3 h-3" />
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
        
        <div className="flex justify-center pt-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}
