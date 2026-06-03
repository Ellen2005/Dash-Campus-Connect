"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Plus, Loader2, Upload } from "lucide-react";

type Category = "ELECTRONICS" | "CLOTHING" | "ACCESSORIES" | "DOCUMENTS" | "KEYS" | "OTHER";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onReported?: () => Promise<void> | void;
};

export function ReportDialog({ open, onOpenChange, onReported }: Props) {
  const { toast } = useToast();
  const { dashUser } = useAuth();

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("lost");
    setTitle("");
    setDescription("");
    setCategory("OTHER");
    setLocation("");
    setDate("");
    setImages([]);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser?.id) {
      toast({ title: "Sign in required", description: "You need an account to report an item.", variant: "destructive" });
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      toast({ title: "Missing fields", description: "Title, description, and location are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: dashUser.id,
          type,
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
          date: date ? new Date(date).toISOString() : undefined,
          images,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to submit report.");

      reset();
      onOpenChange(false);
      await onReported?.();
      toast({ title: "Submitted", description: "Your Lost & Found report was posted." });
    } catch (err: any) {
      toast({ title: "Submit failed", description: err?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next);
      if (!next) reset();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{type === "lost" ? "Report Lost" : "Report Found"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="lost" className="flex-1">Lost</TabsTrigger>
              <TabsTrigger value="found" className="flex-1">Found</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm"
            >
              {(["ELECTRONICS", "CLOTHING", "ACCESSORIES", "DOCUMENTS", "KEYS", "OTHER"] as Category[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-10" required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date (optional)</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[110px]" required maxLength={5000} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Images (optional)</Label>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <Input
                type="file"
                accept="image/*"
                multiple
                className="h-10"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  // For now we store local object URLs as placeholders.
                  // This matches existing upload flow only after we wire storage.
                  const urls = files.map((f) => URL.createObjectURL(f));
                  setImages(urls);
                }}
              />
            </div>
            {images.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{images.length} image(s) selected. (Image upload wiring can be added next.)</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="dash-button-primary" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

