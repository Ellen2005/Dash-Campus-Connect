"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Story {
  id: string;
  user: string;
  avatar: string;
  isLive?: boolean;
  items: { type: "image" | "text"; src?: string; text?: string; bg?: string }[];
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

const DURATION = 5000;

export function StoryViewer({ stories, initialIndex, open, onClose }: StoryViewerProps) {
  const [storyIdx, setStoryIdx] = useState(initialIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageError, setImageError] = useState(false);

  const story = stories[storyIdx];
  const item = story?.items[itemIdx];
  const totalItems = story?.items.length ?? 1;

  const goNext = useCallback(() => {
    setImageError(false);
    if (itemIdx < totalItems - 1) { setItemIdx(i => i + 1); setProgress(0); }
    else if (storyIdx < stories.length - 1) { setStoryIdx(s => s + 1); setItemIdx(0); setProgress(0); }
    else { onClose(); }
  }, [itemIdx, totalItems, storyIdx, stories.length, onClose]);

  const goPrev = () => {
    setImageError(false);
    if (itemIdx > 0) { setItemIdx(i => i - 1); setProgress(0); }
    else if (storyIdx > 0) { setStoryIdx(s => s - 1); setItemIdx(0); setProgress(0); }
  };

  useEffect(() => {
    if (!open || paused) return;
    const interval = setInterval(() => {
      setProgress(p => { if (p >= 100) { goNext(); return 0; } return p + (100 / (DURATION / 100)); });
    }, 100);
    return () => clearInterval(interval);
  }, [open, paused, goNext, itemIdx, storyIdx]);

  useEffect(() => {
    if (open) { setStoryIdx(initialIndex); setItemIdx(0); setProgress(0); setImageError(false); }
  }, [open, initialIndex]);

  if (!story) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-sm w-full bg-black border-0 rounded-2xl overflow-hidden h-[85vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>{story.user}&apos;s Story</DialogTitle>
        </VisuallyHidden>

        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {story.items.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-none"
                style={{ width: i < itemIdx ? "100%" : i === itemIdx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>

        <div className="absolute top-7 left-3 right-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/30 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
              {story.user[0]}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{story.user}</p>
              {story.isLive && <span className="text-[9px] bg-destructive text-white px-1.5 py-0.5 rounded font-bold">LIVE</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 relative select-none"
          onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
          {item?.type === "image" && item.src && !imageError
            ? <img src={item.src} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} />
            : <div className={cn("w-full h-full flex items-center justify-center p-8", item?.bg ?? "bg-gradient-to-br from-primary/80 to-primary/40")}>
                <p className="text-white text-xl font-bold text-center">{item?.text || "Unavailable"}</p>
              </div>
          }
          <button className="absolute left-0 top-0 w-1/3 h-full z-10" onClick={goPrev} />
          <button className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={goNext} />
        </div>

        <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white">
          <ChevronRight className="w-6 h-6" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
