"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Type, X, Send, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AddStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onStoryAdded?: (items: StoryItem[]) => void;
}

interface StoryItem {
  type: "image" | "text";
  src?: string;
  file?: File;
  text?: string;
  bg?: string;
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
  const [mode, setMode] = useState<"pick" | "compose">("pick");
  const [items, setItems] = useState<StoryItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [captionText, setCaptionText] = useState("");
  const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setMode("pick");
    setItems([]);
    setActiveIdx(0);
    setCaptionText("");
    setSelectedBg(BG_OPTIONS[0]);
    onClose();
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newItems: StoryItem[] = files.map(file => ({
      type: "image",
      src: URL.createObjectURL(file),
      file,
    }));

    setItems(prev => {
      const combined = [...prev, ...newItems].slice(0, 10);
      return combined;
    });
    setMode("compose");
    if (fileRef.current) fileRef.current.value = "";
  };

  const addTextSlide = () => {
    setItems(prev => [...prev, { type: "text" as const, text: "", bg: selectedBg }].slice(0, 10));
    setActiveIdx(items.length);
    setMode("compose");
  };

  const removeItem = (idx: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) { setMode("pick"); return next; }
      setActiveIdx(Math.min(idx, next.length - 1));
      return next;
    });
  };

  const updateItemText = (idx: number, text: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, text } : item));
  };

  const updateItemBg = (idx: number, bg: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, bg } : item));
  };

  const handlePost = () => {
    if (items.length === 0) return;
    const finalItems = items.map(item => ({
      ...item,
      text: item.type === "text" ? (item.text || "") : (captionText || undefined),
    }));
    setPosting(true);
    setTimeout(() => {
      setPosting(false);
      onStoryAdded?.(finalItems);
      toast({
        title: `Story posted! 🎉`,
        description: `${items.length} slide${items.length > 1 ? "s" : ""} — live for 24 hours.`,
      });
      handleClose();
    }, 1000);
  };

  const activeItem = items[activeIdx];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-semibold">{t("addStory")}</DialogTitle>
        </DialogHeader>

        {/* PICK MODE */}
        {mode === "pick" && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Add up to 10 photos, videos, or text slides. Each becomes one story slide.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Photos / Videos</p>
                <p className="text-[10px] text-muted-foreground text-center">Select multiple at once</p>
              </button>
              <button
                onClick={addTextSlide}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Type className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Text Slide</p>
                <p className="text-[10px] text-muted-foreground text-center">Share a thought</p>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
            />
          </div>
        )}

        {/* COMPOSE MODE */}
        {mode === "compose" && items.length > 0 && (
          <div className="p-4 space-y-3">
            {/* Slide preview */}
            <div className="relative rounded-xl overflow-hidden bg-muted" style={{ aspectRatio: "9/16", maxHeight: "260px" }}>
              {activeItem?.type === "image" && activeItem.src ? (
                <img src={activeItem.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center p-4", activeItem?.bg ?? BG_OPTIONS[0])}>
                  <Textarea
                    autoFocus={activeItem?.type === "text"}
                    value={activeItem?.text ?? ""}
                    onChange={e => updateItemText(activeIdx, e.target.value)}
                    placeholder="What's on your mind?"
                    className="bg-transparent border-0 text-white placeholder:text-white/60 text-center text-base font-bold resize-none focus-visible:ring-0 min-h-[80px]"
                    maxLength={150}
                  />
                </div>
              )}

              {/* Remove slide */}
              <button
                onClick={() => removeItem(activeIdx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Slide counter */}
              {items.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeIdx + 1} / {items.length}
                </div>
              )}

              {/* Prev/Next */}
              {items.length > 1 && (
                <>
                  {activeIdx > 0 && (
                    <button onClick={() => setActiveIdx(i => i - 1)}
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {activeIdx < items.length - 1 && (
                    <button onClick={() => setActiveIdx(i => i + 1)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Slide thumbnails */}
            {items.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                      i === activeIdx ? "border-primary" : "border-transparent opacity-60"
                    )}
                  >
                    {item.type === "image" && item.src
                      ? <img src={item.src} alt="" className="w-full h-full object-cover" />
                      : <div className={cn("w-full h-full flex items-center justify-center text-[8px] text-white font-bold", item.bg ?? BG_OPTIONS[0])}>T</div>
                    }
                  </button>
                ))}
              </div>
            )}

            {/* Background picker for text slides */}
            {activeItem?.type === "text" && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-widest font-bold">Background</p>
                <div className="flex gap-2 flex-wrap">
                  {BG_OPTIONS.map((bg, i) => (
                    <button
                      key={i}
                      onClick={() => updateItemBg(activeIdx, bg)}
                      className={cn("w-7 h-7 rounded-full border-2 transition-all", bg,
                        activeItem.bg === bg ? "border-white scale-110" : "border-transparent"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Optional caption for image slides */}
            {activeItem?.type === "image" && (
              <div>
                <input
                  value={captionText}
                  onChange={e => setCaptionText(e.target.value)}
                  placeholder="Add a caption (optional)…"
                  className="w-full h-9 text-sm bg-muted/30 border border-border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  maxLength={100}
                />
              </div>
            )}

            {/* Add more / actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => fileRef.current?.click()}
                disabled={items.length >= 10}
              >
                <Plus className="w-3.5 h-3.5" />
                Add More {items.length >= 10 ? "(max)" : `(${items.length}/10)`}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFilesSelect}
              />
              <Button variant="outline" size="sm" className="text-xs" onClick={addTextSlide} disabled={items.length >= 10}>
                <Type className="w-3.5 h-3.5 mr-1" /> Text
              </Button>
            </div>

            <div className="flex gap-2 pt-1 border-t border-border">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button size="sm" className="flex-1 dash-button-primary h-9" onClick={handlePost} disabled={posting}>
                {posting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  : <Send className="w-3.5 h-3.5 mr-1.5" />
                }
                Post {items.length} Slide{items.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
