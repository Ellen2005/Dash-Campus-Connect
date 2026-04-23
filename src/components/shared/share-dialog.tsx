"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Repeat2, MessageSquarePlus, Link2, ExternalLink, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  post: { author: { name: string; username: string; avatar: string }; content: string };
}

export function ShareDialog({ open, onClose, post }: ShareDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<"menu" | "repost" | "thoughts">("menu");
  const [thoughts, setThoughts] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = () => { setMode("menu"); setThoughts(""); onClose(); };

  const handleRepost = (withThoughts: boolean) => {
    if (withThoughts && !thoughts.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleClose();
      toast({ title: t("postShared"), description: withThoughts ? t("repostWithThoughts") : t("shareInstantly") });
    }, 900);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${Date.now()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t("linkCopied") });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${post.author.name}: "${post.content.slice(0, 100)}…" — via Dash Campus`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Repeat2 className="w-4 h-4 text-primary" />
            {t("share")}
          </DialogTitle>
          <DialogDescription className="sr-only">Share this post</DialogDescription>
        </DialogHeader>

        {mode === "menu" && (
          <div className="space-y-2 pt-1">
            {/* Post preview */}
            <div className="dash-card p-3 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold">{post.author.name}</p>
                  <p className="text-[10px] text-muted-foreground">@{post.author.username}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
            </div>

            <button onClick={() => setMode("thoughts")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("repostWithThoughts")}</p>
                <p className="text-[11px] text-muted-foreground">Add your own comment</p>
              </div>
            </button>

            <button onClick={() => handleRepost(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Repeat2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("shareInstantly")}</p>
                <p className="text-[11px] text-muted-foreground">Share to your feed now</p>
              </div>
            </button>

            <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-sm font-semibold">{copied ? t("linkCopied") : t("copyLink")}</p>
            </button>

            <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-[#25D366]" />
              </div>
              <p className="text-sm font-semibold">{t("shareWhatsApp")}</p>
            </button>
          </div>
        )}

        {mode === "thoughts" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-2.5">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-xs">Me</AvatarFallback>
              </Avatar>
              <Textarea
                autoFocus
                value={thoughts}
                onChange={e => setThoughts(e.target.value)}
                placeholder="Add your thoughts…"
                className="flex-1 min-h-[80px] resize-none text-sm bg-muted/30 border-border"
                maxLength={500}
              />
            </div>
            {/* Quoted post */}
            <div className="dash-card p-3 space-y-1.5 ml-10">
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5"><AvatarFallback className="text-[9px]">{post.author.name[0]}</AvatarFallback></Avatar>
                <span className="text-xs font-semibold">{post.author.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setMode("menu")}>{t("back")}</Button>
              <Button size="sm" className="dash-button-primary h-8 px-4 text-xs" onClick={() => handleRepost(true)} disabled={loading || !thoughts.trim()}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat2 className="w-3.5 h-3.5 mr-1" />}
                {t("repost")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
