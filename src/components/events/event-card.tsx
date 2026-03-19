
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
  rsvpStatus?: 'Going' | 'Maybe' | 'Not Going' | null;
}

export function EventCard({
  id,
  title,
  bannerImageUrl,
  startDate,
  locationName,
  category,
  organiserName,
  organiserAvatar,
  attendeeCount,
  maxAttendees,
  rsvpStatus: initialRsvp
}: EventCardProps) {
  const [rsvp, setRsvp] = useState(initialRsvp);
  const isFull = maxAttendees ? attendeeCount >= maxAttendees : false;

  const date = new Date(startDate);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  return (
    <Card className="obsidian-card group">
      <Link href={`/events/${id}`}>
        <div className="aspect-[16/9] w-full overflow-hidden relative">
          <img 
            src={bannerImageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-background/80 backdrop-blur-md text-gold border-gold/20 font-bold uppercase tracking-widest text-[10px]">
              {category}
            </Badge>
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4 space-y-4">
        <div className="space-y-1">
          <Link href={`/events/${id}`}>
            <h3 className="font-headline font-bold text-lg leading-tight group-hover:text-gold transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gold" />
              {formattedTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
          {locationName}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={organiserAvatar} />
              <AvatarFallback>{organiserName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{organiserName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {attendeeCount}{maxAttendees ? ` / ${maxAttendees}` : ""}
          </div>
        </div>

        {maxAttendees && (
          <div className="space-y-1.5">
            <Progress value={(attendeeCount / maxAttendees) * 100} className="h-1 bg-muted" />
            {isFull && <p className="text-[9px] text-destructive font-bold uppercase text-right">Event Full</p>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button 
            variant={rsvp === 'Going' ? 'default' : 'outline'} 
            size="sm" 
            className={cn(
              "h-9 text-[10px] font-bold uppercase tracking-wider",
              rsvp === 'Going' ? "champagne-gradient" : "border-gold/20 text-gold hover:bg-gold/10"
            )}
            onClick={() => setRsvp('Going')}
            disabled={isFull && rsvp !== 'Going'}
          >
            Going
          </Button>
          <Button 
            variant={rsvp === 'Maybe' ? 'secondary' : 'outline'} 
            size="sm" 
            className="h-9 text-[10px] font-bold uppercase tracking-wider border-border/50"
            onClick={() => setRsvp('Maybe')}
          >
            Maybe
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-9 text-[10px] font-bold uppercase tracking-wider",
              rsvp === 'Not Going' ? "text-destructive" : "text-muted-foreground"
            )}
            onClick={() => setRsvp('Not Going')}
          >
            No
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
