
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Camera, ArrowRight, Bell, Moon, Sun, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [studentId, setStudentId] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    setIsLoading(true);
    // Simulate API call to update user profile
    setTimeout(() => {
      toast({
        title: "Setup Complete!",
        description: "Welcome to the Dash community.",
      });
      router.push("/");
    }, 1500);
  };

  const ProgressDots = () => (
    <div className="flex justify-center gap-2 mb-8">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className={`h-1.5 rounded-full transition-all duration-300 ${
            step === i ? "w-8 bg-gold" : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian text-near-white">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-2xl font-headline font-bold">Personalize Your Dash</h1>
          <p className="text-sm text-muted-foreground mt-1">Just a few steps to get you connected.</p>
        </div>

        <ProgressDots />

        <div className="obsidian-card p-8 bg-navy/50 backdrop-blur-md">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-gold shadow-2xl">
                    <AvatarImage src={avatar || ""} />
                    <AvatarFallback className="bg-charcoal text-4xl font-bold">AR</AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 p-2 bg-gold text-obsidian rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAvatar(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-bold">Profile Picture</h3>
                  <p className="text-xs text-muted-foreground px-4">
                    Upload a photo so your friends can recognize you. You can change this later.
                  </p>
                </div>
              </div>
              <Button onClick={nextStep} className="w-full h-11 dash-button-primary group">
                Continue
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">About You</Label>
                  <span className="text-[10px] text-muted-foreground">{bio.length}/160</span>
                </div>
                <Textarea 
                  placeholder="Tell the campus who you are..." 
                  className="dash-input bg-obsidian/40 min-h-[100px] resize-none"
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Student ID (Optional)</Label>
                <Input 
                  className="dash-input bg-obsidian/40" 
                  placeholder="UNIV-2024-XXXX"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Social Link (Optional)</Label>
                <Input 
                  className="dash-input bg-obsidian/40" 
                  placeholder="https://linkedin.com/in/..."
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex-1">Back</Button>
                <Button onClick={nextStep} className="flex-1 dash-button-primary">Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-obsidian/40 border border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gold" />
                      <Label className="text-sm font-bold">Push Notifications</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Alerts for messages and campus news.</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                    className="data-[state=checked]:bg-gold"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-obsidian/40 border border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {darkMode ? <Moon className="w-4 h-4 text-gold" /> : <Sun className="w-4 h-4 text-gold" />}
                      <Label className="text-sm font-bold">Obsidian Theme</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Switch between dark and light interface.</p>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                    className="data-[state=checked]:bg-gold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-gold shrink-0" />
                <p className="text-xs leading-relaxed italic">
                  "Dash is more than a social network—it's your academic and cultural passport. Welcome aboard."
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1 dash-button-primary">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Dash"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button variant="link" className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-gold" onClick={() => router.push("/")}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
