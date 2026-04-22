import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users, CalendarDays, ShoppingBag } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-lines" />
        <div className="scan-line" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <svg width="38" height="38" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="64" height="64" rx="16" fill="hsl(var(--primary))"/>
            <rect width="64" height="64" rx="16" fill="white" fillOpacity="0.06"/>
            <path d="M15 12 L15 52" stroke="hsl(var(--primary-foreground))" strokeWidth="5.5" strokeLinecap="round"/>
            <path d="M15 12 C15 12 38 12 42 12 C52 12 54 20 54 32 C54 44 52 52 42 52 C38 52 15 52 15 52" stroke="hsl(var(--primary-foreground))" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M15 32 L37 32" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45"/>
          </svg>
          <div>
            <span className="block font-headline font-bold text-lg tracking-tight leading-none">Dash</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Campus Connect</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link href="/choose-language" className="dash-button-primary h-9 px-4 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-7">
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Campus pulse, instantly.
            </div>
          </div>

          <div>
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold leading-[1.08] tracking-tight animate-fade-up" style={{ animationDelay: "180ms" }}>
              Your campus,
            </h1>
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold leading-[1.08] tracking-tight gradient-text animate-fade-up" style={{ animationDelay: "260ms" }}>
              all in one place.
            </h1>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed max-w-md animate-fade-up" style={{ animationDelay: "340ms" }}>
            Feed, marketplace, events, announcements — one verified platform for your entire university community.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 animate-fade-up" style={{ animationDelay: "420ms" }}>
            <Link href="/choose-language" className="dash-button-primary h-11 px-6 text-sm group inline-flex items-center gap-2">
              Join Your Campus
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Verified .edu emails only
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1 animate-fade-up" style={{ animationDelay: "500ms" }}>
            {[["10k+", "Students"], ["500+", "Events/mo"], ["98%", "Uptime"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-xl font-headline font-bold text-primary">{val}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[480px] hidden lg:block">
          <div className="floating-card card-main animate-card-float" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/25 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">AR</div>
              <div className="flex-1 space-y-1">
                <div className="w-24 h-2 bg-foreground/12 rounded-full" />
                <div className="w-14 h-1.5 bg-foreground/7 rounded-full" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="w-full h-2 bg-foreground/8 rounded-full" />
              <div className="w-4/5 h-2 bg-foreground/6 rounded-full" />
              <div className="w-3/5 h-2 bg-foreground/5 rounded-full" />
            </div>
            <div className="w-full h-24 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10" />
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TrendingUp className="w-3 h-3 text-primary" /> 124
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="w-3 h-3" /> 18
              </div>
            </div>
          </div>

          <div className="floating-card card-announce animate-card-float" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">📢 Official</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            </div>
            <p className="text-xs font-semibold mb-1">Campus Announcement</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">Graduation registration is now open for Class of 2025.</p>
          </div>

          <div className="floating-card card-event animate-card-float" style={{ animationDelay: "800ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold">Hackathon 2025</p>
                <p className="text-[9px] text-muted-foreground">Sat · Main Hall</p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">+142 going</p>
          </div>

          <div className="floating-card card-market animate-card-float" style={{ animationDelay: "1200ms" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold">CLRS Algorithm Book</p>
                <p className="text-primary text-xs font-bold">XAF 4,500</p>
              </div>
              <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="orbit-ring" />
          <div className="orbit-dot orbit-dot-1" />
          <div className="orbit-dot orbit-dot-2" />
        </div>
      </main>

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-headline font-bold">Everything you need</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">Built for students, trusted by institutions.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp,   title: "Campus Feed",  desc: "Real-time posts, memes, and questions from your campus." },
            { icon: Users,        title: "Study Groups", desc: "Find and join groups by department, year, or interest." },
            { icon: ShoppingBag,  title: "Marketplace",  desc: "Buy and sell textbooks, gear, and more with peers." },
            { icon: CalendarDays, title: "Events",       desc: "Discover clubs, workshops, and social gatherings." },
          ].map((f, i) => (
            <div key={f.title} className="feature-card-glow dash-card p-5 space-y-3 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-9 h-9 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10 border-t border-border/40">
        <div className="marquee-track">
          <div className="marquee-content">
            {["Campus Feed","Study Groups","Marketplace","Events","Lost & Found","Announcements","Housing","Course Reviews","Clubs","Support",
              "Campus Feed","Study Groups","Marketplace","Events","Lost & Found","Announcements","Housing","Course Reviews","Clubs","Support"].map((item, i) => (
              <span key={i} className="marquee-item">
                <span className="w-1 h-1 rounded-full bg-primary/50 inline-block mr-2" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest border-t border-border/30">
        © 2025 Dash — Campus Connect · Built for Students
      </footer>
    </div>
  );
}
