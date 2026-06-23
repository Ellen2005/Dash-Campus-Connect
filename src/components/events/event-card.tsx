"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  bannerImageUrl: string;
  startDate: string;
  locationName: string;
  category: string;
  organiserName: string;
  organiserAvatar: string;
  attendeeCount: number;
  maxAttendees?: number;
  rsvpStatus?: "Going" | "Maybe" | "Not Going" | null;
  approvalStatus?: string;
  organizerId?: string;
}

export function EventCard({
  id, title, bannerImageUrl, startDate, locationName, category,
  organiserName, organiserAvatar, attendeeCount, maxAttendees, rsvpStatus: initialRsvp,
  approvalStatus
}: EventCardProps) {
  const [rsvp, setRsvp] = useState(initialRsvp ?? null);
  const isFull = maxAttendees ? attendeeCount >= maxAttendees : false;

  const date = new Date(startDate);
  const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <Card className="dash-card-hover group overflow-hidden">
      <Link href={`/main/events/${id}`}>
        <div className="aspect-[16/9] w-full overflow-hidden relative">
          <img src={bannerImageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className="bg-background/80 backdrop-blur-md text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] w-fit">
              {category}
            </Badge>
            {approvalStatus && approvalStatus !== "APPROVED" && (
              <Badge className={cn(
                "backdrop-blur-md font-bold uppercase tracking-widest text-[10px] w-fit",
                approvalStatus === "PENDING" ? "bg-amber-500/80 text-white border-amber-500/20" : "bg-destructive/80 text-white border-destructive/20"
              )}>
                {approvalStatus}
              </Badge>
            )}
          </div>
          {rsvp === "Going" && (
            <div className="absolute top-3 right-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <Link href={`/main/events/${id}`}>
            <h3 className="font-headline font-bold text-base leading-tight hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> {formattedTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {locationName}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={organiserAvatar} />
              <AvatarFallback className="text-[10px]">{organiserName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-semibold text-muted-foreground">{organiserName}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {attendeeCount}{maxAttendees ? ` / ${maxAttendees}` : ""}
          </div>
        </div>

        {maxAttendees && (
          <div className="space-y-1">
            <Progress value={(attendeeCount / maxAttendees) * 100} className="h-1" />
            {isFull && <p className="text-[9px] text-destructive font-bold uppercase text-right">Event Full</p>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          {(["Going", "Maybe", "Not Going"] as const).map((status) => (
            <Button
              key={status}
              variant={rsvp === status ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 text-[10px] font-bold uppercase tracking-wider",
                rsvp === status && "bg-primary text-primary-foreground border-primary",
                status === "Not Going" && rsvp === status && "bg-destructive/10 text-destructive border-destructive/20"
              )}
              onClick={() => setRsvp(rsvp === status ? null : status)}
              disabled={isFull && status === "Going" && rsvp !== "Going"}
            >
              {status === "Not Going" ? "No" : status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
