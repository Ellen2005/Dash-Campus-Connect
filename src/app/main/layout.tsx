"use client";

import { useEffect, useState } from "react";
import { ServerSidebar, ChannelSidebar } from "@/components/layout/discord-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, ShoppingBag, CalendarDays, LifeBuoy, User, Bell, Menu, TrendingUp, Search, X, Settings, Shield, MessageCircle, Loader2, Users, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DashLogo } from "@/components/shared/dash-logo";
import { useAuth } from "@/lib/auth-context";

type SuggestedUser = { id: string; name: string; username: string; profilePhoto?: string };

const mobileNavItems = (t: (k: any) => string) => [
  { href: "/main",              icon: Home,        label: t("feed") },
  { href: "/main/messages",     icon: MessageCircle,label: t("messages") },
  { href: "/main/search",       icon: Search,      label: t("search") },
  { href: "/main/profile",      icon: User,        label: t("profile") },
];

const drawerLinks = (t: (k: any) => string) => [
  { href: "/main",              icon: Home,        label: t("feed") },
  { href: "/main/communities",  icon: Globe,       label: "Communities" },
  { href: "/main/events",       icon: CalendarDays,label: t("events") },
  { href: "/main/marketplace",  icon: ShoppingBag, label: t("market") },
  { href: "/main/lost-found",   icon: Search,      label: t("lostFound") },
  { href: "/main/support",      icon: LifeBuoy,    label: t("support") },
  { href: "/main/notifications",icon: Bell,        label: t("notifications") },
  { href: "/main/messages",     icon: MessageCircle,label: t("messages") },
  { href: "/main/profile",      icon: Settings,    label: t("settings") },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, dashUser, loading, signOut } = useAuth();
  const canAccessAdmin = dashUser?.role === "student_admin" || dashUser?.role === "admin";
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = mobileNavItems(t);

  // Fetch suggested users (people current user doesn't follow)
  useEffect(() => {
    if (!dashUser?.id) return;
    const fetchSuggested = async () => {
      try {
        const res = await fetch(`/api/search?q=&currentUserId=${encodeURIComponent(dashUser.id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({ users: [] }));
        const others = (json.users ?? []).filter(
          (u: any) => u.id !== dashUser.id && u.status !== "connected"
        ).slice(0, 3);
        setSuggestedUsers(others);
      } catch {
        // silently fail — sidebar is not critical
      }
    };
    void fetchSuggested();
  }, [dashUser?.id]);

  // Fetch unread notification count
  useEffect(() => {
    if (!dashUser?.id) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/notifications/unread?userId=${encodeURIComponent(dashUser.id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({ count: 0 }));
        setUnreadCount(json.count ?? 0);
      } catch {
        // silently fail
      }
    };
    void fetchUnread();
    // Poll every 60s
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [dashUser?.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}...
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (dashUser?.status === "pending") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="flex justify-center">
            <DashLogo size={56} />
          </div>
          <h1 className="text-2xl font-headline font-bold">{t("awaitingApproval")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("approvalPending")}
          </p>
          <div className="dash-card p-5 space-y-3 text-left">
            <p className="text-xs text-muted-foreground">
              {t("studentIdLabel")}: <span className="font-mono text-primary font-bold">{dashUser.studentId}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("schoolName")}: <span className="font-semibold text-foreground">{dashUser.schoolId || t("unknown")}</span>
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button className="dash-button-primary" onClick={() => router.replace("/")}>
              {t("back")}
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              {t("signOut")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <DashLogo size={28} />
            <span className="font-headline font-bold text-base tracking-tight">Dash</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/main/search">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
                      <Link href="/main/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
                )}
              </Button>
            </Link>
            <Link href="/main/messages">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 md:px-6 page-enter">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center border-t border-border bg-card/90 backdrop-blur-sm sticky bottom-0 z-40">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/main" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {href === "/main/notifications" && (
                  <span className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 rounded-full bg-destructive" />
                )}
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
            { tag: "#CampusLife",   posts: "Live" },
            { tag: "#StudyGroup",   posts: "Active" },
            { tag: "#LostAndFound", posts: "New" },
            { tag: "#Events",       posts: "Today" },
          ].map((trend) => (
            <Link key={trend.tag} href="/main/search">
              <div className="group cursor-pointer">
                <p className="text-sm font-semibold text-primary group-hover:underline">{trend.tag}</p>
                <p className="text-[10px] text-muted-foreground">{trend.posts}</p>
              </div>
            </Link>
          ))}
        </div>

        {suggestedUsers.length > 0 && (
          <div className="dash-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("suggested")}</h3>
            {suggestedUsers.map((u) => (
              <Link key={u.username} href={`/main/profile/${u.username}`}>
                <div className="flex items-center justify-between gap-2 group cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-7 h-7 shrink-0">
                      {u.profilePhoto && <AvatarImage src={u.profilePhoto} />}
                      <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 shrink-0">
                    {t("following2")}
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-72 bg-card border-l border-border z-50 md:hidden flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <DashLogo size={28} />
                <span className="font-headline font-bold text-base">Dash</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawerOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* User info */}
            <div className="px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/15 text-primary font-bold">
                    {(dashUser?.fullName ?? "D").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{dashUser?.fullName ?? "Student"}</p>
                  <p className="text-[11px] text-muted-foreground">@{dashUser?.username ?? "student"}</p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
              {[...drawerLinks(t),
                ...(canAccessAdmin ? [
                  { href: "/main/student-admin", icon: Shield, label: "Student Admin" },
                  { href: "/main/admin-chat", icon: Shield, label: "Admin Chat" },
                  { href: "/main/admin", icon: Shield, label: t("admin") },
                ] : [])
              ].map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/main" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors",
                      active ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                © 2025 Dash — Campus Connect
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
