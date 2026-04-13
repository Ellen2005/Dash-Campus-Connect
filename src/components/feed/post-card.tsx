"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MessageCircle, Share2, MoreHorizontal, Sparkles,
  ArrowUp, ArrowDown, ChevronDown, Send, Bookmark, EyeOff, Flag
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "@/components/feed/report-dialog";
import { ShareDialog } from "@/components/shared/share-dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface PostCardProps {
  id?: string;
  author: { name: string; username: string; avatar: string; isVerified?: boolean; flair?: string; };
  content: string;
  image?: string;
  timestamp: string;
  score: number;
  comments: number;
  isAnnouncement?: boolean;
  channel?: string;
}

const mockComments = [
  { id: "c1", author: { name: "Sarah Chen", username: "schen_bio", avatar: "https://picsum.photos/seed/sarah/40/40" }, content: "Thanks for sharing! This really helped.", timestamp: "2h ago", likes: 3 },
  { id: "c2", author: { name: "Mike Johnson", username: "mjohnson_cs", avatar: "https://picsum.photos/seed/mike/40/40" }, content: "Have you tried the new study rooms in the library?", timestamp: "1h ago", likes: 1 },
];

export function PostCard({ id = "post", author, content, image, timestamp, score, comments, isAnnouncement, channel }: PostCardProps) {
  const { t } = useI18n();
  const [vote, setVote] = useState<"up" | "down" | "none">("none");
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({ c1: 3, c2: 1 });
  const [saved, setSaved] = useState(false);
  const [anon, setAnon] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleSummarize = () => {
    setSummarizing(true);
    setTimeout(() => {
      setSummary("This post discusses a key academic topic and invites peer collaboration.");
      setSummarizing(false);
    }, 900);
  };

  const currentScore = score + (vote === "up" ? 1 : vote === "down" ? -1 : 0);
  const displayAuthor = anon ? { ...author, name: t("anonymous"), username: "anon_user", avatar: "" } : author;

  return (
    <>
      <article className={cn(
        "dash-card p-4 space-y-3.5 group transition-all duration-200",
        "hover:border-primary/25 hover:shadow-[0_4px_24px_-8px_hsl(var(--primary)/0.12)]",
        isAnnouncement && "border-l-2 border-l-primary bg-primary/[0.03]"
      )}>
        {/* Channel tag */}
        {channel && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-widest">
            <span className="w-1 h-1 rounded-full bg-primary/60" />
            #{channel}
          </div>
        )}

        {/* Author row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2.5">
            <div className="relative shrink-0">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={displayAuthor.avatar} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {displayAuthor.name[0]}
                </AvatarFallback>
              </Avatar>
              {anon && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-muted rounded-full flex items-center justify-center border border-border">
                  <EyeOff className="w-2 h-2 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm leading-none">{displayAuthor.name}</span>
                {author.isVerified && <span className="verified-badge">✓</span>}
                {author.flair && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                    {author.flair}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground">@{displayAuthor.username}</span>
                <span className="text-muted-foreground/40 text-[10px]">·</span>
                <span className="text-[11px] text-muted-foreground">{timestamp}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setSaved(s => !s)}>
                <Bookmark className="w-3.5 h-3.5" />
                {saved ? t("unsave") : t("save")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setAnon(a => !a)}>
                <EyeOff className="w-3.5 h-3.5" />
                {anon ? t("showIdentity") : t("postAnonymously")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="w-3.5 h-3.5" />
                {t("report")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-2.5">
          {summary ? (
            <div className="bg-primary/8 border border-primary/20 rounded-lg p-3 relative animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> {t("aiInsight")}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 italic">"{summary}"</p>
              <button onClick={() => setSummary(null)} className="absolute top-3 right-3 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{content}</p>
          )}

          {content.length > 200 && !summary && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:bg-primary/8 px-2 font-semibold" onClick={handleSummarize} disabled={summarizing}>
              <Sparkles className="w-3 h-3 mr-1" />
              {summarizing ? t("analyzing") : t("aiSummary")}
            </Button>
          )}

          {image && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img src={image} alt="Post media" className="w-full h-auto object-cover max-h-96 transition-transform duration-300 hover:scale-[1.01]" loading="lazy" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          {/* Vote — upvote/downvote explained: arrows let you rank post quality */}
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-full px-1 py-0.5 border border-border/50" title={`${t("upvote")} / ${t("downvote")}`}>
            <button
              onClick={() => setVote(v => v === "up" ? "none" : "up")}
              title={t("upvote")}
              className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150",
                vote === "up" ? "bg-primary/15 text-primary scale-110" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className={cn("text-xs font-bold w-5 text-center tabular-nums",
              vote === "up" && "text-primary", vote === "down" && "text-muted-foreground"
            )}>
              {currentScore}
            </span>
            <button
              onClick={() => setVote(v => v === "down" ? "none" : "down")}
              title={t("downvote")}
              className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150",
                vote === "down" ? "bg-muted text-muted-foreground scale-110" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comments */}
          <Collapsible open={showComments} onOpenChange={setShowComments}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" title={t("comment")}>
                <MessageCircle className="w-4 h-4" />
                <span className="font-semibold">{comments}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", showComments && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3 pt-3 border-t border-border/50 animate-in fade-in duration-150">
              <div className="flex gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">U</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newComment.trim()) setNewComment(""); }}
                    placeholder={t("writeComment")}
                    className="flex-1 h-8 text-xs bg-muted/40 border-border"
                  />
                  <Button size="sm" className="h-8 px-2.5 bg-primary text-primary-foreground hover:opacity-90" disabled={!newComment.trim()} onClick={() => setNewComment("")}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {mockComments.map((c, i) => (
                <div key={c.id} className="flex gap-2 animate-in fade-in duration-150" style={{ animationDelay: `${i * 40}ms` }}>
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={c.author.avatar} />
                    <AvatarFallback className="text-[10px]">{c.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{c.author.name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-foreground/85">{c.content}</p>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
                        onClick={() => setCommentLikes(l => ({ ...l, [c.id]: (l[c.id] ?? c.likes) + 1 }))}
                      >
                        {t("like")} ({commentLikes[c.id] ?? c.likes})
                      </button>
                      <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium">
                        {t("reply")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Save indicator */}
          {saved && (
            <div className="flex items-center gap-1 text-[10px] text-primary font-semibold animate-in fade-in duration-150">
              <Bookmark className="w-3 h-3 fill-primary" /> {t("saved")}
            </div>
          )}

          {/* Share */}
          <button
            onClick={() => setShareOpen(true)}
            title={t("share")}
            className="ml-auto text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </article>

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        post={{ author, content }}
      />

      {/* Report dialog — standalone, not inside dropdown */}
      <ReportDialog
        contentType="post"
        contentId={id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
