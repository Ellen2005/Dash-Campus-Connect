"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { Search, Filter, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["All", "Social", "Academic", "Sports", "Career", "Cultural", "Club", "Emergency"];

const mockEvents = [
  { id: "e1", title: "Class of 2025 Sunset Mixer",    bannerImageUrl: "https://picsum.photos/seed/mixer/800/450",    startDate: "2025-05-15T18:00:00", locationName: "Main Campus Green",          category: "Social",   organiserName: "Student Council",  organiserAvatar: "https://picsum.photos/seed/sc/100/100",  attendeeCount: 145,  maxAttendees: 200,  rsvpStatus: "Going" as const },
  { id: "e2", title: "AI in Medicine Workshop",        bannerImageUrl: "https://picsum.photos/seed/med/800/450",      startDate: "2025-05-17T10:00:00", locationName: "Health Sciences Bldg, Rm 402", category: "Academic", organiserName: "Medical Tech Club", organiserAvatar: "https://picsum.photos/seed/mtc/100/100", attendeeCount: 42,   maxAttendees: 50 },
  { id: "e3", title: "Varsity Football: Dash vs Tech", bannerImageUrl: "https://picsum.photos/seed/football/800/450", startDate: "2025-05-20T15:30:00", locationName: "Olympic Stadium",             category: "Sports",   organiserName: "Athletics Dept",   organiserAvatar: "https://picsum.photos/seed/ath/100/100", attendeeCount: 1250, maxAttendees: 5000 },
  { id: "e4", title: "Career Fair 2025",               bannerImageUrl: "https://picsum.photos/seed/career/800/450",   startDate: "2025-05-22T09:00:00", locationName: "Main Hall",                   category: "Career",   organiserName: "Career Services",  organiserAvatar: "https://picsum.photos/seed/cs2/100/100", attendeeCount: 320,  maxAttendees: 500 },
  { id: "e5", title: "Cultural Night",                 bannerImageUrl: "https://picsum.photos/seed/culture/800/450",  startDate: "2025-05-25T19:00:00", locationName: "Amphitheatre",                category: "Cultural", organiserName: "Cultural Club",    organiserAvatar: "https://picsum.photos/seed/cc/100/100",  attendeeCount: 280,  maxAttendees: 400 },
];

const HOST_GUIDELINES = [
  { icon: "📋", title: "Submit your event", desc: "Fill in the event form with title, date, location, and description. Events are reviewed within 24 hours." },
  { icon: "✅", title: "Get approved", desc: "A Student Admin reviews your event for compliance with campus guidelines before it goes live." },
  { icon: "📢", title: "Promote it", desc: "Once approved, your event appears in the feed. Share it to your groups and communities." },
  { icon: "👥", title: "Manage RSVPs", desc: "Track who's going, set a max capacity, and send updates to attendees." },
  { icon: "🚫", title: "Prohibited content", desc: "Events promoting alcohol, illegal activities, or discrimination will be rejected immediately." },
  { icon: "📞", title: "Need help?", desc: "Contact the Student Admin team via the Support Center if you have questions about your event." },
];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  const filteredEvents = mockEvents.filter(e => {
    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organiserName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const myEvents = mockEvents.filter(e => e.rsvpStatus === "Going");

  return (
    <div className="space-y-6 pb-20 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-extrabold tracking-tight">Campus Events</h1>
          <p className="text-sm text-muted-foreground">Connect, learn, and celebrate with your community.</p>
        </div>
        <CreateEventDialog />
      </div>

      <div className="space-y-4">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, organiser, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-card border-border pl-10 h-10 text-sm"
            />
          </div>
          <Button variant="outline" className="h-10 border-border/50 gap-2 text-xs font-bold uppercase tracking-widest shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filters
          </Button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedCategory === cat
                  ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                  : "bg-background border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="bg-transparent h-auto p-0 gap-6 border-b w-full justify-start rounded-none overflow-x-auto no-scrollbar">
            {["upcoming", "week", "my", "past"].map(v => (
              <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-semibold whitespace-nowrap capitalize">
                {v === "week" ? "This Week" : v === "my" ? "My Events" : v}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="upcoming" className="pt-5">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No events found for "{selectedCategory}"</p>
                <p className="text-xs mt-1">Try a different category or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredEvents.map((event, i) => (
                  <div key={event.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 80}ms` }}>
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            )}

            {/* Host guidelines CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 py-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
              <Sparkles className="w-8 h-8 text-primary/40" />
              <div className="text-center">
                <p className="font-bold text-sm">Organizing your own event?</p>
                <p className="text-xs text-muted-foreground mt-1 px-8">
                  Bring your campus community together by hosting workshops, socials, or study groups.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-9 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => setGuidelinesOpen(true)}
              >
                <BookOpen className="w-3.5 h-3.5 mr-2" />
                View Host Guidelines
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="week" className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredEvents.slice(0, 2).map((event, i) => (
                <div key={event.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 80}ms` }}>
                  <EventCard {...event} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my" className="pt-5">
            {myEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No events RSVPed yet</p>
                <p className="text-xs mt-1">Browse upcoming events and click "Going" to add them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myEvents.map((event, i) => (
                  <div key={event.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${i * 80}ms` }}>
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="pt-5">
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No past events to show</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Host Guidelines Dialog */}
      <Dialog open={guidelinesOpen} onOpenChange={setGuidelinesOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Event Host Guidelines
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Follow these guidelines to get your event approved and running smoothly on Dash.
            </p>
            {HOST_GUIDELINES.map((g, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-xl shrink-0">{g.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{g.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setGuidelinesOpen(false)}>
                Close
              </Button>
              <Button className="flex-1 dash-button-primary h-9 text-sm" onClick={() => setGuidelinesOpen(false)}>
                Got it — Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
