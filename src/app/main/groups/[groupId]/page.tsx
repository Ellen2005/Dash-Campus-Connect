"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageCircle, FileText, Loader2, Globe, Lock, Paperclip, X, Download } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { uploadFile } from "@/lib/upload";
import { useRef } from "react";

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { dashUser } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [gRes, pRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`, { cache: "no-store" }),
          fetch(`/api/posts?groupPostId=${groupId}`, { cache: "no-store" })
        ]);
        const gJson = await gRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));
        if (gRes.ok) setGroup(gJson);
        if (pRes.ok && Array.isArray(pJson.posts)) setPosts(pJson.posts);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser || (!postContent.trim() && !selectedFile)) return;
    setPosting(true);
    try {
      let fileUrls: string[] = [];
      if (selectedFile) {
        const { url, error } = await uploadFile(selectedFile, "groups", dashUser.id);
        if (url) fileUrls.push(url);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          content: postContent.trim() || `Shared a file: ${selectedFile?.name}`, 
          authorId: dashUser.id, 
          groupPostId: groupId, 
          audience: "SPECIFIC_GROUP",
          images: fileUrls
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to post.");
      setPostContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPosts(prev => [json, ...prev]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-16 page-enter">
        <Link href="/main/groups">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </Button>
        </Link>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6 pb-16 page-enter">
        <Link href="/main/groups">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </Button>
        </Link>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold">Group not found</p>
        </div>
      </div>
    );
  }

  const membersArray = group.members && Array.isArray(group.members) ? group.members : [];
  const memberCount = membersArray.length > 0 ? membersArray.length : (group._count?.members || 0);
  const isPublic = group.isPublic !== false;

  return (
    <div className="space-y-6 pb-16 page-enter max-w-3xl mx-auto">
      <Link href="/main/groups">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Button>
      </Link>

      {/* Group Header */}
      <div className="dash-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 rounded-xl">
            <AvatarImage src={group.photo || ""} />
            <AvatarFallback className="rounded-xl bg-primary/15 text-primary text-xl font-bold">
              {(group.name || "G")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-headline font-bold">{group.name}</h1>
              {isPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5" /> {memberCount} members
            </p>
            {group.description && (
              <p className="text-xs text-muted-foreground mt-2">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
            Posts
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
            Members ({memberCount})
          </TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
            Shared Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="pt-4 space-y-4">
          <form onSubmit={handlePost} className="dash-card p-4 space-y-3">
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Share something with your group..."
              className="w-full min-h-[80px] p-3 text-sm bg-muted/30 rounded-lg resize-none border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              maxLength={5000}
            />
            {selectedFile && (
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-3.5 h-3.5" /> Attach File
                </Button>
              </div>
              <Button type="submit" size="sm" className="dash-button-primary h-8 text-xs gap-1.5" disabled={posting || (!postContent.trim() && !selectedFile)}>
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                Post
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts yet in this group</p>
                <p className="text-xs mt-1">Be the first to share something!</p>
              </div>
            ) : posts.map((post, i) => (
              <div key={post.id} className="dash-card p-4 space-y-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.author?.profilePhoto} />
                    <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-bold">
                      {(post.author?.name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-none">{post.author?.name || "Student"}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {post.images.map((url: string, idx: number) => (
                      url.startsWith("data:image") || url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img key={idx} src={url} alt="Attachment" className="max-w-full h-auto rounded-lg max-h-64 object-cover border border-border" />
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs bg-muted/30 hover:bg-muted/60 p-3 rounded-lg border border-border transition-colors">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="flex-1 truncate">Attached Document/Resource</span>
                          <Download className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          {group.members && Array.isArray(group.members) && group.members.length > 0 ? (
            <div className="space-y-2">
              {group.members.filter((m: any) => m && typeof m === 'object').map((m: any) => (
                <div key={m.id || m.userId} className="dash-card p-3 flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={m.user?.profilePhoto} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs">
                      {(m.user?.name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.user?.name || "Student"}</p>
                    <p className="text-[10px] text-muted-foreground">@{m.user?.username || "user"}</p>
                  </div>
                  <Badge className="text-[9px] bg-muted text-muted-foreground border-border">
                    {m.role || "MEMBER"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Loading members...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="pt-4 space-y-3">
          {posts.filter((p) => p.images && p.images.length > 0).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No shared files yet</p>
              <p className="text-xs mt-1">Group members can share documents and resources here.</p>
            </div>
          ) : (
            posts
              .filter((p) => p.images && p.images.length > 0)
              .flatMap((post) => 
                post.images.map((url: string, idx: number) => (
                  <a key={`${post.id}-${idx}`} href={url} target="_blank" rel="noreferrer" className="dash-card p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">Resource shared by {post.author?.name || "Student"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))
              )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}