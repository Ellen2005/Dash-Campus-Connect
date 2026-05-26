"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, ShieldCheck, Loader2, User, Lock, Hash, GraduationCap, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

type School = { id: string; name: string };
type FieldOfStudy = { id: string; name: string; description: string | null };
type Level = { id: string; name: string; description: string | null; order: number };

function validateStudentId(id: string): string | null {
  if (!id.trim()) return "Student ID is required.";
  if (id.trim().length < 4) return "Student ID must be at least 4 characters.";
  if (!/^[A-Z0-9\-_/]+$/i.test(id.trim())) return "Student ID can only contain letters, numbers, hyphens and underscores.";
  return null;
}

function validatePassword(pw: string, confirm: string): string | null {
  if (pw.length < 6) return "Password must be at least 6 characters.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}

export default function RegisterPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const { signUp } = useAuth();

  const [step, setStep] = useState<"form" | "pending">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const [form, setForm] = useState({
    schoolId: "",
    studentId: "",
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    fieldOfStudyId: "",
    levelId: "",
    agreed: false,
  });

  const [fields, setFields] = useState<FieldOfStudy[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  // Fetch fields when school is selected
  useEffect(() => {
    if (!form.schoolId) {
      setFields([]);
      return;
    }
    setFieldsLoading(true);
    fetch(`/api/schools/${encodeURIComponent(form.schoolId)}/fields`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.fields)) setFields(json.fields);
        else setFields([]);
      })
      .catch(() => setFields([]))
      .finally(() => setFieldsLoading(false));
  }, [form.schoolId]);

  // Fetch levels when school is selected
  useEffect(() => {
    if (!form.schoolId) {
      setLevels([]);
      return;
    }
    setLevelsLoading(true);
    fetch(`/api/schools/${encodeURIComponent(form.schoolId)}/levels`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.levels)) setLevels(json.levels);
        else setLevels([]);
      })
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [form.schoolId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.schoolId)          { setError("Please select your school."); return; }
    const idErr = validateStudentId(form.studentId);
    if (idErr)                   { setError(idErr); return; }
    if (form.fullName.trim().length < 2) { setError("Please enter your full name."); return; }
    if (form.username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    const pwErr = validatePassword(form.password, form.confirmPassword);
    if (pwErr)                   { setError(pwErr); return; }
    if (!form.fieldOfStudyId)    { setError("Please select your field of study."); return; }
    if (!form.levelId)           { setError("Please select your level."); return; }

    setLoading(true);
    try {
      const { error: authError } = await signUp({
        studentId:     form.studentId.trim().toUpperCase(),
        schoolId:      form.schoolId,
        password:      form.password,
        fullName:      form.fullName.trim(),
        username:      form.username.trim().toLowerCase().replace(/\s/g, "_"),
        fieldOfStudyId: form.fieldOfStudyId,
        levelId:       form.levelId,
      });

      if (authError) {
        if (authError.includes("already registered") || authError.includes("already exists")) {
          setError("This Student ID is already registered. Try signing in instead.");
        } else {
          setError(authError);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("pending");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
          <div className="flex justify-center"><DashLogo size={56} /></div>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-bounce-in">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold">{t("awaitingApproval")}</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t("approvalPending")}
            </p>
          </div>

          <div className="dash-card p-5 text-left space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t("whatHappensNext")}
            </p>
            {[
              t("step1Approval"),
              "You will be notified inside the app once approved",
              t("step3Profile"),
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          <div className="dash-card p-4 flex items-start gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">No email needed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your account is identified by your Student ID. No email address required — ever.
              </p>
            </div>
          </div>

          <Link href="/login">
            <Button variant="outline" className="w-full h-11">{t("signIn")}</Button>
          </Link>
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
          <h1 className="text-2xl font-headline font-bold">{t("joinDash")}</h1>
          <p className="text-sm text-muted-foreground">{t("premiumExperience")}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> No email required — Student ID only
          </div>
        </div>

        <div className="dash-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* School */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {t("yourSchool")}
              </Label>
              <Select value={form.schoolId} onValueChange={set("schoolId")} required>
                <SelectTrigger className="h-10 text-sm bg-muted/30">
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
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Student ID / Registration Number
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. 2024CS001 or UB22A001"
                  className="h-10 text-sm bg-muted/30 pl-9 uppercase font-mono tracking-wider"
                  value={form.studentId}
                  onChange={e => set("studentId")(e.target.value.toUpperCase())}
                  required
                  autoComplete="username"
                  autoCapitalize="characters"
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                This is your unique login identifier — exactly as it appears on your student card.
              </p>
            </div>

            {/* Full Name + Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {t("fullName")}
                </Label>
                <div className="relative">
                  <Input
                    className="h-10 text-sm bg-muted/30 pl-9"
                    placeholder="Alex Rivera"
                    required
                    value={form.fullName}
                    onChange={e => set("fullName")(e.target.value)}
                    autoComplete="name"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {t("username")}
                </Label>
                <div className="relative">
                  <Input
                    className="h-10 text-sm bg-muted/30 pl-9"
                    placeholder="arivera_comp"
                    required
                    value={form.username}
                    onChange={e => set("username")(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                    autoComplete="nickname"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">@</span>
                </div>
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    className="h-10 text-sm bg-muted/30 pl-9 pr-10"
                    required
                    value={form.password}
                    onChange={e => set("password")(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Minimum 6 characters</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {t("confirmPassword")}
                </Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    className="h-10 text-sm bg-muted/30 pl-9"
                    required
                    value={form.confirmPassword}
                    onChange={e => set("confirmPassword")(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Field of Study + Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Field of Study
                </Label>
                <Select onValueChange={set("fieldOfStudyId")} required disabled={fieldsLoading}>
                  <SelectTrigger className="h-10 text-sm bg-muted/30">
                    <SelectValue placeholder={fieldsLoading ? "Loading…" : "Select field…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fields.length === 0 && !fieldsLoading && form.schoolId && (
                  <p className="text-[10px] text-muted-foreground">No fields available for this school.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Level / Year
                </Label>
                <Select onValueChange={set("levelId")} required disabled={levelsLoading}>
                  <SelectTrigger className="h-10 text-sm bg-muted/30">
                    <SelectValue placeholder={levelsLoading ? "Loading…" : "Select level…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels
                      .sort((a, b) => a.order - b.order)
                      .map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {levels.length === 0 && !levelsLoading && form.schoolId && (
                  <p className="text-[10px] text-muted-foreground">No levels available for this school.</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="terms"
                className="border-border data-[state=checked]:bg-primary mt-0.5"
                checked={form.agreed}
                onCheckedChange={c => set("agreed")(!!c)}
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                {t("agreeTerms")} and{" "}
                <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2.5 text-xs bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full dash-button-primary h-11"
              disabled={loading || !form.agreed || !form.schoolId}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><ArrowRight className="w-4 h-4 mr-2" />{t("createAccount")}</>
              }
            </Button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-5 border-t border-border mt-5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Student ID verified by your school admin
            </div>
            <p className="text-xs">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                {t("signIn")}
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
