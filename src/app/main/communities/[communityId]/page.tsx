"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Lock, Send, Loader2, Paperclip, X, FileText, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/upload";
import { useRef } from "react";
import Link from "next/link";

type Community = {
  id: string; name: string; description: string | null;
  type: string; isAutoAssigned: boolean; isMember: boolean; memberRole: string | null;
  _count: { members: number; posts: number };
  fieldOfStudy: { name: string } | null;
  level: { name: string } | null;
};
type Post = { id: string; content: string; authorId: string | null; createdAt: string };

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const router = useRouter();
  const { dashUser } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/api/communities/${communityId}`, { cache: "no-store" }),
        fetch(`/api/communities/${communityId}/posts`, { cache: "no-store" }),
      ]);
      const cJson = await cRes.json().catch(() => ({}));
      const pJson = await pRes.json().catch(() => ({}));
      if (cRes.ok) setCommunity(cJson.community);
      if (pRes.ok && Array.isArray(pJson.posts)) setPosts(pJson.posts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (communityId) void load(); }, [communityId, dashUser?.id]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser || (!postContent.trim() && !selectedFile)) return;
    setPosting(true);
    try {
      let finalContent = postContent.trim() || `Shared a file: ${selectedFile?.name}`;
      if (selectedFile) {
        const { url } = await uploadFile(selectedFile, "communities", dashUser.id);
        if (url) {
          finalContent += `\n\n${url}`;
        }
      }

      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: finalContent }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to post.");
      setPostContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPosts(prev => [json.post, ...prev]);
      toast({ title: "Posted!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!community) return;
    const endpoint = community.isMember ? "leave" : "join";
    const res = await fetch(`/api/communities/${communityId}/${endpoint}`, {
      method: "POST",
    });
    if (res.ok) {
      setCommunity(prev => prev ? { ...prev, isMember: !prev.isMember } : prev);
      toast({ title: community.isMember ? "Left community" : "Joined community!" });
    } else {
      const json = await res.json().catch(() => ({}));
      toast({ title: "Error", description: json?.error, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
    </div>
  );

  if (!community) return (
    <div className="text-center py-20 text-muted-foreground">
      <p>Community not found.</p>
      <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go back</Button>
    </div>
  );

  const canPost = community.isMember;
  const typeLabel: Record<string, string> = {
    FIELD_ONLY: "Field Community", LEVEL_ONLY: "Level Community",
    FIELD_AND_LEVEL: "Field + Level", STUDENT_CREATED: "Student Community",
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-headline font-bold truncate">{community.name}</h1>
            <Badge className="text-[9px] bg-muted text-muted-foreground border-border shrink-0">
              {typeLabel[community.type] ?? community.type}
            </Badge>
            {community.isAutoAssigned && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          </div>
          {community.description && <p className="text-xs text-muted-foreground mt-0.5">{community.description}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">
            <Users className="w-3 h-3 inline mr-1" />{community._count.members} members
            {community.fieldOfStudy && ` · ${community.fieldOfStudy.name}`}
            {community.level && ` · ${community.level.name}`}
          </p>
        </div>
        {!community.isAutoAssigned && (
          <Button size="sm" variant={community.isMember ? "outline" : "default"} className={community.isMember ? "h-8 text-xs" : "h-8 text-xs dash-button-primary"} onClick={handleJoinLeave}>
            {community.isMember ? "Leave" : "Join"}
          </Button>
        )}
      </div>

      {community.isAutoAssigned && community.isMember && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          You were auto-assigned to this community. Posts are read-only — use the main feed to post.
        </div>
      )}

      {/* Groups quick action */}
      <div className="flex gap-2">
        <Link href="/main/groups" className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> View All Groups
          </Button>
        </Link>
        <Link href="/main/groups?create=true" className="flex-1">
          <Button size="sm" className="w-full h-9 text-xs gap-1.5 dash-button-primary">
            <UserPlus className="w-3.5 h-3.5" /> Create Group
          </Button>
        </Link>
      </div>

      {canPost && (
        <form onSubmit={handlePost} className="dash-card p-4 space-y-3">
          <Textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="Share something with this community…"
            className="min-h-[80px] text-sm bg-muted/30 resize-none border-border"
            maxLength={5000}
          />
          {selectedFile && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-primary" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
              <button type="button"   title="Remove selected file" aria-label="Remove selected file"onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <input type="file" ref={fileInputRef} className="hidden" aria-label="Attach file" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-3.5 h-3.5" /> Attach File
              </Button>
            </div>
            <Button type="submit" size="sm" className="dash-button-primary h-8 text-xs gap-1.5" disabled={posting || (!postContent.trim() && !selectedFile)}>
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No posts yet.</p>
            {canPost && <p className="text-xs mt-1">Be the first to post!</p>}
          </div>
        ) : posts.map((post, i) => (
          <div key={post.id} className="dash-card p-4 space-y-2 animate-in fade-in duration-200 post-card" data-delay={i * 40}>
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                  {post.authorId ? post.authorId[0].toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {post.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                part.match(/(https?:\/\/[^\s]+)/) ? (
                  <a key={i} href={part} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium break-all">{part}</a>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
