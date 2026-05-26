"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, Hash, Lock, Loader2, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

type School = { id: string; name: string };

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect Student ID or password. Please try again.",
  "Email not confirmed":       "Your account is not yet confirmed. Contact your admin.",
  "Too many requests":         "Too many login attempts. Please wait a few minutes.",
  "User not found":            "No account found with this Student ID.",
};

function friendlyError(msg: string): string {
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }
  return "Login failed. Please check your Student ID and password.";
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const { t } = useI18n();

  const [schoolId, setSchoolId]   = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [schools, setSchools]     = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setSchoolsLoading(true);
      try {
        const res = await fetch("/api/schools", { cache: "no-store" });
        const json = await res.json().catch(() => ({} as any));
        if (res.ok && Array.isArray(json?.schools)) setSchools(json.schools);
      } finally {
        setSchoolsLoading(false);
      }
    };
    run();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!schoolId)              { setError("Please select your school."); return; }
    if (!studentId.trim())      { setError("Please enter your Student ID."); return; }
    if (password.length < 6)    { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const { error: authError } = await signIn(studentId.trim(), schoolId, password);
      if (authError) {
        setError(friendlyError(authError));
        setLoading(false);
        return;
      }
      toast({ title: "Welcome back to Dash 👋", description: "Your campus network is ready." });
      router.push("/main");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 right-10 hidden md:block w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 hidden md:block w-52 h-52 rounded-full bg-primary/6 blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4"><DashLogo size={64} /></div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">{t("welcomeBack")}</h1>
          <p className="text-muted-foreground text-sm">{t("premiumPlatform")}</p>
        </div>

        <div className="dash-card p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-headline font-bold">{t("signIn")}</h2>
            <p className="text-xs text-muted-foreground">{t("enterCredentials")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* School selector */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {t("yourSchool")}
              </Label>
              <Select value={schoolId} onValueChange={setSchoolId} required>
                <SelectTrigger className="h-11 text-sm bg-muted/30">
                  <SelectValue placeholder={t("selectUniversity")} />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {schoolsLoading && (
                <p className="text-[10px] text-muted-foreground">Loading schools…</p>
              )}
            </div>

            {/* Student ID */}
            <div className="space-y-1.5">
              <Label htmlFor="studentId" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Student ID
              </Label>
              <div className="relative">
                <Input
                  id="studentId"
                  type="text"
                  placeholder="e.g. 2024CS001"
                  className="dash-input pl-10 uppercase"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value.toUpperCase())}
                  required
                  autoComplete="username"
                  autoCapitalize="characters"
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground">Your student registration number</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="dash-input pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2.5 bg-destructive/10 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full dash-button-primary group h-11">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{t("signIn")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              }
            </Button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" /> {t("verifiedCampus")}
            </div>
            <p className="text-xs">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                {t("joinCampus")}
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          {t("copyright")}
        </div>
      </div>
    </div>
  );
}
