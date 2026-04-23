"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashLogo } from "@/components/shared/dash-logo";
import { Building2, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    schoolName: "", schoolId: "", country: "", adminName: "", password: "", confirmPassword: "",
  });
  const [generatedId, setGeneratedId] = useState("");

  const set = (k: keyof typeof form) => (v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "schoolName") {
        next.schoolId = v.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.schoolName.trim().length < 3) { setError("School name must be at least 3 characters."); return; }
    if (form.schoolId.trim().length < 2)   { setError("School ID must be at least 2 characters."); return; }
    if (form.adminName.trim().length < 2)  { setError("Admin name is required."); return; }
    if (form.password.length < 8)          { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setTimeout(() => {
      setGeneratedId(form.schoolId.trim().toLowerCase());
      setLoading(false);
      setDone(true);
      toast({ title: "School registered! 🎉", description: `${form.schoolName} is now on Dash.` });
    }, 1200);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
          <div className="flex justify-center"><DashLogo size={56} /></div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-bounce-in">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold">School Registered!</h1>
            <p className="text-sm text-muted-foreground">{form.schoolName} is now live on Dash.</p>
          </div>

          <div className="dash-card p-5 text-left space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Admin Credentials</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">School ID (Login)</p>
                  <p className="text-base font-mono font-bold text-primary">{generatedId}</p>
                </div>
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Password</p>
                <p className="text-sm font-mono">{"•".repeat(form.password.length)}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">What happens next:</p>
              <p>1. Students select <strong>{form.schoolName}</strong> when registering</p>
              <p>2. They register with their Student ID + password</p>
              <p>3. You approve them in the Admin Portal</p>
              <p>4. They can then sign in and use the app</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/admin-portal/login" className="flex-1">
              <Button className="w-full dash-button-primary h-11">Go to Admin Portal</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3"><DashLogo size={52} /></div>
          <h1 className="text-2xl font-headline font-bold">Register Your School</h1>
          <p className="text-sm text-muted-foreground">Create a Dash campus platform for your institution.</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Free to register — no credit card needed
          </div>
        </div>

        <div className="dash-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">School / University Name</Label>
              <div className="relative">
                <Input className="h-10 text-sm bg-muted/30 pl-9" placeholder="e.g. University of Buea"
                  value={form.schoolName} onChange={e => set("schoolName")(e.target.value)} required />
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">School ID (used to log in)</Label>
              <Input
                className="h-10 text-sm bg-muted/30 font-mono"
                placeholder="e.g. ubuea"
                value={form.schoolId}
                onChange={e => set("schoolId")(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Auto-generated from school name. This is your admin login ID — keep it safe.
                {form.schoolId && <span className="text-primary font-bold"> → "{form.schoolId}"</span>}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Country / City</Label>
              <Input className="h-10 text-sm bg-muted/30" placeholder="e.g. Cameroon, Buea"
                value={form.country} onChange={e => set("country")(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Name (Admin)</Label>
              <div className="relative">
                <Input className="h-10 text-sm bg-muted/30 pl-9" placeholder="e.g. Dr. John Doe"
                  value={form.adminName} onChange={e => set("adminName")(e.target.value)} required />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Admin Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} className="h-10 text-sm bg-muted/30 pl-9 pr-10"
                    value={form.password} onChange={e => set("password")(e.target.value)} required />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Min 8 characters</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Confirm Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} className="h-10 text-sm bg-muted/30 pl-9"
                    value={form.confirmPassword} onChange={e => set("confirmPassword")(e.target.value)} required />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2.5 text-xs bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full dash-button-primary h-11" disabled={loading}>
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><ArrowRight className="w-4 h-4 mr-2" />Register School on Dash</>
              }
            </Button>
          </form>

          <div className="pt-4 border-t border-border mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already registered?{" "}
              <Link href="/admin-portal/login" className="text-primary font-bold hover:underline">Sign in to Admin Portal</Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          © 2025 Dash — Campus Connect
        </div>
      </div>
    </div>
  );
}
