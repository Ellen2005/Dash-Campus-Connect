"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserCheck, UserPlus, MessageCircle, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Person = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutual: number;
  status: "connected" | "pending" | "none";
};

interface ConnectionsDialogProps { open: boolean; onClose: () => void; }

export function ConnectionsDialog({ open, onClose }: ConnectionsDialogProps) {
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "connected" | "pending" | "none">>({});

  useEffect(() => {
    if (!open || !dashUser?.id) return;

    const userId = dashUser?.id;
    if (!userId) return;

    async function load() {
      setLoading(true);
      try {
        const [followersRes, followingRes, searchRes] = await Promise.all([
          fetch(`/api/users/${userId}/followers?limit=50`),
          fetch(`/api/users/${userId}/following?limit=50`),
          fetch(`/api/search?q=&currentUserId=${userId}`),
        ]);

        const followersJson = await followersRes.json().catch(() => ({}));
        const followingJson = await followingRes.json().catch(() => ({}));
        const searchJson = await searchRes.json().catch(() => ({}));

        const followerIds = new Set<string>(
          (followersJson.followers ?? []).map((u: { id: string }) => u.id)
        );
        const followingIds = new Set<string>(
          (followingJson.following ?? []).map((u: { id: string }) => u.id)
        );

        const connectedIds = new Set([...followerIds, ...followingIds]);

        const discovered: Person[] = (searchJson.users ?? []).map((u: { id: string; name: string; username: string; avatar?: string; mutual?: number; status?: string }) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar || "",
          mutual: u.mutual ?? 0,
          status: connectedIds.has(u.id) ? "connected" as const : u.status === "connected" ? "connected" as const : "none" as const,
        }));

        const fromFollowers: Person[] = (followersJson.followers ?? []).map((u: { id: string; name: string; username?: string; profilePhoto?: string }) => ({
          id: u.id,
          name: u.name,
          username: u.username || u.id.slice(0, 8),
          avatar: u.profilePhoto || "",
          mutual: 0,
          status: "connected" as const,
        }));

        const merged = new Map<string, Person>();
        [...fromFollowers, ...discovered].forEach((p) => merged.set(p.id, p));
        const list = [...merged.values()];
        setPeople(list);
        setStatuses(Object.fromEntries(list.map((p) => [p.id, p.status])));
      } catch {
        setPeople([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [open, dashUser?.id]);

  const filtered = people.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.username.toLowerCase().includes(query.toLowerCase())
  );

  const connected = filtered.filter(c => statuses[c.id] === "connected");
  const suggestions = filtered.filter(c => statuses[c.id] !== "connected");

  const toggle = async (id: string) => {
    if (!dashUser?.id) return;
    const current = statuses[id];
    if (current === "connected") {
      await fetch(`/api/users/${id}/follow?followerId=${dashUser.id}`, { method: "DELETE" }).catch(() => null);
      setStatuses(s => ({ ...s, [id]: "none" }));
      return;
    }
    const res = await fetch(`/api/users/${id}/follow`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ followerId: dashUser.id }),
    });
    if (res.ok) setStatuses(s => ({ ...s, [id]: "pending" }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dialog-panel max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{t("connections")}</DialogTitle>
          <DialogDescription className="sr-only">Manage your connections and find people</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("searchPeople")}
            className="pl-9 h-9 text-sm bg-muted/30"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="connections" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-transparent h-auto p-0 gap-4 border-b shrink-0">
              <TabsTrigger value="connections" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2 text-sm font-medium bg-transparent shadow-none">
                {t("myConnections")} ({connected.length})
              </TabsTrigger>
              <TabsTrigger value="discover" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2 text-sm font-medium bg-transparent shadow-none">
                {t("findPeople")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="flex-1 overflow-y-auto space-y-2 pt-3 no-scrollbar">
              {connected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("noResults")}</p>
              ) : connected.map(c => (
                <PersonRow key={c.id} person={c} status={statuses[c.id]} onToggle={toggle} t={t} showMessage />
              ))}
            </TabsContent>

            <TabsContent value="discover" className="flex-1 overflow-y-auto space-y-2 pt-3 no-scrollbar">
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("noResults")}</p>
              ) : suggestions.map(c => (
                <PersonRow key={c.id} person={c} status={statuses[c.id]} onToggle={toggle} t={t} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ person, status, onToggle, t, showMessage }: {
  person: Person;
  status: "connected" | "pending" | "none";
  onToggle: (id: string) => void;
  t: ReturnType<typeof useI18n>["t"];
  showMessage?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={person.avatar || undefined} />
        <AvatarFallback className="bg-primary/15 text-primary text-sm">{person.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{person.name}</p>
        <p className="text-[11px] text-muted-foreground">@{person.username} · {person.mutual} {t("mutualConnections")}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {showMessage && (
          <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
            <Link href={`/main/messages?user=${person.username}`}>
              <MessageCircle className="w-3.5 h-3.5" />
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant={status === "connected" ? "outline" : "default"}
          className={cn(
            "h-7 text-[11px] px-2.5 rounded-full",
            status === "connected" && "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
            status === "pending" && "bg-muted text-muted-foreground",
            status === "none" && "dash-button-primary h-7 text-[11px] px-2.5"
          )}
          onClick={() => onToggle(person.id)}
        >
          {status === "connected" ? (
            <><UserCheck className="w-3 h-3 mr-1" />{t("connected")}</>
          ) : status === "pending" ? (
            <><X className="w-3 h-3 mr-1" />{t("pending")}</>
          ) : (
            <><UserPlus className="w-3 h-3 mr-1" />{t("sendRequest")}</>
          )}
        </Button>
      </div>
    </div>
  );
}
