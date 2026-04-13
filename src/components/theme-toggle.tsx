"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const themes = [
  { id: "black-gold",  label: "Obsidian Gold",   desc: "Luxury & Royalty",        swatch: "theme-swatch-black-gold",  emoji: "👑" },
  { id: "royal-blue",  label: "Royal Blue",       desc: "Professional & Bold",     swatch: "theme-swatch-royal-blue",  emoji: "🔷" },
  { id: "rose-pink",   label: "Rose Pink",        desc: "Soft & Feminine",         swatch: "theme-swatch-rose-pink",   emoji: "🌸" },
  { id: "warm-amber",  label: "Warm Amber",       desc: "Cozy & Energetic",        swatch: "theme-swatch-warm-amber",  emoji: "🌅" },
  { id: "emerald",     label: "Emerald",          desc: "Fresh & Natural",         swatch: "theme-swatch-emerald",     emoji: "🌿" },
  { id: "light",       label: "Clean Light",      desc: "Professional Light Mode", swatch: "theme-swatch-light",       emoji: "☀️" },
];

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {themes.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-3 w-full px-3.5 py-3 rounded-xl border text-left transition-all duration-150",
              active
                ? "border-primary/60 bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
            )}
          >
            <div className={cn("w-9 h-9 rounded-lg shrink-0 border border-white/10", t.swatch)} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold leading-none">{t.emoji} {t.label}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
            </div>
            {active && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
