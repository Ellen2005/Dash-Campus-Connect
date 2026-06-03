"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Lock, Send, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

type Community = {
  id: string; name: string; description: string | null;
  type: string; isAutoAssigned: boolean; isMember: boolean; memberRole: string | null;
  _count: { members: number; posts: number };
  fieldOfStudy: { name: string } | null;
  level: { name: string } | null;
};
type Post = { id: string; content: string; authorId: string | null; createdAt: string };
type CommunityGroup = {
  id: string; name: string; description: string | null; isPrivate: boolean;
  createdAt: string;
  _count: { members: number };
  members: { user: { id: string; name: string; profilePhoto: string | null } }[];
};

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const router = useRouter();
  const { dashUser } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Create group dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", isPrivate: false });

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, gRes] = await Promise.all([
        fetch(`/api/communities/${communityId}?userId=${dashUser?.id ?? ""}`, { cache: "no-store" }),
        fetch(`/api/communities/${communityId}/posts`, { cache: "no-store" }),
        fetch(`/api/communities/${communityId}/groups`, { cache: "no-store" }),
      ]);
      const cJson = await cRes.json().catch(() => ({}));
      const pJson = await pRes.json().catch(() => ({}));
      const gJson = await gRes.json().catch(() => ({}));
      if (cRes.ok) setCommunity(cJson.community);
      if (pRes.ok && Array.isArray(pJson.posts)) setPosts(pJson.posts);
      if (gRes.ok && Array.isArray(gJson.groups)) setGroups(gJson.groups);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (communityId) void load(); }, [communityId, dashUser?.id]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser || !postContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: postContent.trim(), authorId: dashUser.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to post.");
      setPostContent("");
      setPosts(prev => [json.post, ...prev]);
      toast({ title: "Posted!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!dashUser || !community) return;
    const endpoint = community.isMember ? "leave" : "join";
    const res = await fetch(`/api/communities/${communityId}/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: dashUser.id }),
    });
    if (res.ok) {
      setCommunity(prev => prev ? { ...prev, isMember: !prev.isMember } : prev);
      toast({ title: community.isMember ? "Left community" : "Joined community!" });
    } else {
      const json = await res.json().catch(() => ({}));
      toast({ title: "Error", description: json?.error, variant: "destructive" });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser) return;
    setCreatingGroup(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/groups`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || undefined,
          isPrivate: groupForm.isPrivate,
          creatorId: dashUser.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create group.");
      setGroupDialogOpen(false);
      setGroupForm({ name: "", description: "", isPrivate: false });
      toast({ title: "Group created!" });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingGroup(false);
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

  const canPost = community.isMember && !community.isAutoAssigned;
  const typeLabel: Record<string, string> = {
    FIELD_ONLY: "Field Community", LEVEL_ONLY: "Level Community",
    FIELD_AND_LEVEL: "Field + Level", STUDENT_CREATED: "Student Community",
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start">
          <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2 text-sm font-medium text-muted-foreground">
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2 text-sm font-medium text-muted-foreground">
            Groups ({groups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="pt-4 space-y-4">
          {community.isAutoAssigned && community.isMember && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              You were auto-assigned to this community. Posts are read-only — use the main feed to post.
            </div>
          )}

          {canPost && (
            <form onSubmit={handlePost} className="dash-card p-4 space-y-3">
              <Textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Share something with this community…"
                className="min-h-[80px] text-sm bg-muted/30 resize-none border-border"
                maxLength={5000}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="dash-button-primary h-8 text-xs gap-1.5" disabled={posting || !postContent.trim()}>
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
              <div key={post.id} className="dash-card p-4 space-y-2 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
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
                <p className="text-sm leading-relaxed">{post.content}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="pt-4 space-y-4">
          {community.isMember && (
            <div className="flex justify-end">
              <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                    <Plus className="w-3.5 h-3.5" /> Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Create Group</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateGroup} className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Group Name</Label>
                      <Input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Study Group" className="h-9 text-sm bg-muted/30" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
                      <Textarea value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this group about?" className="min-h-[70px] text-sm bg-muted/30 resize-none" maxLength={500} />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" size="sm" className="dash-button-primary" disabled={creatingGroup || !groupForm.name.trim()}>
                        {creatingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No groups yet.</p>
              {community.isMember && <p className="text-xs mt-1">Create the first group!</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {groups.map((group) => (
                <Card key={group.id} className="dash-card-hover p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{group.name}</h3>
                        {group.description && <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>}
                      </div>
                      {group.isPrivate && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Users className="w-3 h-3" /> {group._count.members} members
                    </div>
                    {group.members.length > 0 && (
                      <div className="flex items-center gap-1">
                        {group.members.slice(0, 3).map((m) => (
                          <Avatar key={m.user.id} className="w-6 h-6 border border-border">
                            <AvatarFallback className="text-[8px]">{m.user.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {group._count.members > 3 && (
                          <span className="text-[10px] text-muted-foreground ml-1">+{group._count.members - 3}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}