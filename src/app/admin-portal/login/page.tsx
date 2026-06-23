"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashLogo } from "@/components/shared/dash-logo";
import { Building2, Lock, Hash, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!schoolId.trim()) { setError("Please enter your School ID."); return; }
    if (!password)        { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin-portal/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ schoolId: schoolId.trim().toLowerCase(), password }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(json?.error ?? "Incorrect School ID or password. Please try again.");
        setLoading(false);
        return;
      }

      toast({ title: `Welcome, ${json?.school?.name ?? "School"} Admin`, description: "You are now logged in to the admin portal." });
      router.push("/admin-portal");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4"><DashLogo size={60} /></div>
          <h1 className="text-2xl font-headline font-bold">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your school's campus platform.</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Restricted Access — Admins Only
          </div>
        </div>

        <div className="dash-card p-7 space-y-5 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">School ID</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. ubuea, uyd, demo"
                  className="dash-input pl-10 lowercase"
                  value={schoolId}
                  onChange={e => setSchoolId(e.target.value.toLowerCase())}
                  required
                  autoComplete="username"
                />
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground">The unique ID assigned to your school when it was registered on Dash.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Admin Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  className="dash-input pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2.5 bg-destructive/10 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full dash-button-primary h-11 group">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Sign In to Admin Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              }
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              New school?{" "}
              <a href="/admin-portal/register" className="text-primary font-bold hover:underline">
                Register your school on Dash
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              This portal is for school administrators only. Students use the main app.
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
