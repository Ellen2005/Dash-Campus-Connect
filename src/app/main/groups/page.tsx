"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Users, Lock, Globe, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockGroups = [
  { id: "g1", name: "Computer Science '26", desc: "All CS students graduating in 2026", members: 342, type: "public", joined: true, avatar: "https://picsum.photos/seed/cs/80/80" },
  { id: "g2", name: "Women in STEM", desc: "Empowering women in science and technology", members: 218, type: "public", joined: true, avatar: "https://picsum.photos/seed/wstem/80/80" },
  { id: "g3", name: "Algorithms Study Group", desc: "Weekly sessions on data structures and algorithms", members: 45, type: "private", joined: false, avatar: "https://picsum.photos/seed/algo/80/80" },
  { id: "g4", name: "Campus Photography Club", desc: "Share your campus shots and learn together", members: 127, type: "public", joined: false, avatar: "https://picsum.photos/seed/photo/80/80" },
  { id: "g5", name: "Entrepreneurship Hub", desc: "Build, pitch, and grow your startup ideas", members: 89, type: "public", joined: false, avatar: "https://picsum.photos/seed/entre/80/80" },
  { id: "g6", name: "Medical Students Network", desc: "Resources and support for med students", members: 203, type: "private", joined: false, avatar: "https://picsum.photos/seed/med/80/80" },
];

export default function GroupsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(mockGroups.map(g => [g.id, g.joined]))
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", type: "public" });

  const filtered = mockGroups.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    g.desc.toLowerCase().includes(query.toLowerCase())
  );
  const myGroups = filtered.filter(g => joinedMap[g.id]);
  const discover = filtered.filter(g => !joinedMap[g.id]);

  const toggleJoin = (id: string) => {
    setJoinedMap(m => ({ ...m, [id]: !m[id] }));
    toast({ title: joinedMap[id] ? "Left group" : "Joined group!" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setCreateOpen(false);
      setForm({ name: "", desc: "", type: "public" });
      toast({ title: "Group created!", description: `"${form.name}" is now live.` });
    }, 1000);
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
          {(["discover", "myGroups"] as const).map(v => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
              {t(v)} {v === "myGroups" ? `(${myGroups.length})` : `(${discover.length})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="discover" className="pt-4 space-y-3">
          {discover.map((g, i) => (
            <GroupRow key={g.id} group={g} joined={false} onToggle={toggleJoin} t={t} delay={i * 40} />
          ))}
          {discover.length === 0 && <EmptyState t={t} />}
        </TabsContent>

        <TabsContent value="myGroups" className="pt-4 space-y-3">
          {myGroups.map((g, i) => (
            <GroupRow key={g.id} group={g} joined={true} onToggle={toggleJoin} t={t} delay={i * 40} />
          ))}
          {myGroups.length === 0 && <EmptyState t={t} />}
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t("createGroup")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("groupName")}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CS Study Group" className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("groupDescription")}</Label>
              <Textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="What is this group about?" className="min-h-[80px] resize-none text-sm bg-muted/30" />
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

function GroupRow({ group, joined, onToggle, t, delay }: { group: typeof mockGroups[0]; joined: boolean; onToggle: (id: string) => void; t: (k: any) => string; delay: number }) {
  return (
    <div className="dash-card p-3.5 flex items-center gap-3 hover:border-primary/25 transition-all duration-150 animate-in fade-in duration-200" style={{ animationDelay: `${delay}ms` }}>
      <Avatar className="w-11 h-11 rounded-xl shrink-0">
        <AvatarImage src={group.avatar} />
        <AvatarFallback className="rounded-xl bg-primary/15 text-primary font-bold">{group.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">{group.name}</p>
          {group.type === "private" ? <Lock className="w-3 h-3 text-muted-foreground shrink-0" /> : <Globe className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{group.desc}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{group.members.toLocaleString()} {t("members")}</span>
        </div>
      </div>
      <Button
        size="sm"
        variant={joined ? "outline" : "default"}
        className={cn("h-7 text-[11px] px-3 rounded-full shrink-0",
          joined ? "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "dash-button-primary h-7 text-[11px] px-3"
        )}
        onClick={() => onToggle(group.id)}
      >
        {joined ? <><Check className="w-3 h-3 mr-1" />{t("joined")}</> : t("joinGroup")}
      </Button>
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
