"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Users, Lock, Globe, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ensureDbUser } from "@/lib/client-user";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface GroupItem {
  id: string;
  name: string;
  desc: string;
  members: number;
  type: "public" | "private";
  joined: boolean;
  requested?: boolean;
  ownerId?: string;
  avatar?: string;
}

type JoinRequest = {
  id: string;
  groupId: string;
  requesterId: string;
  groupName: string;
  createdAt: string;
  requester: { id: string; name: string; username: string; profilePhoto?: string } | null;
};

export default function GroupsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { dashUser, session } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingGroupId, setWorkingGroupId] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", type: "public" });

  const loadGroups = async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (query.trim()) params.set("search", query.trim());

      const res = await fetch(`/api/groups?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load groups.");

      const nextGroups: GroupItem[] = Array.isArray(json?.groups)
        ? json.groups.map((group: any) => ({
            id: group.id,
            name: group.name,
            desc: group.description ?? "",
            members: group._count?.members ?? 0,
            type: group.isPublic ? "public" : "private",
            joined: dashUser ? group.members?.some((member: any) => member.userId === dashUser.id) : false,
            requested: false,
            ownerId: group.creatorId ?? undefined,
            avatar: group.photo ?? "",
          }))
        : [];

      setGroups(nextGroups);
    } catch (error: any) {
      toast({ title: t("groupsUnavailable"), description: error?.message ?? "Please try again." });
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadGroups();
  }, [query, dashUser?.id]);

  useEffect(() => {
    // Enable "Create community" deep-link: /main/groups?create=true
    if (searchParams.get("create") === "true") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const loadRequests = async () => {
    if (!dashUser) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/groups/join-requests?ownerId=${encodeURIComponent(dashUser.id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load join requests.");
      setRequests(Array.isArray(json?.requests) ? json.requests : []);
    } catch (error: any) {
      toast({ title: "Join requests unavailable", description: error?.message ?? "Please try again." });
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [dashUser?.id]);

  const filtered = useMemo(() => groups, [groups]);
  const myGroups = filtered.filter((g) => g.joined);
  const discover = filtered.filter((g) => !g.joined);

  const toggleJoin = async (group: GroupItem) => {
    if (!dashUser) return;

    setWorkingGroupId(group.id);
    try {
      await ensureDbUser(dashUser, session);
      const endpoint = group.joined ? `/api/groups/${group.id}/leave` : `/api/groups/${group.id}/join`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: dashUser.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Request failed.");

      setGroups((current) =>
        current.map((item) =>
          item.id === group.id
            ? {
                ...item,
                joined: json?.requested ? false : !group.joined,
                requested: !!json?.requested,
                members: json?.requested ? item.members : Math.max(0, item.members + (group.joined ? -1 : 1)),
              }
            : item
        )
      );
      toast({ title: json?.requested ? "Request sent for approval" : group.joined ? t("groupLeft") : t("groupJoined") });
    } catch (error: any) {
      toast({ title: t("groupUpdateFailed"), description: error?.message ?? "Please try again." });
    } finally {
      setWorkingGroupId(null);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !dashUser) return;

    setCreating(true);
    try {
      await ensureDbUser(dashUser, session);
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.desc.trim(),
          creatorId: dashUser.id,
          type: "STUDENT_CREATED",
          isPublic: form.type === "public",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create group.");

      await loadGroups();
      setCreating(false);
      setCreateOpen(false);
      setForm({ name: "", desc: "", type: "public" });
      toast({ title: t("groupCreated"), description: form.name.trim() });
    } catch (error: any) {
      setCreating(false);
      toast({ title: t("groupCreationFailed"), description: error?.message ?? "Please try again." });
    }
  };

  const handleRequestAction = async (req: JoinRequest, action: "approve" | "reject") => {
    if (!dashUser) return;
    try {
      const res = await fetch("/api/groups/join-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerId: dashUser.id,
          groupId: req.groupId,
          requesterId: req.requesterId,
          action,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to process request.");
      setRequests((prev) => prev.filter((x) => x.id !== req.id));
      if (action === "approve") {
        setGroups((prev) => prev.map((g) => (g.id === req.groupId ? { ...g, members: g.members + 1 } : g)));
      }
      toast({ title: action === "approve" ? "Request approved" : "Request rejected" });
    } catch (error: any) {
      toast({ title: "Request action failed", description: error?.message ?? "Please try again." });
    }
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-headline font-bold">{t("campusGroups")}</h1>
        <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> {t("createGroup")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("searchGroups")} className="pl-9 h-9 text-sm bg-muted/30" />
      </div>

      <Tabs defaultValue="discover">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          {(["discover", "myGroups", "requests"] as const).map(v => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
              {v === "myGroups"
                ? `${t(v)} (${myGroups.length})`
                : v === "discover"
                  ? `${t(v)} (${discover.length})`
                  : `Requests (${requests.length})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="discover" className="pt-4 space-y-3">
          {loading && <LoadingState />}
          {discover.map((g, i) => (
            <GroupRow key={g.id} group={g} onToggle={toggleJoin} t={t} delay={i * 40} loading={workingGroupId === g.id} />
          ))}
          {!loading && discover.length === 0 && <EmptyState t={t} />}
        </TabsContent>

        <TabsContent value="myGroups" className="pt-4 space-y-3">
          {loading && <LoadingState />}
          {myGroups.map((g, i) => (
            <GroupRow key={g.id} group={g} onToggle={toggleJoin} t={t} delay={i * 40} loading={workingGroupId === g.id} />
          ))}
          {!loading && myGroups.length === 0 && <EmptyState t={t} />}
        </TabsContent>

        <TabsContent value="requests" className="pt-4 space-y-3">
          {loadingRequests ? <LoadingState /> : requests.length === 0 ? <EmptyState t={t} /> : requests.map((r) => (
            <div key={r.id} className="dash-card p-3.5 flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-xl shrink-0">
                <AvatarImage src={r.requester?.profilePhoto} />
                <AvatarFallback className="rounded-xl bg-primary/15 text-primary font-bold">
                  {(r.requester?.name ?? "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.requester?.name ?? "Student"} wants to join</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.groupName} · @{r.requester?.username ?? "user"}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleRequestAction(r, "reject")}>
                  Reject
                </Button>
                <Button size="sm" className="dash-button-primary h-7 text-[11px]" onClick={() => handleRequestAction(r, "approve")}>
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t("createGroup")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a public or private community group. Private groups require approval before members can access content.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("groupName")}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("groupName")} className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("groupDescription")}</Label>
              <Textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder={t("whatIsGroupAbout")} className="min-h-[80px] resize-none text-sm bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("groupType")}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9 text-sm bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public"><div className="flex items-center gap-2 text-sm"><Globe className="w-3.5 h-3.5" />{t("publicGroup")}</div></SelectItem>
                  <SelectItem value="private"><div className="flex items-center gap-2 text-sm"><Lock className="w-3.5 h-3.5" />{t("privateGroup")}</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" type="button" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" size="sm" className="dash-button-primary h-8 px-4 text-xs" disabled={creating || !form.name.trim()}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                {t("createGroup")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupRow({ group, onToggle, t, delay, loading }: { group: GroupItem; onToggle: (group: GroupItem) => void; t: (k: any) => string; delay: number; loading: boolean }) {
  const router = useRouter();
  
  return (
    <div 
      className={cn(
        "dash-card p-3.5 flex items-center gap-3 transition-all duration-150 animate-in fade-in duration-200",
        group.joined ? "cursor-pointer hover:border-primary/50" : "hover:border-primary/25"
      )} 
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => {
        if (group.joined) {
          router.push(`/main/groups/${encodeURIComponent(group.id)}`);
        }
      }}
    >
      <Avatar className="w-11 h-11 rounded-xl shrink-0">
        <AvatarImage src={group.avatar} />
        <AvatarFallback className="rounded-xl bg-primary/15 text-primary font-bold">{group.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{group.name}</p>
          {group.type === "private" ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" /> : <Globe className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{group.desc}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{group.members.toLocaleString()} {t("members")}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {group.joined && (
          <Link href={`/main/groups/${encodeURIComponent(group.id)}`}>
            <Button size="sm" variant="outline" className="h-7 text-[11px] px-3 rounded-full">
              View Group
            </Button>
          </Link>
        )}
        <Button
          size="sm"
          variant={group.joined || group.requested ? "outline" : "default"}
          className={cn("h-7 text-[11px] px-3 rounded-full relative z-10",
            group.joined
              ? "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              : group.requested
                ? "border-border text-muted-foreground"
                : "dash-button-primary h-7 text-[11px] px-3"
          )}
          onClick={(e) => { e.stopPropagation(); onToggle(group); }}
          disabled={loading || !!group.requested}
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : group.joined
              ? <><Check className="w-3 h-3 mr-1" />{t("joined")}</>
              : group.requested
                ? "Requested"
                : t("joinGroup")}
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loadingGroups")}
    </div>
  );
}

function EmptyState({ t }: { t: (k: any) => string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{t("noResults")}</p>
      <p className="text-xs mt-1">{t("tryDifferent")}</p>
    </div>
  );
}
