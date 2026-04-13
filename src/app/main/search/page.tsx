"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserCheck, Users, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const mockPeople = [
  { id: "1", name: "Sarah Chen",       username: "schen_bio",    avatar: "https://picsum.photos/seed/sarah/80/80",  faculty: "Biology '25",      mutual: 12, status: "none" as const },
  { id: "2", name: "Mike Johnson",     username: "mjohnson_cs",  avatar: "https://picsum.photos/seed/mike/80/80",   faculty: "CS '26",           mutual: 5,  status: "connected" as const },
  { id: "3", name: "Priya Sharma",     username: "priya_med",    avatar: "https://picsum.photos/seed/priya/80/80",  faculty: "Medicine '27",     mutual: 8,  status: "pending" as const },
  { id: "4", name: "Jordan Lee",       username: "jlee_arts",    avatar: "https://picsum.photos/seed/jordan/80/80", faculty: "Arts '25",         mutual: 3,  status: "none" as const },
  { id: "5", name: "Kwame Asante",     username: "kwame_eng",    avatar: "https://picsum.photos/seed/kwame/80/80",  faculty: "Engineering '26",  mutual: 7,  status: "none" as const },
  { id: "6", name: "Dr. Sarah Miller", username: "sarahm",       avatar: "https://picsum.photos/seed/miller/80/80", faculty: "Faculty · Biology", mutual: 20, status: "none" as const },
];

const mockGroups = [
  { id: "g1", name: "Computer Science '26", members: 342, type: "public" },
  { id: "g2", name: "Women in STEM",        members: 218, type: "public" },
  { id: "g3", name: "Photography Club",     members: 127, type: "public" },
];

export default function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, "connected" | "pending" | "none">>(
    Object.fromEntries(mockPeople.map(p => [p.id, p.status]))
  );

  const filteredPeople = query.length > 0
    ? mockPeople.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.username.toLowerCase().includes(query.toLowerCase()))
    : mockPeople;

  const filteredGroups = query.length > 0
    ? mockGroups.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
    : mockGroups;

  const toggleConnect = (id: string) => {
    setStatuses(s => ({ ...s, [id]: s[id] === "none" ? "pending" : s[id] === "pending" ? "none" : s[id] }));
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <h1 className="text-xl font-headline font-bold">{t("search")}</h1>

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
          {filteredPeople.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noResults")}</p>
            </div>
          ) : filteredPeople.map((p, i) => (
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
                variant={statuses[p.id] === "connected" ? "outline" : "default"}
                className={cn("h-7 text-[11px] px-2.5 rounded-full shrink-0",
                  statuses[p.id] === "connected" && "border-primary/30 text-primary",
                  statuses[p.id] === "pending" && "bg-muted text-muted-foreground border-border",
                  statuses[p.id] === "none" && "dash-button-primary h-7 text-[11px] px-2.5"
                )}
                onClick={() => toggleConnect(p.id)}
              >
                {statuses[p.id] === "connected" ? <><UserCheck className="w-3 h-3 mr-1" />{t("connected")}</>
                  : statuses[p.id] === "pending" ? <><X className="w-3 h-3 mr-1" />{t("pending")}</>
                  : <><UserPlus className="w-3 h-3 mr-1" />{t("sendRequest")}</>}
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="groups" className="pt-4 space-y-2">
          {filteredGroups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors animate-in fade-in duration-150" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <Users className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground">{g.members.toLocaleString()} {t("members")} · {g.type}</p>
              </div>
              <Button size="sm" className="dash-button-primary h-7 text-[11px] px-2.5 rounded-full shrink-0">
                {t("joinGroup")}
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
