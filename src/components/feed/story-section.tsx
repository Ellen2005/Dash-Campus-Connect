"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/upload";

type Story = {
  id: string;
  mediaUrl: string;
  caption: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    profilePhoto: string | null;
  };
  createdAt: string;
};

export function StorySection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Viewing state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Creation state
  const [createOpen, setCreateOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadStories() {
      try {
        const res = await fetch("/api/stories", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.stories)) {
          setStories(json.stories);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !imageFile) return;
    setUploading(true);
    try {
      const { url, error } = await uploadFile(imageFile, "stories", user.id);
      if (error) throw new Error(error);

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          authorId: user.id,
          mediaUrl: url,
          caption: caption.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to post story");

      toast({ title: "Story posted!" });
      setStories((prev) => [json.story, ...prev]);
      setCreateOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setCaption("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading && stories.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-2 rounded bg-muted animate-pulse mt-1" />
          </div>
        ))}
      </div>
    );
  }

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 mb-4 snap-x">
        {/* Create Story Button */}
        <div className="flex flex-col items-center gap-1 min-w-[64px] snap-start cursor-pointer" onClick={() => setCreateOpen(true)}>
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted to-muted/50 border border-border flex items-center justify-center">
            <div className="w-full h-full bg-background rounded-full p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Plus className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background text-primary-foreground">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-16 text-center">Your Story</span>
        </div>

        {/* Stories */}
        {stories.map((story, i) => (
          <div key={story.id} className="flex flex-col items-center gap-1 min-w-[64px] snap-start cursor-pointer" onClick={() => setActiveStoryIndex(i)}>
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500">
              <div className="w-full h-full bg-background rounded-full p-[2px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={story.author?.profilePhoto || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(story.author?.name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[10px] truncate w-16 text-center">{story.author?.name?.split(" ")[0] || story.author?.username}</span>
          </div>
        ))}
      </div>

      {/* View Story Modal */}
      <Dialog open={activeStoryIndex !== null} onOpenChange={(v) => !v && setActiveStoryIndex(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none text-white h-[80vh] flex flex-col items-center justify-center relative" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>View Story</DialogTitle>
          </VisuallyHidden>
          {activeStory && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Progress Bar Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="w-full bg-white/30 h-1 rounded-full mb-3">
                  <div className="bg-white h-1 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 border border-white/20">
                      <AvatarImage src={activeStory.author?.profilePhoto || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {(activeStory.author?.name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm drop-shadow-md">{activeStory.author?.username}</span>
                    <span className="text-xs text-white/70 drop-shadow-md">{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setActiveStoryIndex(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Story Content */}
              {activeStory.mediaUrl ? (
                <img src={activeStory.mediaUrl} alt="Story" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-500 to-purple-600">
                  <p className="text-center text-xl font-medium">{activeStory.caption}</p>
                </div>
              )}

              {/* Caption Overlay */}
              {activeStory.mediaUrl && activeStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-sm drop-shadow-md">{activeStory.caption}</p>
                </div>
              )}

              {/* Navigation Areas */}
              <div className="absolute top-0 bottom-0 left-0 w-1/3 z-0 cursor-pointer" onClick={() => setActiveStoryIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev)} />
              <div className="absolute top-0 bottom-0 right-0 w-1/3 z-0 cursor-pointer" onClick={() => setActiveStoryIndex(prev => (prev !== null && prev < stories.length - 1) ? prev + 1 : prev)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Story Modal */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between pb-4 border-b">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreateOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
            {!imagePreview ? (
              <div 
                className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Click to upload photo</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</span>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black/5 flex items-center justify-center h-48">
                <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            <div className="space-y-2">
              <Textarea 
                placeholder="Add a caption... (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none min-h-[80px]"
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right">{caption.length}/200</p>
            </div>

            <Button type="submit" className="w-full dash-button-primary" disabled={uploading || !imageFile}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Post to Story
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
