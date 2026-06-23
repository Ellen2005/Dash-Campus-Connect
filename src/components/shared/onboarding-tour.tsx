"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { X, ArrowRight, TrendingUp, Users, ShoppingBag, CalendarDays, Search, LifeBuoy, Bell, Megaphone, MessageCircle, Heart, Share2, PlusCircle, ArrowUp } from "lucide-react";

const TOUR_KEY = "dash-tour-done";

const steps = [
  {
    emoji: "👋",
    titleKey: "tourWelcomeTitle" as const,
    descKey: "tourWelcomeDesc" as const,
    preview: (
      <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">D</div>
          <div>
            <p className="text-xs font-bold">Dash Campus Connect</p>
            <p className="text-[10px] text-muted-foreground">Your digital student lounge</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[TrendingUp, Users, ShoppingBag, CalendarDays, Search, LifeBuoy].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/8 border border-primary/15">
              <Icon className="w-4 h-4 text-primary" />
              <div className="w-8 h-1 bg-primary/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    titleKey: "tourFeedTitle" as const,
    descKey: "tourFeedDesc" as const,
    preview: (
      <div className="space-y-2">
        {[
          { name: "Alex Rivera", time: "15m ago", text: "Just finished the distributed systems project! 🚀", likes: 124, comments: 18 },
          { name: "Campus Dining", time: "1h ago", text: "Friday Special: Sushi Bar is back! 🍣✨", likes: 89, comments: 4, verified: true },
        ].map((p, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-3 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">{p.name[0]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-semibold">{p.name}</p>
                  {p.verified && <span className="text-[8px] bg-primary text-primary-foreground rounded-full px-1 font-bold">✓</span>}
                </div>
                <p className="text-[9px] text-muted-foreground">{p.time}</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{p.text}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-primary" />{p.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{p.comments}</span>
              <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /></span>
              <span className="flex items-center gap-1 ml-auto"><Heart className="w-3 h-3" /></span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: PlusCircle,
    titleKey: "tourFeedTitle" as const,
    descKey: "tourFeedDesc" as const,
    preview: (
      <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">How to interact with posts</p>
        <div className="space-y-2.5">
          {[
            { icon: ArrowUp,       color: "text-primary",     label: "Upvote / Downvote", desc: "Rank post quality — up for good content, down for low quality" },
            { icon: MessageCircle, color: "text-primary",     label: "Comment",            desc: "Tap the speech bubble to read and write comments" },
            { icon: Share2,        color: "text-primary",     label: "Share",              desc: "Repost with your thoughts, instantly, or share to WhatsApp" },
            { icon: Bell,          color: "text-destructive", label: "Notifications",      desc: "Bell icon shows likes, comments, mentions and announcements" },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div className={cn("w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0", color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    titleKey: "tourGroupsTitle" as const,
    descKey: "tourGroupsDesc" as const,
    preview: (
      <div className="space-y-2">
        {[
          { name: "Computer Science '26", members: 342, type: "public" },
          { name: "Women in STEM",        members: 218, type: "public" },
          { name: "Algorithms Study",     members: 45,  type: "private" },
        ].map((g, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">{g.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate">{g.name}</p>
              <p className="text-[10px] text-muted-foreground">{g.members} members · {g.type}</p>
            </div>
            <div className="text-[10px] font-bold text-primary border border-primary/30 rounded-full px-2 py-0.5">Join</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ShoppingBag,
    titleKey: "tourMarketTitle" as const,
    descKey: "tourMarketDesc" as const,
    preview: (
      <div className="grid grid-cols-2 gap-2">
        {[
          { title: "CLRS Algorithm Book", price: "XAF 4,500", condition: "Good" },
          { title: "MacBook Pro M2",      price: "XAF 850k",  condition: "Like New" },
          { title: "Room for Rent",       price: "XAF 45k/mo",condition: "N/A" },
          { title: "Casio Calculator",    price: "XAF 2,000", condition: "Fair" },
        ].map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-2.5 border border-border space-y-1.5">
            <div className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary/40" />
            </div>
            <p className="text-[10px] font-semibold line-clamp-1">{item.title}</p>
            <p className="text-[10px] text-primary font-bold">{item.price}</p>
            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{item.condition}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CalendarDays,
    titleKey: "tourEventsTitle" as const,
    descKey: "tourEventsDesc" as const,
    preview: (
      <div className="space-y-2">
        {[
          { title: "Class of 2025 Sunset Mixer", date: "Sat, May 15 · 6:00 PM", location: "Main Campus Green", going: 145 },
          { title: "AI in Medicine Workshop",    date: "Mon, May 17 · 10:00 AM", location: "Health Sciences Bldg", going: 42 },
        ].map((e, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-3 border border-border space-y-2">
            <div className="w-full h-12 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary/40" />
            </div>
            <p className="text-[11px] font-semibold">{e.title}</p>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>📅 {e.date}</p>
              <p>📍 {e.location}</p>
              <p>👥 {e.going} going</p>
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1 text-center text-[10px] font-bold text-primary border border-primary/30 rounded-lg py-1">Going</div>
              <div className="flex-1 text-center text-[10px] text-muted-foreground border border-border rounded-lg py-1">Maybe</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Megaphone,
    titleKey: "tourSupportTitle" as const,
    descKey: "tourSupportDesc" as const,
    preview: (
      <div className="space-y-2">
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-bold text-primary">Official Announcement</p>
            <span className="ml-auto text-[9px] text-muted-foreground">2h ago</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Graduation registration for Class of 2025 is now open.</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Support Center</p>
          {["Tech Support", "Report Behavior", "General Inquiry"].map(item => (
            <div key={item} className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: "🎉",
    titleKey: "tourDoneTitle" as const,
    descKey: "tourDoneDesc" as const,
    preview: (
      <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl p-5 border border-primary/20 text-center space-y-3">
        <div className="text-4xl">🎓</div>
        <p className="text-sm font-semibold">You're ready to explore Dash!</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: TrendingUp, label: "Feed" },
            { icon: Users,      label: "Groups" },
            { icon: Bell,       label: "Notifs" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
              <p className="text-[9px] font-semibold text-primary">{label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function OnboardingTour() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setVisible(true);
  }, []);

  const dismiss = () => { localStorage.setItem(TOUR_KEY, "1"); setVisible(false); };
  const next = () => { if (step < steps.length - 1) setStep(s => s + 1); else dismiss(); };

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = "icon" in current && current.icon ? current.icon : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              {step + 1} {t("ofSteps")} {steps.length}
            </span>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              {Icon ? <Icon className="w-5 h-5 text-primary" /> : <span className="text-xl">{"emoji" in current ? current.emoji : "👋"}</span>}
            </div>
            <div>
              <h2 className="text-base font-headline font-bold">{t(current.titleKey)}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(current.descKey)}</p>
            </div>
          </div>

          {current.preview}

          <div className="flex justify-center gap-1.5 pt-1">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={cn("rounded-full transition-all duration-200", i === step ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-border")} />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => setStep(s => s - 1)}>{t("back")}</Button>
            )}
            <Button size="sm" className="flex-1 dash-button-primary h-9 group" onClick={next}>
              {isLast ? t("getStarted") : t("next")}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {!isLast && (
            <button onClick={dismiss} className="w-full text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest">
              {t("skip")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
