"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users, Clock, Share2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [rsvp, setRsvp] = useState<"Going" | "Maybe" | null>(null);

  const event = {
    id,
    title: "Class of 2025 Sunset Mixer",
    description: "Join us for an unforgettable evening as we celebrate the Class of 2025! Enjoy music, food, and great company as we watch the sunset together on the Main Campus Green.",
    bannerImageUrl: "https://picsum.photos/seed/mixer/1200/600",
    startDate: "2025-05-15T18:00:00",
    locationName: "Main Campus Green",
    category: "Social",
    organiserName: "Student Council",
    organiserAvatar: "https://picsum.photos/seed/sc/100/100",
    attendeeCount: 145,
    maxAttendees: 200,
  };

  const date = new Date(event.startDate);
  const formattedDate = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const handleRSVP = (status: "Going" | "Maybe") => {
    const next = rsvp === status ? null : status;
    setRsvp(next);
    toast({ title: next ? `RSVP: ${next}` : "RSVP Cancelled" });
  };

  return (
    <div className="space-y-6 pb-16 page-enter">
      <Link href="/main/events">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>
      </Link>

      <div className="dash-card overflow-hidden">
        <div className="aspect-[21/9] w-full overflow-hidden relative">
          <img src={event.bannerImageUrl} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-background/80 backdrop-blur-md text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">
              {event.category}
            </Badge>
          </div>
          {rsvp === "Going" && (
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-headline font-bold mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />{formattedDate}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{formattedTime}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{event.locationName}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={event.organiserAvatar} />
              <AvatarFallback>{event.organiserName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Organized by</p>
              <p className="text-sm font-semibold">{event.organiserName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4 text-primary" />{event.attendeeCount} attending
                <span className="text-muted-foreground font-normal">/ {event.maxAttendees} max</span>
              </span>
              <span className="text-xs text-muted-foreground">{Math.round((event.attendeeCount / event.maxAttendees) * 100)}% full</span>
            </div>
            <Progress value={(event.attendeeCount / event.maxAttendees) * 100} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">About this event</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <Button
              variant={rsvp === "Going" ? "default" : "outline"}
              className={rsvp === "Going" ? "bg-primary text-primary-foreground" : "border-primary/40 text-primary hover:bg-primary/10"}
              onClick={() => handleRSVP("Going")}
              disabled={event.attendeeCount >= event.maxAttendees && rsvp !== "Going"}
            >
              {rsvp === "Going" ? <><CheckCircle2 className="w-4 h-4 mr-2" />Going</> : "I'm Going"}
            </Button>
            <Button variant={rsvp === "Maybe" ? "secondary" : "outline"} onClick={() => handleRSVP("Maybe")}>
              {rsvp === "Maybe" ? "Maybe ✓" : "Maybe"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
