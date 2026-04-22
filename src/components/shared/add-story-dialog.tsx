"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ImageIcon, Type, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AddStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onStoryAdded?: (story: { type: "image" | "text"; src?: string; text?: string; bg?: string }) => void;
}

const BG_OPTIONS = [
  "bg-gradient-to-br from-primary/80 to-primary/40",
  "bg-gradient-to-br from-destructive/80 to-destructive/40",
  "bg-gradient-to-br from-amber-600/80 to-amber-400/40",
  "bg-gradient-to-br from-emerald-600/80 to-emerald-400/40",
  "bg-gradient-to-br from-purple-600/80 to-purple-400/40",
  "bg-gradient-to-br from-pink-600/80 to-pink-400/40",
];

export function AddStoryDialog({ open, onClose, onStoryAdded }: AddStoryDialogProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [mode, setMode] = useState<"pick" | "image" | "text">("pick");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");
  const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setMode("pick");
    setImagePreview(null);
    setStoryText("");
    setSelectedBg(BG_OPTIONS[0]);
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setMode("image");
    }
  };

  const handlePost = () => {
    if (mode === "image" && !imagePreview) return;
    if (mode === "text" && !storyText.trim()) return;
    setPosting(true);
    setTimeout(() => {
      setPosting(false);
      onStoryAdded?.({
        type: mode === "image" ? "image" : "text",
        src: imagePreview ?? undefined,
        text: storyText || undefined,
        bg: selectedBg,
      });
      toast({ title: "Story posted!", description: "Your story is now live for 24 hours." });
      handleClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-semibold">{t("addStory")}</DialogTitle>
        </DialogHeader>

        {mode === "pick" && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Choose how to create your story</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Photo / Video</p>
                <p className="text-[10px] text-muted-foreground text-center">Upload from your gallery</p>
              </button>
              <button
                onClick={() => setMode("text")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Type className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Text Story</p>
                <p className="text-[10px] text-muted-foreground text-center">Share a thought or update</p>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
          </div>
        )}

        {mode === "image" && imagePreview && (
          <div className="space-y-3 p-4">
            <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-64 bg-muted">
              <img src={imagePreview} alt="Story preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setImagePreview(null); setMode("pick"); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setImagePreview(null); setMode("pick"); }}>
                {t("back")}
              </Button>
              <Button size="sm" className="flex-1 dash-button-primary h-8" onClick={handlePost} disabled={posting}>
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Post Story
              </Button>
            </div>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-3 p-4">
            <div className={cn("rounded-xl p-4 min-h-[140px] flex items-center justify-center", selectedBg)}>
              <Textarea
                autoFocus
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-transparent border-0 text-white placeholder:text-white/60 text-center text-lg font-bold resize-none focus-visible:ring-0 min-h-[100px]"
                maxLength={150}
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-bold">Background</p>
              <div className="flex gap-2 flex-wrap">
                {BG_OPTIONS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBg(bg)}
                    className={cn("w-8 h-8 rounded-full border-2 transition-all", bg, selectedBg === bg ? "border-white scale-110" : "border-transparent")}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setMode("pick")}>{t("back")}</Button>
              <Button size="sm" className="flex-1 dash-button-primary h-8" onClick={handlePost} disabled={posting || !storyText.trim()}>
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Post Story
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
