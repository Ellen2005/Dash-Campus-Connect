"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, Sparkles } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { summarizePostContent } from "@/ai/flows/post-content-summarizer-flow";
import { cn } from "@/lib/utils";

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isAnnouncement?: boolean;
}

export function PostCard({ author, content, image, timestamp, likes, comments, isAnnouncement }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await summarizePostContent({ postContent: content });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to summarize", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className={cn(
      "obsidian-card p-5 space-y-4 group",
      isAnnouncement && "border-primary/40 bg-primary/5 ring-1 ring-primary/10"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 border border-border group-hover:border-gold/30 transition-colors">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-sm">{author.name}</span>
              {author.isVerified && <div className="w-3.5 h-3.5 champagne-gradient rounded-full flex items-center justify-center text-[8px] text-obsidian font-bold">✓</div>}
              <span className="text-xs text-muted-foreground font-medium">@{author.username}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem className="text-xs font-bold">Save Post</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold text-destructive focus:text-destructive">
              <Flag className="w-3.5 h-3.5 mr-2" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {summary ? (
          <div className="bg-gold/5 p-4 rounded-xl border border-gold/10 relative animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              AI Insight
            </div>
            <p className="text-sm leading-relaxed italic text-gold/90 font-medium">"{summary}"</p>
            <button 
              onClick={() => setSummary(null)} 
              className="absolute top-4 right-4 text-[10px] text-gold/60 hover:text-gold font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}

        {content.length > 200 && !summary && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-[10px] border-gold/20 text-gold hover:bg-gold/10 font-bold uppercase tracking-wider"
            onClick={handleSummarize}
            disabled={isSummarizing}
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            {isSummarizing ? "Analyzing..." : "AI Summary"}
          </Button>
        )}

        {image && (
          <div className="rounded-xl overflow-hidden border border-border/50 bg-navy/50">
            <img src={image} alt="Post media" className="w-full h-auto object-cover max-h-[450px]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pt-3 border-t border-border/50">
        <button 
          onClick={() => setLiked(!liked)}
          className={cn(
            "flex items-center gap-2 text-xs font-bold transition-all",
            liked ? "text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", liked && "fill-current")} />
          <span>{likes + (liked ? 1 : 0)}</span>
        </button>
        <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-gold transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{comments}</span>
        </button>
        <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-gold transition-colors ml-auto group/share">
          <Share2 className="w-5 h-5 group-hover/share:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
