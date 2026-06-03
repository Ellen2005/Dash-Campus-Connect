"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, ArrowRight, Bell, Moon, Sun, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useAuth } from "@/lib/auth-context";
import { uploadFile } from "@/lib/upload";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { dashUser } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [hometown, setHometown] = useState("");

  // Prefill from profile (user table) so onboarding doesn't start with placeholders.
  useEffect(() => {
    if (!dashUser?.id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/users/${dashUser.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json().catch(() => ({} as any));
        if (typeof json?.bio === "string") setBio(json.bio);
        if (typeof json?.hometown === "string") setHometown(json.hometown);
        if (typeof json?.profilePhoto === "string") setAvatarPreview(json.profilePhoto);
      } catch {
        // ignore
      }
    };

    void load();
  }, [dashUser?.id]);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const initials = dashUser?.fullName
    ? dashUser.fullName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : "DA";

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      let profilePhoto: string | undefined;
      if (avatarFile && dashUser?.id) {
        const upload = await uploadFile(avatarFile, "avatars", dashUser.id);
        if (upload.url) profilePhoto = upload.url;
      }
      if (dashUser?.id) {
        await fetch(`/api/users/${dashUser.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bio: bio.trim() || undefined,
            hometown: hometown.trim() || undefined,
            ...(profilePhoto ? { profilePhoto } : {}),
          }),
        }).catch(() => null);
      }
      localStorage.setItem("dash-onboarding-done", "1");
      localStorage.setItem("dash-tour-done", "1");
      toast({ title: "Setup complete! Welcome to Dash 🎉" });
      router.push("/main");
    } catch {
      router.push("/main");
    } finally {
      setIsLoading(false);
    }
  };

  const skip = () => {
    localStorage.setItem("dash-onboarding-done", "1");
    router.push("/main");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3"><DashLogo size={52} /></div>
          <h1 className="text-2xl font-headline font-bold">Personalize Your Dash</h1>
          {dashUser?.fullName && (
            <p className="text-sm text-primary font-semibold">Welcome, {dashUser.fullName}! 👋</p>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8 bg-primary" : step > i ? "w-8 bg-primary/40" : "w-1.5 bg-border"}`} />
          ))}
        </div>

        <div className="dash-card p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-xl">
                    <AvatarImage src={avatarPreview ?? ""} />
                    <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:opacity-90 shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
                  </label>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{dashUser?.fullName ?? "Student"}</p>
                  <p className="text-xs text-muted-foreground">@{dashUser?.username ?? "student"} · {dashUser?.schoolName}</p>
                </div>
              </div>
              {(dashUser?.faculty || dashUser?.year) && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs space-y-1">
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Auto-assigned from registration</p>
                  {dashUser.faculty && <p className="text-muted-foreground">Field: <span className="text-foreground font-medium">{dashUser.faculty}</span></p>}
                  {dashUser.year && <p className="text-muted-foreground">Level: <span className="text-foreground font-medium">{dashUser.year}</span></p>}
                </div>
              )}
              <Button onClick={() => setStep(2)} className="w-full dash-button-primary group">
                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <button onClick={() => setStep(2)} className="w-full text-[10px] text-muted-foreground/60 hover:text-primary transition-colors uppercase tracking-widest">
                Skip photo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Bio</Label>
                  <span className="text-[10px] text-muted-foreground">{bio.length}/160</span>
                </div>
                <Textarea placeholder="Tell the campus who you are..." className="min-h-[90px] resize-none text-sm bg-muted/30"
                  maxLength={160} value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Hometown</Label>
                <Input className="h-10 text-sm bg-muted/30" placeholder="e.g. Yaoundé, Cameroon"
                  value={hometown} onChange={e => setHometown(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 dash-button-primary">Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-3">
                {[
                  { icon: Bell, label: "Push Notifications", desc: "Alerts for messages and campus news.", checked: notifications, set: setNotifications },
                  { icon: darkMode ? Moon : Sun, label: "Dark Theme", desc: "Switch between dark and light interface.", checked: darkMode, set: setDarkMode },
                ].map(({ icon: Icon, label, desc, checked, set }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><Label className="text-sm font-semibold">{label}</Label></div>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                    <Switch checked={checked} onCheckedChange={set} />
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex gap-3 items-start">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your academic communities have been auto-assigned. You can explore them from the sidebar.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1 dash-button-primary">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Dash"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button onClick={skip} className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors uppercase tracking-widest">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
