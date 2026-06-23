"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en" as const, native: "English",  flag: "🇬🇧", desc: "Continue in English" },
  { code: "fr" as const, native: "Français", flag: "🇫🇷", desc: "Continuer en Français" },
];

export default function LanguagePickerPage() {
  const { setLang } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<"en" | "fr">("en");

  const handleContinue = () => {
    setLang(selected);
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4"><DashLogo size={64} /></div>
          <h1 className="text-2xl font-headline font-bold">
            {selected === "fr" ? "Choisissez votre langue" : "Choose Your Language"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selected === "fr"
              ? "Sélectionnez votre langue préférée pour continuer"
              : "Select your preferred language to continue"}
          </p>
        </div>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150",
                selected === lang.code
                  ? "border-primary bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1">
                <p className="font-semibold text-base">{lang.native}</p>
                <p className="text-xs text-muted-foreground">{lang.desc}</p>
              </div>
              {selected === lang.code && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button onClick={handleContinue} className="w-full dash-button-primary h-12 text-base group">
          {selected === "fr" ? "Continuer" : "Continue"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          {selected === "fr"
            ? "Vous pouvez changer cela plus tard dans les paramètres"
            : "You can change this later in settings"}
        </p>
      </div>
    </div>
  );
}
