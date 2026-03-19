
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
    <div className={`obsidian-card p-5 space-y-4 ${isAnnouncement ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-headline font-semibold text-sm">{author.name}</span>
              {author.isVerified && <div className="w-3 h-3 champagne-gradient rounded-full" />}
              <span className="text-xs text-muted-foreground ml-1">@{author.username}</span>
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
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem className="text-sm">Save Post</DropdownMenuItem>
            <DropdownMenuItem className="text-sm text-destructive focus:text-destructive">
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {summary ? (
          <div className="bg-muted/50 p-3 rounded-lg border border-primary/20 relative animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-primary uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              AI Summary
            </div>
            <p className="text-sm leading-relaxed italic">{summary}</p>
            <button 
              onClick={() => setSummary(null)} 
              className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Show original
            </button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}

        {content.length > 200 && !summary && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-[10px] border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleSummarize}
            disabled={isSummarizing}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {isSummarizing ? "Summarizing..." : "Summarize with AI"}
          </Button>
        )}

        {image && (
          <div className="rounded-xl overflow-hidden border border-border">
            <img src={image} alt="Post media" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button 
          onClick={() => setLiked(!liked)}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors",
            liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
          )}
        >
          <Heart className={cn("w-5 h-5", liked && "fill-current")} />
          <span>{likes + (liked ? 1 : 0)}</span>
        </button>
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{comments}</span>
        </button>
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
