"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type TrendingTag = { tag: string; posts: number };
type SuggestedUser = { id: string; name: string; username: string; avatar?: string | null; verified?: boolean };
type Announcement = { id: string; title: string; priority: string };

export function RightSidebar() {
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (dashUser?.schoolId) params.set("schoolId", dashUser.schoolId);
        if (dashUser?.id) params.set("currentUserId", dashUser.id);
        const res = await fetch(`/api/sidebar?${params}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setTrending(Array.isArray(json.trending) ? json.trending : []);
          setSuggested(Array.isArray(json.suggested) ? json.suggested : []);
          setAnnouncements(Array.isArray(json.announcements) ? json.announcements : []);
        }
      } catch {
        console.error("Failed to load sidebar data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dashUser?.id, dashUser?.schoolId]);

  return (
    <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-4 px-5 py-5 border-l border-border sticky top-0 h-screen overflow-y-auto no-scrollbar">
      <div className="dash-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("trending")}</h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        ) : trending.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No trending topics yet.</p>
        ) : (
          trending.map((trend) => (
            <Link key={trend.tag} href={`/main/search?q=${encodeURIComponent(trend.tag)}`} className="block group">
              <p className="text-sm font-semibold text-primary group-hover:underline">{trend.tag}</p>
              <p className="text-[10px] text-muted-foreground">{trend.posts} posts</p>
            </Link>
          ))
        )}
      </div>

      <div className="dash-card p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("suggested")}</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : suggested.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No users to suggest.</p>
        ) : (
          suggested.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2">
              <Link href={`/main/profile/${u.username}`} className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={u.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{u.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold truncate">{u.name}</p>
                    {u.verified && <span className="verified-badge shrink-0">✓</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                </div>
              </Link>
              <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 shrink-0">
                <Link href={`/main/profile/${u.username}`}>{t("profile")}</Link>
              </Button>
            </div>
          ))
        )}
      </div>

      {announcements.length > 0 && (
        <div className="dash-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Announcements</h3>
          </div>
          {announcements.map((a) => (
            <div key={a.id} className="space-y-0.5">
              <p className="text-xs font-semibold leading-snug">{a.title}</p>
              {a.priority === "URGENT" || a.priority === "EMERGENCY" ? (
                <span className="text-[9px] font-bold text-destructive uppercase">Urgent</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
