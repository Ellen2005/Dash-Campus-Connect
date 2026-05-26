"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserCheck, Users, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ensureDbUser } from "@/lib/client-user";
import { useToast } from "@/hooks/use-toast";

type Person = { id: string; name: string; username: string; avatar?: string; faculty: string; mutual: number; status: "connected" | "pending" | "none" };
type Group = { id: string; name: string; members: number; type: "public" | "private"; joined: boolean; requested?: boolean };

export default function SearchPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { dashUser, session } = useAuth();
  const searchParams = useSearchParams();
  const scopeGroupId = (searchParams.get("communityId") ?? "").trim();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (dashUser?.id) params.set("currentUserId", dashUser.id);
        if (scopeGroupId) params.set("scopeGroupId", scopeGroupId);

        const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to search.");

        setPeople(Array.isArray(json?.users) ? json.users : []);
        setGroups(Array.isArray(json?.groups) ? json.groups : []);
      } catch (error: any) {
        toast({ title: t("searchUnavailable"), description: error?.message ?? "Please try again." });
        setPeople([]);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [query, dashUser?.id, scopeGroupId]);

  const toggleConnect = async (person: Person) => {
    if (!dashUser) return;
    setWorkingId(person.id);
    try {
      await ensureDbUser(dashUser, session);
      const res = await fetch(`/api/users/${person.id}/follow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ followerId: dashUser.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to update connection.");

      setPeople((current) =>
        current.map((item) =>
          item.id === person.id
            ? { ...item, status: json?.action === "followed" ? "connected" : "none" }
            : item
        )
      );
    } catch (error: any) {
      toast({ title: t("connectionFailed"), description: error?.message ?? "Please try again." });
    } finally {
      setWorkingId(null);
    }
  };

  const toggleJoinGroup = async (group: Group) => {
    if (!dashUser) return;
    setWorkingId(group.id);
    try {
      await ensureDbUser(dashUser, session);
      const endpoint = group.joined ? `/api/groups/${group.id}/leave` : `/api/groups/${group.id}/join`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: dashUser.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to update group.");

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
    } catch (error: any) {
      toast({ title: t("groupActionFailed"), description: error?.message ?? "Please try again." });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <h1 className="text-xl font-headline font-bold">{t("search")}</h1>
      {scopeGroupId && (
        <p className="text-xs text-muted-foreground">
          Scoped to your current community.
        </p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-10 h-10 text-sm bg-muted/30"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Tabs defaultValue="people">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          {(["people", "groups"] as const).map(v => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground capitalize">
              {t(v)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="people" className="pt-4 space-y-2">
          {loading ? (
            <LoadingState />
          ) : people.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noResults")}</p>
            </div>
          ) : people.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors animate-in fade-in duration-150" style={{ animationDelay: `${i * 30}ms` }}>
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={p.avatar} />
                <AvatarFallback className="bg-primary/15 text-primary text-sm">{p.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">@{p.username} · {p.faculty}</p>
                <p className="text-[10px] text-muted-foreground">{p.mutual} {t("mutualConnections")}</p>
              </div>
              <Button
                size="sm"
                variant={p.status === "connected" ? "outline" : "default"}
                className={cn("h-7 text-[11px] px-2.5 rounded-full shrink-0",
                  p.status === "connected" && "border-primary/30 text-primary",
                  p.status === "pending" && "bg-muted text-muted-foreground border-border",
                  p.status === "none" && "dash-button-primary h-7 text-[11px] px-2.5"
                )}
                onClick={() => toggleConnect(p)}
                disabled={workingId === p.id}
              >
                {workingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" />
                  : p.status === "connected" ? <><UserCheck className="w-3 h-3 mr-1" />{t("connected")}</>
                  : p.status === "pending" ? <><X className="w-3 h-3 mr-1" />{t("pending")}</>
                  : <><UserPlus className="w-3 h-3 mr-1" />{t("sendRequest")}</>}
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="groups" className="pt-4 space-y-2">
          {loading ? <LoadingState /> : groups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors animate-in fade-in duration-150" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <Users className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground">{g.members.toLocaleString()} {t("members")} · {g.type}</p>
              </div>
              <Button
                size="sm"
                variant={g.joined ? "outline" : "default"}
                className={cn(
                  "h-7 text-[11px] px-2.5 rounded-full shrink-0",
                  g.joined ? "border-primary/30 text-primary" : g.requested ? "border-border text-muted-foreground" : "dash-button-primary"
                )}
                onClick={() => toggleJoinGroup(g)}
                disabled={workingId === g.id || !!g.requested}
              >
                {workingId === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : g.requested ? "Requested" : g.joined ? t("joined") : t("joinGroup")}
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loading")}
    </div>
  );
}
