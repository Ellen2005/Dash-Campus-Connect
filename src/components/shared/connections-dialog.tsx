"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserCheck, UserPlus, MessageCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const mockConnections = [
  { id: "1", name: "Sarah Chen",      username: "schen_bio",    avatar: "https://picsum.photos/seed/sarah/80/80",  mutual: 12, status: "connected" as const },
  { id: "2", name: "Mike Johnson",    username: "mjohnson_cs",  avatar: "https://picsum.photos/seed/mike/80/80",   mutual: 5,  status: "connected" as const },
  { id: "3", name: "Priya Sharma",    username: "priya_med",    avatar: "https://picsum.photos/seed/priya/80/80",  mutual: 8,  status: "pending" as const },
  { id: "4", name: "Jordan Lee",      username: "jlee_arts",    avatar: "https://picsum.photos/seed/jordan/80/80", mutual: 3,  status: "none" as const },
  { id: "5", name: "Dr. Sarah Miller",username: "sarahm",       avatar: "https://picsum.photos/seed/miller/80/80", mutual: 20, status: "none" as const },
  { id: "6", name: "Kwame Asante",    username: "kwame_eng",    avatar: "https://picsum.photos/seed/kwame/80/80",  mutual: 7,  status: "none" as const },
];

interface ConnectionsDialogProps { open: boolean; onClose: () => void; }

export function ConnectionsDialog({ open, onClose }: ConnectionsDialogProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, "connected" | "pending" | "none">>(
    Object.fromEntries(mockConnections.map(c => [c.id, c.status]))
  );

  const filtered = mockConnections.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.username.toLowerCase().includes(query.toLowerCase())
  );

  const connected = filtered.filter(c => statuses[c.id] === "connected");
  const suggestions = filtered.filter(c => statuses[c.id] !== "connected");

  const toggle = (id: string) => {
    setStatuses(s => ({
      ...s,
      [id]: s[id] === "none" ? "pending" : s[id] === "pending" ? "none" : s[id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
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
            {suggestions.map(c => (
              <PersonRow key={c.id} person={c} status={statuses[c.id]} onToggle={toggle} t={t} />
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ person, status, onToggle, t, showMessage }: {
  person: typeof mockConnections[0];
  status: "connected" | "pending" | "none";
  onToggle: (id: string) => void;
  t: (k: any) => string;
  showMessage?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={person.avatar} />
        <AvatarFallback className="bg-primary/15 text-primary text-sm">{person.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{person.name}</p>
        <p className="text-[11px] text-muted-foreground">@{person.username} · {person.mutual} {t("mutualConnections")}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {showMessage && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
            <MessageCircle className="w-3.5 h-3.5" />
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
