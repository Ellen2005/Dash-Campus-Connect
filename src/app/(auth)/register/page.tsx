"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, ArrowRight, ShieldCheck, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
    year: "",
    agreed: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      setIsLoading(false);
      return;
    }

    try {
      // Logic for Firebase Auth and Firestore User doc creation would go here
      // For now, we simulate success
      setTimeout(() => {
        toast({
          title: "Account Created",
          description: "Welcome to Dash! Let's get your profile set up.",
        });
        router.push("/onboarding");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian text-near-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#D4B86A22,transparent_60%)]" />
      
      <div className="relative w-full max-w-xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl champagne-gradient text-obsidian font-headline font-bold text-4xl shadow-xl mb-4">
            D
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Join Dash</h1>
          <p className="text-muted-foreground">The exclusive layer for your university life.</p>
        </div>

        <div className="obsidian-card p-8 bg-navy/50 backdrop-blur-md border-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input 
                  className="dash-input bg-obsidian/40" 
                  placeholder="Alex Rivera"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Username</Label>
                <Input 
                  className="dash-input bg-obsidian/40" 
                  placeholder="arivera_comp"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Input 
                  type="email"
                  className="dash-input bg-obsidian/40 pl-10" 
                  placeholder="your.email@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</Label>
                <Input 
                  type="password"
                  className="dash-input bg-obsidian/40" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                <Input 
                  type="password"
                  className="dash-input bg-obsidian/40" 
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Faculty</Label>
                <Select onValueChange={(v) => setFormData({...formData, faculty: v})}>
                  <SelectTrigger className="dash-input bg-obsidian/40">
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/5">
                    <SelectItem value="eng">Engineering</SelectItem>
                    <SelectItem value="sci">Science</SelectItem>
                    <SelectItem value="art">Arts & Humanities</SelectItem>
                    <SelectItem value="bus">Business</SelectItem>
                    <SelectItem value="med">Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Year of Study</Label>
                <Select onValueChange={(v) => setFormData({...formData, year: v})}>
                  <SelectTrigger className="dash-input bg-obsidian/40">
                    <SelectValue placeholder="Year 1 - 7" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-white/5">
                    {[1, 2, 3, 4, 5, 6, 7].map(y => (
                      <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                className="border-white/20 data-[state=checked]:bg-gold" 
                checked={formData.agreed}
                onCheckedChange={(checked) => setFormData({...formData, agreed: !!checked})}
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-none">
                I agree to the <Link href="#" className="text-gold hover:underline">Terms of Service</Link> and privacy policy.
              </Label>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 champagne-gradient text-obsidian font-bold group"
              disabled={isLoading || !formData.agreed}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-gold" />
              Institutional Security Layer Active
            </div>
            <p className="text-xs">
              Already have an account? <Link href="/login" className="text-gold font-bold hover:underline">Sign In</Link>
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
