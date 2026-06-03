"use client";

import { cn } from "@/lib/utils";
import {
  Hash, Settings, Plus, Shield, Megaphone,
  ShoppingBag, Search, BookOpen, LifeBuoy, Bell, MessageCircle, Globe, ShieldCheck, Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { DashLogo } from "@/components/shared/dash-logo";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

type MyCommunity = { id: string; name: string };

export function ServerSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const canAccessAdmin = dashUser?.role === "student_admin" || dashUser?.role === "admin";
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);

  useEffect(() => {
    if (!dashUser?.schoolId || !dashUser?.id) return;
    fetch(`/api/communities?schoolId=${dashUser.schoolId}&userId=${dashUser.id}`, { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => {
        if (Array.isArray(json?.communities)) {
          setMyCommunities(
            json.communities
              .filter((c: any) => c.isMember)
              .slice(0, 5)
              .map((c: any) => ({ id: c.id, name: c.name }))
          );
        }
      });
  }, [dashUser?.schoolId, dashUser?.id]);

  return (
    <div className="w-[64px] hidden md:flex flex-col items-center py-3 gap-1 sidebar-bg border-r h-full">
      {/* Logo */}
      <Link href="/main" className="group relative flex items-center justify-center mb-1">
        <ActivePill show={pathname === "/main"} />
        <div className={cn(
          "transition-all duration-200",
          pathname === "/main" ? "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "group-hover:drop-shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
        )}>
          <DashLogo size={44} />
        </div>
      </Link>

      <div className="w-6 h-px bg-border my-1" />

      {/* My Communities */}
      <div className="flex-1 flex flex-col items-center gap-1 w-full overflow-y-auto no-scrollbar">
        {myCommunities.length === 0 ? (
          <div className="w-11 h-11 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground">
            <Users className="w-4 h-4" />
          </div>
        ) : myCommunities.map((c) => {
          const isActive = pathname === `/main/communities/${c.id}`;
          const label = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Link key={c.id} href={`/main/communities/${c.id}`} className="group relative flex items-center justify-center w-full" title={c.name}>
              <ActivePill show={isActive} />
              <div className={cn(
                "w-11 h-11 flex items-center justify-center font-bold text-xs transition-all duration-200",
                isActive
                  ? "rounded-xl bg-primary/15 text-primary border border-primary/30"
                  : "rounded-2xl bg-secondary text-secondary-foreground group-hover:rounded-xl group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                {label}
              </div>
            </Link>
          );
        })}

        <Link href="/main/communities" className="group relative flex items-center justify-center w-full mt-1" title="All communities">
          <div className="w-11 h-11 rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground transition-all duration-200 group-hover:rounded-xl group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/8">
            <Plus className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="w-6 h-px bg-border my-1" />

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        <SidebarIconBtn href="/main/notifications" icon={Bell}    label={t("notifications")} pathname={pathname} />
        <SidebarIconBtn href="/main/messages"      icon={MessageCircle} label={t("messages")} pathname={pathname} />
        <SidebarIconBtn href="/main/search"        icon={Search}   label={t("search")} pathname={pathname} />
        <SidebarIconBtn href="/main/support" icon={LifeBuoy} label={t("support")} pathname={pathname} />
        {canAccessAdmin && (
          <SidebarIconBtn href="/main/admin-chat" icon={ShieldCheck} label="Admin Chat" pathname={pathname} danger />
        )}
        {canAccessAdmin && (
          <SidebarIconBtn href="/main/admin" icon={Shield} label={t("admin")} pathname={pathname} danger />
        )}
        <SidebarIconBtn href="/main/profile" icon={Settings} label={t("settings")} pathname={pathname} />
      </div>
    </div>
  );
}

function ActivePill({ show }: { show: boolean }) {
  return (
    <div className={cn(
      "absolute left-0 w-0.5 bg-primary rounded-r-full transition-all duration-200",
      show ? "h-8" : "h-0"
    )} />
  );
}

function SidebarIconBtn({
  href, icon: Icon, label, pathname, danger
}: {
  href: string; icon: React.ElementType; label: string; pathname: string; danger?: boolean;
}) {
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} title={label} className={cn(
      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200",
      isActive
        ? danger
          ? "rounded-xl bg-destructive/15 text-destructive border border-destructive/30"
          : "rounded-xl bg-primary/15 text-primary border border-primary/30"
        : danger
          ? "text-muted-foreground hover:rounded-xl hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:rounded-xl hover:bg-primary/10 hover:text-primary"
    )}>
      <Icon className="w-[18px] h-[18px]" />
    </Link>
  );
}

export function ChannelSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const initials = (dashUser?.fullName ?? "D").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const categories = [
    {
      name: "CAMPUS",
      channels: [
        { name: t("feed"),        icon: Megaphone,   href: "/main" },
        { name: "general",        icon: Hash,        href: "/main" },
        { name: t("events"),      icon: BookOpen,    href: "/main/events" },
        { name: t("search"),      icon: Search,      href: "/main/search" },
      ],
    },
    {
      name: "COMMUNITY",
      channels: [
        { name: "Communities",    icon: Globe,       href: "/main/communities" },
        { name: t("market"),      icon: ShoppingBag, href: "/main/marketplace" },
        { name: t("lostFound"),   icon: Search,      href: "/main/lost-found" },
        { name: t("support"),     icon: LifeBuoy,    href: "/main/support" },
      ],
    },
  ];

  return (
    <div className="w-56 flex flex-col h-full sidebar-bg">
      <div className="h-12 px-4 border-b border-border flex items-center font-headline font-bold text-sm tracking-tight cursor-pointer hover:bg-muted/30 transition-colors shrink-0">
        {dashUser?.schoolName || "Dash"}
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4 no-scrollbar">
        {categories.map((cat) => (
          <div key={cat.name} className="px-2">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] px-2 mb-1">
              {cat.name}
            </p>
            <div className="space-y-px">
              {cat.channels.map((ch) => {
                const Icon = ch.icon;
                const isActive =
                  (ch.href === "/main" && pathname === "/main" && ch.name !== t("groups") && ch.name !== t("search")) ||
                  (ch.href !== "/main" && pathname.startsWith(ch.href));
                return (
                  <Link
                    key={ch.name + ch.href}
                    href={ch.href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-100 group",
                      isActive
                        ? "bg-primary/12 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-primary" : "opacity-50 group-hover:opacity-80")} />
                    <span className="truncate flex-1 text-[13px]">{ch.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User strip */}
      <Link href="/main/profile" className="px-3 py-2.5 border-t border-border flex items-center gap-2.5 hover:bg-muted/30 transition-colors cursor-pointer group shrink-0">
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px] relative shrink-0">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate leading-none">{dashUser?.fullName ?? "Student"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("online")}</p>
        </div>
        <Settings className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </Link>
    </div>
  );
}
