
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Search, Filter, Calendar as CalendarIcon, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = [
  "All", "Social", "Academic", "Sports", "Career", "Cultural", "Club", "Emergency"
];

const mockEvents = [
  {
    id: "e1",
    title: "Class of 2025 Sunset Mixer",
    bannerImageUrl: "https://picsum.photos/seed/mixer/800/450",
    startDate: "2025-05-15T18:00:00",
    locationName: "Main Campus Green",
    category: "Social",
    organiserName: "Student Council",
    organiserAvatar: "https://picsum.photos/seed/sc/100/100",
    attendeeCount: 145,
    maxAttendees: 200,
    rsvpStatus: 'Going' as const
  },
  {
    id: "e2",
    title: "AI in Medicine Workshop",
    bannerImageUrl: "https://picsum.photos/seed/med/800/450",
    startDate: "2025-05-17T10:00:00",
    locationName: "Health Sciences Bldg, Rm 402",
    category: "Academic",
    organiserName: "Medical Tech Club",
    organiserAvatar: "https://picsum.photos/seed/mtc/100/100",
    attendeeCount: 42,
    maxAttendees: 50,
  },
  {
    id: "e3",
    title: "Varsity Football: Dash vs Tech",
    bannerImageUrl: "https://picsum.photos/seed/football/800/450",
    startDate: "2025-05-20T15:30:00",
    locationName: "Olympic Stadium",
    category: "Sports",
    organiserName: "Athletics Dept",
    organiserAvatar: "https://picsum.photos/seed/ath/100/100",
    attendeeCount: 1250,
    maxAttendees: 5000,
  }
];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-extrabold tracking-tight">Campus Events</h1>
          <p className="text-sm text-muted-foreground font-medium">Connect, learn, and celebrate with your community.</p>
        </div>
        <CreateEventDialog />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, organiser, or location..."
              className="bg-card border-border pl-10 h-11 text-sm font-medium"
            />
          </div>
          <Button variant="outline" className="h-11 border-border/50 gap-2 font-bold uppercase text-[10px] tracking-widest">
            <Filter className="w-3.5 h-3.5" />
            More Filters
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedCategory === cat
                  ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                  : "bg-background border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-8 border-b w-full justify-start rounded-none">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold">Upcoming</TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold">This Week</TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold">My Events</TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <EventCard {...event} />
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 py-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
              <Sparkles className="w-8 h-8 text-primary/40" />
              <div className="text-center">
                <p className="font-bold text-sm">Organizing your own event?</p>
                <p className="text-xs text-muted-foreground mt-1 px-8">Bring your campus community together by hosting workshops, socials, or study groups.</p>
              </div>
              <Button variant="outline" className="mt-2 h-9 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10">
                View Host Guidelines
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="week" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EventCard {...mockEvents[0]} />
            </div>
          </TabsContent>

          <TabsContent value="my" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EventCard {...mockEvents[0]} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
