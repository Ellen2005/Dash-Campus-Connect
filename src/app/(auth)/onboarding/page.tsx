"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, Camera, ArrowRight, Bell, Moon, Sun, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [studentId, setStudentId] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleComplete = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast({ title: "Setup Complete!", description: "Welcome to the Dash community." });
      router.push("/main");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <DashLogo size={52} />
          </div>
          <h1 className="text-2xl font-headline font-bold">Personalize Your Dash</h1>
          <p className="text-sm text-muted-foreground">Just a few steps to get you connected.</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8 bg-primary" : step > i ? "w-8 bg-primary/40" : "w-1.5 bg-border"}`} />
          ))}
        </div>

        <div className="dash-card p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-xl">
                    <AvatarImage src={avatar || ""} />
                    <AvatarFallback className="bg-primary/15 text-primary text-3xl font-bold">AR</AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setAvatar(URL.createObjectURL(f)); }} />
                  </label>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold">Profile Picture</h3>
                  <p className="text-xs text-muted-foreground px-4">Upload a photo so your friends can recognize you.</p>
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full dash-button-primary group">
                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">About You</Label>
                  <span className="text-[10px] text-muted-foreground">{bio.length}/160</span>
                </div>
                <Textarea placeholder="Tell the campus who you are..." className="min-h-[100px] resize-none text-sm bg-muted/30"
                  maxLength={160} value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Student ID (Optional)</Label>
                <Input className="h-10 text-sm bg-muted/30" placeholder="UNIV-2024-XXXX" value={studentId} onChange={e => setStudentId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Social Link (Optional)</Label>
                <Input className="h-10 text-sm bg-muted/30" placeholder="https://linkedin.com/in/..." value={socialLink} onChange={e => setSocialLink(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 dash-button-primary">Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-semibold">Push Notifications</Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Alerts for messages and campus news.</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                      <Label className="text-sm font-semibold">Dark Theme</Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Switch between dark and light interface.</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex gap-3 items-start">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed italic text-muted-foreground">
                  "Dash is more than a social network — it's your academic and cultural passport. Welcome aboard."
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1 dash-button-primary">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Dash"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button variant="link" className="text-[10px] text-muted-foreground/60 uppercase tracking-widest hover:text-primary" onClick={() => router.push("/main")}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
