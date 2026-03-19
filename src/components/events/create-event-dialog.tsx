
"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, Image as ImageIcon, Sparkles, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateEventDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      toast({
        title: "Event Created",
        description: "Your campus event has been published successfully.",
      });
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-full champagne-gradient font-bold shadow-lg">
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="obsidian-card max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold">New Campus Event</DialogTitle>
          <DialogDescription>
            Organize a social, academic, or cultural gathering for your university.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Event Title</Label>
                <Input placeholder="e.g. Annual Tech Symposium" className="bg-background/50 border-border" required />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                <Select defaultValue="social">
                  <SelectTrigger className="bg-background/50 border-border">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Start Date</Label>
                  <div className="relative">
                    <Input type="date" className="bg-background/50 border-border pl-9" required />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Time</Label>
                  <div className="relative">
                    <Input type="time" className="bg-background/50 border-border pl-9" required />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location Name</Label>
                <div className="relative">
                  <Input placeholder="e.g. Main Hall, Wing B" className="bg-background/50 border-border pl-9" required />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
                <Textarea 
                  placeholder="Tell students what to expect..." 
                  className="min-h-[120px] bg-background/50 border-border resize-none"
                  maxLength={2000}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Banner Image</Label>
                <div className="border-2 border-dashed border-border rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-2 hover:border-gold/40 transition-colors cursor-pointer bg-muted/20">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Upload 16:9 Image</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Max Attendees (Optional)</Label>
                <Input type="number" placeholder="No limit" className="bg-background/50 border-border" />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-6 mt-4">
            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="champagne-gradient font-bold px-8" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Publish Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
