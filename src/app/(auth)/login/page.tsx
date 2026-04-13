
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back to Dash",
        description: "Your campus network is ready.",
      });
      router.push("/main");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 right-10 hidden md:block w-40 h-40 rounded-full bg-accent/15 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 hidden md:block w-52 h-52 rounded-full bg-secondary/10 blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-headline font-black text-4xl shadow-2xl shadow-primary/30 mb-4 animate-in fade-in zoom-in-95 duration-500 delay-100">
            D
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Welcome to Dash</h1>
          <p className="text-muted-foreground">The premium university connection platform.</p>
        </div>

        <div className="bg-card/90 border border-border p-8 space-y-6 shadow-xl backdrop-blur-xl rounded-2xl">
          <div className="space-y-2">
            <h2 className="text-xl font-headline font-bold">Sign In</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials to access campus</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="alex@example.com" 
                  className="dash-input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link href="#" className="text-[10px] text-accent hover:underline">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                className="dash-input"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 bg-destructive/10 text-[11px]">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full dash-button-primary group">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Verified Campus Boundary Enforced
            </div>
            <p className="text-xs">
              New here? <Link href="/register" className="text-accent font-bold hover:underline">Join your university community</Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] animate-in fade-in duration-500 delay-300">
          &copy; 2024 DASH — CAMPUS CONNECT
        </div>
      </div>
    </div>
  );
}
