"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Image as ImageIcon, X, Globe, Users, Lock, Sparkles, Loader2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CHANNELS = ["general", "lost-and-found", "course-reviews", "housing", "marketplace"];

export function CreatePostDialog() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("everyone");
  const [channel, setChannel] = useState("general");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      setContent(""); setImagePreview(null); setAudience("everyone"); setChannel("general");
      toast({ title: "Post Created", description: "Your post has been published to the campus feed." });
    }, 1200);
  };

  const handleClose = (v: boolean) => {
    if (!loading) { setOpen(v); if (!v) { setContent(""); setImagePreview(null); } }
  };

  return (
    <>
      <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setOpen(true)}>
        <PlusCircle className="w-3.5 h-3.5" />
        {t("createPost")}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t("shareWithCampus")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Author row */}
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">AR</AvatarFallback>
              </Avatar>
              <div className="flex gap-2 flex-wrap">
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="h-7 text-xs w-auto border-border bg-muted/30 gap-1 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone"><div className="flex items-center gap-1.5 text-xs"><Globe className="w-3 h-3" />{t("everyone")}</div></SelectItem>
                    <SelectItem value="department"><div className="flex items-center gap-1.5 text-xs"><Users className="w-3 h-3" />{t("department")}</div></SelectItem>
                    <SelectItem value="friends"><div className="flex items-center gap-1.5 text-xs"><Lock className="w-3 h-3" />{t("friendsOnly")}</div></SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-7 text-xs w-auto border-border bg-muted/30 gap-1 px-2">
                    <Hash className="w-3 h-3" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c} value={c} className="text-xs">#{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Text area */}
            <Textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t("whatsOnMind")}
              className="min-h-[120px] resize-none text-sm bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/50"
              maxLength={5000}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground -mt-2">
              <span>{content.length}/5000 {t("characters")}</span>
              <span className="text-primary font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI suggestions available</span>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-primary/8"
              >
                <ImageIcon className="w-4 h-4" />
                {t("addMedia")}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImage} />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => handleClose(false)} disabled={loading}>{t("cancel")}</Button>
              <Button type="submit" size="sm" className="dash-button-primary h-8 px-4 text-xs" disabled={loading || !content.trim()}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                {t("publishPost")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
