
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith(".edu") && !email.includes(".ac.")) {
      setError("Please use your verified institutional email address.");
      return;
    }
    setError("");
    // Actual login logic would go here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://picsum.photos/seed/dashbg/1920/1080')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl champagne-gradient text-background font-headline font-bold text-4xl shadow-xl mb-4">
            D
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Welcome to Dash</h1>
          <p className="text-muted-foreground">The exclusive university connection platform.</p>
        </div>

        <div className="obsidian-card p-8 space-y-6 bg-card/50 backdrop-blur-md">
          <div className="space-y-2">
            <h2 className="text-xl font-headline font-bold">Sign In</h2>
            <p className="text-xs text-muted-foreground">Verification required via institutional email</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">University Email</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="student@university.edu" 
                  className="bg-background/50 border-border focus:border-primary pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link href="#" className="text-[10px] text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                className="bg-background/50 border-border focus:border-primary"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 bg-destructive/10 text-[11px]">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11 champagne-gradient font-bold group">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Verified Campus Boundary Enforced
            </div>
            <p className="text-xs">
              New here? <Link href="#" className="text-primary font-bold hover:underline">Join your university community</Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
          &copy; 2025 DASH — CAMPUS CONNECT
        </div>
      </div>
    </div>
  );
}
