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
import { ArrowRight, ShieldCheck, Loader2, Mail, User, Lock, GraduationCap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";

const MOCK_SCHOOLS = [
  { id: "uyd", name: "University of Yaoundé I", domain: "uy1.cm" },
  { id: "ubuea", name: "University of Buea", domain: "ubuea.cm" },
  { id: "demo", name: "Demo University", domain: "demo.edu" },
];

function isInstitutionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return false;
  if (domain.endsWith("gmail.com") || domain.endsWith("yahoo.com") || domain.endsWith("hotmail.com") || domain.endsWith("outlook.com")) return false;
  return true;
}

function matchesSchoolDomain(email: string, schoolDomain: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domain === schoolDomain.toLowerCase();
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "verify" | "pending">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const [form, setForm] = useState({
    schoolId: "", fullName: "", username: "", email: "",
    password: "", confirmPassword: "", faculty: "", year: "", agreed: false,
  });

  const selectedSchool = MOCK_SCHOOLS.find(s => s.id === form.schoolId);

  const validateEmail = () => {
    if (!form.email.includes("@")) return "Please enter a valid email address.";
    if (!isInstitutionalEmail(form.email)) return t("wrongDomain");
    if (selectedSchool && !matchesSchoolDomain(form.email, selectedSchool.domain))
      return `Please use your ${selectedSchool.name} email (@${selectedSchool.domain})`;
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail();
    if (emailErr) { setError(emailErr); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.username.length < 3) { setError("Username must be at least 3 characters."); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("verify");
    }, 1200);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length < 4) { setError("Please enter the verification code."); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("pending");
    }, 1000);
  };

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
          <div className="flex justify-center"><DashLogo size={56} /></div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold">{t("awaitingApproval")}</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t("approvalPending")}</p>
          </div>
          <div className="dash-card p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">What happens next?</p>
            {[
              "Your school admin reviews your registration",
              "You'll receive an email once approved",
              "Sign in and complete your profile",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-sm space-y-6 animate-fade-up">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3"><DashLogo size={48} /></div>
            <h1 className="text-2xl font-headline font-bold">{t("verifyEmail")}</h1>
            <p className="text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-semibold text-foreground">{form.email}</span></p>
          </div>
          <div className="dash-card p-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("verificationCode")}</Label>
                <Input
                  value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" className="h-12 text-center text-2xl font-mono tracking-[0.5em] bg-muted/30"
                  maxLength={6} required
                />
              </div>
              {error && <Alert variant="destructive" className="py-2 text-xs"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full dash-button-primary" disabled={isLoading || verifyCode.length < 6}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" />Verify & Continue</>}
              </Button>
              <button type="button" className="w-full text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => toast({ title: "Code resent!", description: `Check ${form.email}` })}>
                {t("resendCode")}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 right-10 hidden md:block w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 hidden md:block w-52 h-52 rounded-full bg-primary/6 blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3"><DashLogo size={52} /></div>
          <h1 className="text-2xl font-headline font-bold">Join Dash</h1>
          <p className="text-sm text-muted-foreground">The premium campus experience, built for students.</p>
        </div>

        <div className="dash-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your School</Label>
              <Select value={form.schoolId} onValueChange={v => setForm(f => ({ ...f, schoolId: v, email: "" }))} required>
                <SelectTrigger className="h-10 text-sm bg-muted/30">
                  <SelectValue placeholder="Select your university…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SCHOOLS.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">@{s.domain}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSchool && (
                <p className="text-[10px] text-primary flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Use your @{selectedSchool.domain} email address
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("fullName")}</Label>
                <div className="relative">
                  <Input className="h-10 text-sm bg-muted/30 pl-9" placeholder="Alex Rivera" required
                    value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("username")}</Label>
                <div className="relative">
                  <Input className="h-10 text-sm bg-muted/30 pl-9" placeholder="arivera_comp" required
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "_") }))} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("institutionalEmail")}</Label>
              <div className="relative">
                <Input type="email" className="h-10 text-sm bg-muted/30 pl-9"
                  placeholder={selectedSchool ? `you@${selectedSchool.domain}` : "your.email@university.edu"}
                  required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("password")}</Label>
                <div className="relative">
                  <Input type="password" className="h-10 text-sm bg-muted/30 pl-9" required
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Input type="password" className="h-10 text-sm bg-muted/30 pl-9" required
                    value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("faculty")}</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, faculty: v }))}>
                  <SelectTrigger className="h-10 text-sm bg-muted/30"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {["Engineering", "Science", "Arts & Humanities", "Business", "Medicine", "Law", "Education"].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("yearOfStudy")}</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger className="h-10 text-sm bg-muted/30"><SelectValue placeholder="Year…" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox id="terms" className="border-border data-[state=checked]:bg-primary mt-0.5"
                checked={form.agreed} onCheckedChange={c => setForm(f => ({ ...f, agreed: !!c }))} />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                {t("agreeTerms")} and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            {error && <Alert variant="destructive" className="py-2 text-xs"><AlertDescription>{error}</AlertDescription></Alert>}

            <Button type="submit" className="w-full dash-button-primary" disabled={isLoading || !form.agreed || !form.schoolId}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" />{t("createAccount")}</>}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-5 border-t border-border mt-5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" /> Institutional email verification required
            </div>
            <p className="text-xs">{t("alreadyHaveAccount")} <Link href="/login" className="text-primary font-bold hover:underline">{t("signIn")}</Link></p>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          © 2025 Dash — Campus Connect
        </div>
      </div>
    </div>
  );
}
