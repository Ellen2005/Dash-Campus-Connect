"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, Megaphone, Heart, MessageCircle, UserPlus, AtSign, CheckCheck, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type NotifType = "like" | "comment" | "follow" | "mention" | "announcement" | "admin_tag" | "community";

interface Notif {
  id: string;
  type: NotifType;
  read: boolean;
  time: string;
  actor?: string;
  actorAvatar?: string;
  text: string;
  sub?: string;
  priority?: "normal" | "urgent" | "emergency";
  community?: string;
}

const MOCK_NOTIFS: Notif[] = [
  { id: "n1", type: "admin_tag",    read: false, time: "5m ago",   text: "Admin: Please report to the Dean's office today at 2PM.", sub: "Tagged specifically for you", priority: "urgent" },
  { id: "n2", type: "announcement", read: false, time: "1h ago",   text: "Graduation registration for Class of 2025 is now open.", sub: "University Registry · All Students", priority: "normal" },
  { id: "n3", type: "community",    read: false, time: "2h ago",   text: "New announcement for Computer Science '26: Lab sessions moved to Block D.", sub: "CS '26 Community", priority: "normal", community: "CS '26" },
  { id: "n4", type: "like",         read: false, time: "3h ago",   text: "Sarah Chen liked your post", sub: "Just finished the distributed systems project…", actor: "Sarah Chen", actorAvatar: "https://picsum.photos/seed/sarah/40/40" },
  { id: "n5", type: "comment",      read: true,  time: "5h ago",   text: "Mike Johnson commented on your post", sub: "Have you tried the new study rooms?", actor: "Mike Johnson", actorAvatar: "https://picsum.photos/seed/mike/40/40" },
  { id: "n6", type: "follow",       read: true,  time: "1d ago",   text: "Jordan Lee started following you", actor: "Jordan Lee", actorAvatar: "https://picsum.photos/seed/jordan/40/40" },
  { id: "n7", type: "mention",      read: true,  time: "1d ago",   text: "Priya Sharma mentioned you in a post", sub: "@arivera_comp check this out!", actor: "Priya Sharma", actorAvatar: "https://picsum.photos/seed/priya/40/40" },
  { id: "n8", type: "announcement", read: true,  time: "2d ago",   text: "Campus library hours extended during finals week.", sub: "University Admin · All Students", priority: "normal" },
];

const ICON_MAP: Record<NotifType, { icon: React.ElementType; color: string }> = {
  like:         { icon: Heart,          color: "text-destructive bg-destructive/10" },
  comment:      { icon: MessageCircle,  color: "text-primary bg-primary/10" },
  follow:       { icon: UserPlus,       color: "text-primary bg-primary/10" },
  mention:      { icon: AtSign,         color: "text-primary bg-primary/10" },
  announcement: { icon: Megaphone,      color: "text-primary bg-primary/10" },
  admin_tag:    { icon: Shield,         color: "text-destructive bg-destructive/10" },
  community:    { icon: Bell,           color: "text-primary bg-primary/10" },
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const all          = notifs;
  const announcements = notifs.filter(n => n.type === "announcement" || n.type === "admin_tag" || n.type === "community");
  const activity     = notifs.filter(n => n.type === "like" || n.type === "comment" || n.type === "follow" || n.type === "mention");
  const unreadCount  = notifs.filter(n => !n.read).length;

  const NotifList = ({ list }: { list: Notif[] }) => (
    <div className="space-y-1">
      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : list.map((n, i) => {
        const { icon: Icon, color } = ICON_MAP[n.type];
        return (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={cn(
              "w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-150 hover:bg-muted/40",
              !n.read && "bg-primary/[0.04] border border-primary/10",
              n.priority === "urgent" && "bg-amber-500/5 border border-amber-500/15",
              n.priority === "emergency" && "bg-destructive/5 border border-destructive/15",
              "animate-in fade-in duration-200"
            )}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="relative shrink-0">
              {n.actorAvatar ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={n.actorAvatar} />
                  <AvatarFallback className="text-xs">{n.actor?.[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              )}
              {!n.read && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-sm leading-snug", !n.read ? "font-semibold" : "font-normal text-muted-foreground")}>
                  {n.text}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {n.priority === "urgent" && (
                    <Badge className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">Urgent</Badge>
                  )}
                  {n.priority === "emergency" && (
                    <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Emergency
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                </div>
              </div>
              {n.sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.sub}</p>}
              {n.community && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary font-semibold">
                  <Bell className="w-2.5 h-2.5" /> {n.community}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-headline font-bold">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 h-7" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          {[
            { v: "all",           label: `All (${all.length})` },
            { v: "announcements", label: `Announcements (${announcements.length})` },
            { v: "activity",      label: `Activity (${activity.length})` },
          ].map(({ v, label }) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all"           className="pt-3"><NotifList list={all} /></TabsContent>
        <TabsContent value="announcements" className="pt-3"><NotifList list={announcements} /></TabsContent>
        <TabsContent value="activity"      className="pt-3"><NotifList list={activity} /></TabsContent>
      </Tabs>
    </div>
  );
}
