"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Search, Lock, Loader2, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Community = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isAutoAssigned: boolean;
  isMember: boolean;
  _count: { members: number; posts: number };
};

export default function CommunitiesPage() {
  const { dashUser } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = async () => {
    if (!dashUser?.schoolId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/communities?schoolId=${dashUser.schoolId}&userId=${dashUser.id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.communities)) setCommunities(json.communities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [dashUser?.schoolId]);

  const join = async (communityId: string) => {
    if (!dashUser) return;
    const res = await fetch(`/api/communities/${communityId}/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: dashUser.id }),
    });
    if (res.ok) {
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, isMember: true, _count: { ...c._count, members: c._count.members + 1 } } : c));
      toast({ title: "Joined community!" });
    } else {
      const json = await res.json().catch(() => ({}));
      toast({ title: "Failed to join", description: json?.error, variant: "destructive" });
    }
  };

  const leave = async (communityId: string) => {
    if (!dashUser) return;
    const res = await fetch(`/api/communities/${communityId}/leave`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: dashUser.id }),
    });
    if (res.ok) {
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, isMember: false, _count: { ...c._count, members: Math.max(0, c._count.members - 1) } } : c));
      toast({ title: "Left community" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser?.schoolId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || undefined, schoolId: dashUser.schoolId, creatorId: dashUser.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create community.");
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      toast({ title: "Community created!" });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const filtered = communities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const myCommunities = filtered.filter(c => c.isMember);
  const discover = filtered.filter(c => !c.isMember);

  const typeLabel: Record<string, string> = {
    FIELD_ONLY: "Field", LEVEL_ONLY: "Level", FIELD_AND_LEVEL: "Field + Level", STUDENT_CREATED: "Student",
  };

  const CommunityCard = ({ c }: { c: Community }) => (
    <div className="dash-card p-4 flex items-start gap-3 animate-in fade-in duration-200">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
        {c.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/main/communities/${c.id}`} className="text-sm font-semibold hover:text-primary transition-colors truncate">
            {c.name}
          </Link>
          <Badge className="text-[9px] bg-muted text-muted-foreground border-border shrink-0">
            {typeLabel[c.type] ?? c.type}
          </Badge>
          {c.isAutoAssigned && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">
          <Users className="w-3 h-3 inline mr-1" />{c._count.members} members · {c._count.posts} posts
        </p>
      </div>
      <div className="shrink-0">
        {c.isAutoAssigned ? (
          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">Auto-joined</Badge>
        ) : c.isMember ? (
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => leave(c.id)}>Leave</Button>
        ) : (
          <Button size="sm" className="h-7 text-[10px] dash-button-primary" onClick={() => join(c.id)}>Join</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Communities</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your field, level, and student-created communities.</p>
        </div>
        <Button className="dash-button-primary gap-2 h-9 text-sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities…" className="pl-9 h-9 text-sm bg-muted/30" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          {myCommunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Communities ({myCommunities.length})</p>
              {myCommunities.map(c => <CommunityCard key={c.id} c={c} />)}
            </div>
          )}
          {discover.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Discover ({discover.length})
              </p>
              {discover.map(c => <CommunityCard key={c.id} c={c} />)}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No communities found.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Create Community</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Study Group CS" className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this community about?" className="min-h-[80px] text-sm bg-muted/30 resize-none" maxLength={300} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="dash-button-primary" disabled={creating || !form.name.trim()}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
