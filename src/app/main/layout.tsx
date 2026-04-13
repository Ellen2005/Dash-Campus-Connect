"use client";

import { ServerSidebar, ChannelSidebar } from "@/components/layout/discord-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, ShoppingBag, CalendarDays, LifeBuoy, User, Bell, Menu, TrendingUp, Users, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const mobileNav = [
    { href: "/main",             icon: Home,        label: t("feed") },
    { href: "/main/groups",      icon: Users,       label: t("groups") },
    { href: "/main/marketplace", icon: ShoppingBag, label: t("market") },
    { href: "/main/search",      icon: Search,      label: t("search") },
    { href: "/main/profile",     icon: User,        label: t("profile") },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebars */}
      <div className="flex h-screen sticky top-0 z-30">
        <ServerSidebar />
        <div className="hidden lg:flex flex-col h-full border-r border-border">
          <ChannelSidebar />
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-headline font-black text-primary-foreground text-sm">
              D
            </div>
            <span className="font-headline font-bold text-base tracking-tight">Dash</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/main/search">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 md:px-6 page-enter">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center border-t border-border bg-card/90 backdrop-blur-sm sticky bottom-0 z-40">
          {mobileNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/main" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right sidebar */}
      <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-4 px-5 py-5 border-l border-border sticky top-0 h-screen overflow-y-auto no-scrollbar">
        <div className="dash-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("trending")}</h3>
          </div>
          {[
            { tag: "#Hackathon2025", posts: "1.2k" },
            { tag: "#FinalsWeek",    posts: "850" },
            { tag: "#CampusVote",    posts: "420" },
            { tag: "#LostAndFound",  posts: "120" },
          ].map((trend) => (
            <div key={trend.tag} className="group cursor-pointer">
              <p className="text-sm font-semibold text-primary group-hover:underline">{trend.tag}</p>
              <p className="text-[10px] text-muted-foreground">{trend.posts} posts</p>
            </div>
          ))}
        </div>

        <div className="dash-card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Suggested</h3>
          {[
            { name: "Dr. Sarah Miller",    username: "sarahm",  verified: true },
            { name: "Engineering Society", username: "eng_soc", verified: true },
            { name: "Jake Thompson",       username: "jake_t",  verified: false },
          ].map((u) => (
            <div key={u.username} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{u.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold truncate">{u.name}</p>
                    {u.verified && <span className="verified-badge shrink-0">✓</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 shrink-0">
                {t("following2")}
              </Button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
