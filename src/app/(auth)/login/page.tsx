"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Welcome back to Dash", description: "Your campus network is ready." });
      router.push("/main");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 right-10 hidden md:block w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 hidden md:block w-52 h-52 rounded-full bg-primary/6 blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <DashLogo size={64} />
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Welcome to Dash</h1>
          <p className="text-muted-foreground text-sm">The premium university connection platform.</p>
        </div>

        <div className="dash-card p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-headline font-bold">Sign In</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials to access campus</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</Label>
              <div className="relative">
                <Input id="email" type="email" placeholder="alex@example.com" className="dash-input pl-10"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Password</Label>
                <Link href="#" className="text-[10px] text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" className="dash-input" 
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 bg-destructive/10 text-[11px]">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full dash-button-primary group">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" /> Verified Campus Boundary Enforced
            </div>
            <p className="text-xs">
              New here? <Link href="/register" className="text-primary font-bold hover:underline">Join your university community</Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          © 2025 Dash — Campus Connect
        </div>
      </div>
    </div>
  );
}
