
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Search, 
  Bell, 
  MessageSquare, 
  Calendar, 
  ShoppingBag, 
  HelpCircle, 
  Settings, 
  User,
  ShieldAlert,
  PlusSquare,
  LogOut
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Calendar, label: "Events", href: "/events" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: HelpCircle, label: "Help Desk", href: "/help" },
];

const adminItems = [
  { icon: ShieldAlert, label: "Admin Panel", href: "/admin" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border-r w-64 p-4 hidden md:flex sticky top-0">
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 rounded-lg champagne-gradient flex items-center justify-center font-headline font-bold text-2xl text-background">
          D
        </div>
        <span className="font-headline font-bold text-xl tracking-tight">Dash</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all group",
                isActive 
                  ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>
          {adminItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all group",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="pt-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
