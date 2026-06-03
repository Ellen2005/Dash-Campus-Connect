
"use client";

import { useState, type FormEvent } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { ensureDbUser } from "@/lib/client-user";
import { uploadFile } from "@/lib/upload";

export function CreateEventDialog({ onCreated }: { onCreated?: () => Promise<void> | void }) {
  const { toast } = useToast();
  const { dashUser, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "social",
    startDate: "",
    startTime: "",
    location: "",
    description: "",
    maxAttendees: "",
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!dashUser) {
      toast({ title: "Sign in required", description: "You need an account to create an event." });
      return;
    }
    setIsLoading(true);
    try {
      await ensureDbUser(dashUser, session);
      const start = new Date(`${form.startDate}T${form.startTime}`);
      if (Number.isNaN(start.getTime())) {
        throw new Error("Invalid date/time.");
      }

      let bannerImageUrl: string | undefined;
      if (bannerFile) {
        const upload = await uploadFile(bannerFile, "events", dashUser.id);
        if (upload.error || !upload.url) {
          throw new Error(upload.error ?? "Failed to upload image.");
        }
        bannerImageUrl = upload.url;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          date: start.toISOString(),
          location: form.location.trim(),
          capacity: form.maxAttendees ? Number(form.maxAttendees) : undefined,
          organizerId: dashUser.id,
          isFree: true,
          bannerImageUrl,
        }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create event.");

      setIsOpen(false);
      setBannerFile(null);
      setForm({ title: "", category: "social", startDate: "", startTime: "", location: "", description: "", maxAttendees: "" });
      await onCreated?.();
      toast({ title: "Event Created", description: "Your campus event has been published successfully." });
    } catch (error: any) {
      toast({ title: "Event creation failed", description: error?.message ?? "Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 dash-button-primary">
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="obsidian-card max-w-2xl overflow-y-auto max-h-[90vh] overscroll-contain">
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
                <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Annual Tech Symposium" className="bg-background/50 border-border" required />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                <Select value={form.category} onValueChange={(value) => setForm((s) => ({ ...s, category: value }))}>
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
                    <Input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="bg-background/50 border-border pl-9" required />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Time</Label>
                  <div className="relative">
                    <Input type="time" value={form.startTime} onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} className="bg-background/50 border-border pl-9" required />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location Name</Label>
                <div className="relative">
                  <Input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} placeholder="e.g. Main Hall, Wing B" className="bg-background/50 border-border pl-9" required />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Tell students what to expect..." 
                  className="min-h-[120px] bg-background/50 border-border resize-none"
                  maxLength={2000}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Banner Image</Label>
                <label className="border-2 border-dashed border-border rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer bg-muted/20">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{bannerFile ? bannerFile.name : "Upload 16:9 Image"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Max Attendees (Optional)</Label>
                <Input type="number" value={form.maxAttendees} onChange={(e) => setForm((s) => ({ ...s, maxAttendees: e.target.value }))} placeholder="No limit" className="bg-background/50 border-border" />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-6 mt-4">
            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="dash-button-primary px-8" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Publish Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
