"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Search,
  Package,
  Loader2,
  Plus,
  MapPin,
  Clock,
} from "lucide-react";
import { ReportDialog } from "./ReportDialog";

type LostFoundCategory =
  | "Electronics"
  | "Clothing"
  | "Documents"
  | "Bags"
  | "Keys"
  | "Books"
  | "Other";

type LostFoundItem = {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  resolved: boolean;
  imageUrl?: string | null;
};

export default function LostFoundPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { dashUser } = useAuth();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  // Temporary: DB-backed wiring will be added after restoring build.
  // For now, show real items ONLY if `/api/lost-found` exists and responds.
  useEffect(() => {
    const load = async () => {
      if (!dashUser?.id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/lost-found?userId=${encodeURIComponent(dashUser.id)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to load items.");
        const next = Array.isArray(json?.items) ? json.items : [];
        setItems(next);
      } catch (e: any) {
        // Do not block the UI.
        toast({ title: "Lost & Found", description: e?.message ?? "Unavailable." });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [dashUser?.id, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q),
    );
  }, [items, query]);

  const lostItems = filtered.filter((i) => i.type === "lost" && !i.resolved);
  const foundItems = filtered.filter((i) => i.type === "found" && !i.resolved);
  const resolvedItems = filtered.filter((i) => i.resolved);

  const ItemCard = ({ item }: { item: LostFoundItem }) => {
    return (
      <div
        className={cn(
          "dash-card p-4 space-y-3 animate-in fade-in duration-200",
          item.resolved && "opacity-60",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <Badge
                className={cn(
                  "text-[9px] font-bold border shrink-0",
                  item.type === "lost"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-primary/10 text-primary border-primary/20",
                )}
              >
                {item.type === "lost" ? t("lostItems") : t("foundItems")}
              </Badge>
              {item.resolved && (
                <Badge className="text-[9px] bg-muted text-muted-foreground border-border">
                  {t("resolvedItems")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {item.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.date}
              </span>
              <Badge variant="secondary" className="text-[9px]">
                {item.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-headline font-bold">{t("lostFoundTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("lostFoundSubtitle")}</p>
        </div>
        <Button
          size="sm"
          className="dash-button-primary h-8 px-3 text-xs gap-1.5"
          onClick={() => setReportOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> {t("reportItem")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${t("search")} ${t("lostFoundTitle").toLowerCase()}…`}
          className="pl-9 h-9 text-sm bg-muted/30"
        />
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} onReported={async () => {
        // Reload items after submitting
        if (!dashUser?.id) return;
        const res = await fetch(`/api/lost-found?userId=${encodeURIComponent(dashUser.id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json?.items)) setItems(json.items);
      }} />

      <Tabs defaultValue="lost">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          <>
            <TabsTrigger
              value="lost"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {t("lostItems")} ({lostItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="found"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {t("foundItems")} ({foundItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {t("resolvedItems")} ({resolvedItems.length})
            </TabsTrigger>
          </>
        </TabsList>

        <TabsContent value="lost" className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : lostItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noLostItems")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lostItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="found" className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : foundItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noFoundItems")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {foundItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : resolvedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noResolvedItems")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

