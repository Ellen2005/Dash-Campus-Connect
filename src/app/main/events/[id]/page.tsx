
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Share2, 
  MoreHorizontal, 
  MessageSquare,
  ShieldCheck,
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [rsvp, setRsvp] = useState<'Going' | 'Maybe' | 'Not Going' | null>('Going');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock data
  const event = {
    id: params.id,
    title: "Class of 2025 Sunset Mixer",
    bannerImageUrl: "https://picsum.photos/seed/mixer/1200/600",
    description: "Join the Class of 2025 for a relaxing evening on the campus lawn. We'll have live music, light refreshments, and a chance to connect with fellow students before finals week begins. \n\nWhat to bring: \n- Student ID for check-in\n- A picnic blanket (optional)\n- Your best sunset vibes!\n\nThis is a student-only event. Official university code of conduct applies.",
    startDate: "2025-05-15T18:00:00",
    endDate: "2025-05-15T21:00:00",
    locationName: "Main Campus Green",
    locationRoom: "South Lawn Area",
    category: "Social",
    organiserName: "Student Council",
    organiserAvatar: "https://picsum.photos/seed/sc/100/100",
    attendeeCount: 145,
    maxAttendees: 200,
    isOfficial: true,
  };

  const attendees = [
    { name: "Alex Rivera", avatar: "https://picsum.photos/seed/alex/100/100" },
    { name: "Sarah Miller", avatar: "https://picsum.photos/seed/sarah/100/100" },
    { name: "Jake Thompson", avatar: "https://picsum.photos/seed/jake/100/100" },
    { name: "Emma Wilson", avatar: "https://picsum.photos/seed/emma/100/100" },
    { name: "Liam Chen", avatar: "https://picsum.photos/seed/liam/100/100" },
  ];

  const handleScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to use the QR scanner.',
      });
    }
  };

  return (
    <div className="pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border shadow-2xl">
        <img src={event.bannerImageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-gold text-obsidian border-none font-bold uppercase tracking-widest text-[10px]">
              {event.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="obsidian-card p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date & Time</p>
                  <p className="text-sm font-bold">Thu, May 15, 2025</p>
                  <p className="text-xs text-muted-foreground">6:00 PM — 9:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                  <p className="text-sm font-bold">{event.locationName}</p>
                  <p className="text-xs text-muted-foreground">{event.locationRoom}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="font-headline font-bold text-lg">About this Event</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>

          <div className="obsidian-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg">Organiser</h3>
              {event.isOfficial && (
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-gold border-gold/20 gap-1.5 py-1 px-3">
                  <ShieldCheck className="w-3 h-3" />
                  Official University Event
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-background shadow-lg">
                  <AvatarImage src={event.organiserAvatar} />
                  <AvatarFallback>{event.organiserName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{event.organiserName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Event Coordinator</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-9 border-gold/20 text-gold hover:bg-gold/10 font-bold text-[10px] uppercase tracking-widest">
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="obsidian-card p-6 space-y-6 sticky top-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-lg">RSVP</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {event.attendeeCount} Going
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className={cn(
                    "h-12 font-bold uppercase tracking-widest text-xs rounded-xl",
                    rsvp === 'Going' ? "champagne-gradient text-obsidian" : "bg-muted/20 hover:bg-muted/40 border-border"
                  )}
                  onClick={() => setRsvp('Going')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I'm Going
                </Button>
                <Button 
                  variant="outline"
                  className={cn(
                    "h-12 font-bold uppercase tracking-widest text-xs rounded-xl",
                    rsvp === 'Maybe' ? "border-gold text-gold" : "border-border text-muted-foreground"
                  )}
                  onClick={() => setRsvp('Maybe')}
                >
                  Maybe
                </Button>
                <Button 
                  variant="ghost"
                  className={cn(
                    "h-12 font-bold uppercase tracking-widest text-xs rounded-xl",
                    rsvp === 'Not Going' ? "text-destructive" : "text-muted-foreground"
                  )}
                  onClick={() => setRsvp('Not Going')}
                >
                  Not Interested
                </Button>
              </div>
            </div>

            {rsvp === 'Going' && (
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check-in</h4>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-bold px-2 py-0.5 animate-pulse">
                    Live
                  </Badge>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full h-11 bg-card border border-gold/20 text-gold font-bold uppercase text-[10px] tracking-widest gap-2 hover:bg-gold/10" onClick={handleScan}>
                      <Camera className="w-4 h-4" />
                      Scan to Check-in
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="obsidian-card max-w-md">
                    <DialogHeader>
                      <DialogTitle>Event Check-in</DialogTitle>
                      <DialogDescription>
                        Scan the event QR code to confirm your attendance.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-square w-full bg-black rounded-xl overflow-hidden relative flex flex-col items-center justify-center">
                      <video ref={videoRef} className="w-full aspect-square object-cover" autoPlay muted />
                      
                      {/* Viewfinder Overlay */}
                      <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                        <div className="w-full h-full border-2 border-gold/40 relative">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg" />
                        </div>
                      </div>

                      {hasCameraPermission === false && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Permission Denied</AlertTitle>
                            <AlertDescription>
                              Camera access is required for check-in. Please enable it in browser settings.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                      <Button variant="outline" className="w-full gap-2 font-bold uppercase text-[10px] tracking-widest">
                        <QrCode className="w-4 h-4" />
                        Show My Ticket
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="pt-6 border-t border-border/50 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Going</h4>
              <div className="flex items-center -space-x-3 overflow-hidden">
                {attendees.map((attendee, i) => (
                  <Avatar key={i} className="inline-block border-2 border-background w-9 h-9">
                    <AvatarImage src={attendee.avatar} />
                    <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-9 h-9 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  +{event.attendeeCount - 5}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                {attendees[0].name}, {attendees[1].name} and {event.attendeeCount - 2} others are going.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
