"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2, XCircle, Shield, Users, Megaphone, AlertTriangle,
  Building2, Search, Clock, Send, Loader2, LogOut, Info, BookOpen, Layers
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";

type PendingUser = {
  id: string;
  name: string;
  studentId: string;
  username?: string;
  faculty?: string;
  year?: string;
  joined?: string;
};

type SchoolUser = {
  id: string;
  name: string;
  studentId: string;
  faculty?: string;
  year?: string;
  role?: "student" | "student_admin" | "admin";
  status?: "active" | "suspended" | "pending";
};

export default function AdminPortalPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  const [adminSchoolName, setAdminSchoolName] = useState<string | null>(null);
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [students, setStudents] = useState<SchoolUser[]>([]);
  const [flags, setFlags] = useState<{ id: string; user: string; reason: string; reports: number; time: string; contentId: string }[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [allowedDomainInput, setAllowedDomainInput] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load admin session on mount
  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await fetch("/api/admin-portal/session", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.schoolId) {
            setAdminSchoolId(json.schoolId);
            setAdminSchoolName(json.schoolName || null);
          }
        }
      } catch {}
      setInitialized(true);
    }
    loadAdmin();
  }, []);

  // Fetch pending approvals
  useEffect(() => {
    if (!adminSchoolId) return;
    setPendingLoading(true);
    fetch(`/api/admin/users?status=pending&schoolId=${adminSchoolId}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.ok) setPendingList(json?.users ?? []);
        else setPendingError(json?.error ?? "Failed to load");
      })
      .catch(() => setPendingError("Network error"))
      .finally(() => setPendingLoading(false));
  }, [adminSchoolId]);

  // Fetch active students
  useEffect(() => {
    if (!adminSchoolId) return;
    fetch(`/api/admin/users?status=active&schoolId=${adminSchoolId}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.ok) setStudents(json?.users ?? []);
      })
      .catch(() => {});
  }, [adminSchoolId]);

  // Fetch flags
  useEffect(() => {
    if (!adminSchoolId) return;
    setFlagsLoading(true);
    fetch(`/api/moderation/flags?status=PENDING&schoolId=${adminSchoolId}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({} as any));
        if (res.ok && Array.isArray(json?.flags)) {
          setFlags(json.flags.map((f: any) => ({
            id: f.id,
            user: f.user?.username || "unknown",
            reason: f.reason,
            reports: 1,
            time: new Date(f.createdAt).toLocaleString(),
            contentId: f.contentId,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setFlagsLoading(false));
  }, [adminSchoolId]);

  const approve = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/approve-user`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, schoolId: adminSchoolId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Student approved" });
      setPendingList(p => p.filter(x => x.id !== userId));
    } catch {
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
    }
  };

  const reject = async (userId: string) => {
    try {
      await fetch(`/api/admin/approve-user`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, schoolId: adminSchoolId, action: "reject" }),
      });
      toast({ title: "Student rejected" });
      setPendingList(p => p.filter(x => x.id !== userId));
    } catch {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    }
  };

  const resolveFlag = async (id: string, action: "DISMISSED" | "REMOVE") => {
    try {
      if (action === "DISMISSED") {
        await fetch(`/api/moderation/flags/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DISMISSED" })
        });
        toast({ title: "Flag dismissed" });
      } else {
        await fetch(`/api/moderation/flags/${id}`, { method: "DELETE" });
        toast({ title: "Content removed" });
      }
      setFlags(f => f.filter(x => x.id !== id));
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const toggleRole = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/update-user`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, schoolId: adminSchoolId, toggleRole: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setStudents(s => s.map(u => u.id === userId ? { ...u, role: u.role === "student_admin" ? "student" : "student_admin" } : u));
      toast({ title: "Role updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const toggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/update-user`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, schoolId: adminSchoolId, toggleStatus: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setStudents(s => s.map(u => u.id === userId ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const signOutAdmin = () => {
    fetch("/api/admin-portal/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => { window.location.href = "/admin-portal/login"; });
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: announcement.trim(), schoolId: adminSchoolId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed");
      setAnnounceOpen(false);
      setAnnouncement("");
      toast({ title: `📢 Broadcast sent to ${json?.delivered ?? 0} students.` });
    } catch (e: any) {
      toast({ title: "Broadcast failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const saveSchoolSettings = async () => {
    if (!adminSchoolId) return;
    setSchoolSaving(true);
    try {
      const res = await fetch(`/api/admin/school-settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schoolId: adminSchoolId,
          name: schoolNameInput,
          allowedDomain: allowedDomainInput,
          requireApproval,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSchoolSaving(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: t("manageStudents"),  value: students.filter(s => s.status === "active").length, icon: Users,         color: "text-primary" },
    { label: t("pendingApprovals"),value: pendingList.length,                                  icon: Clock,         color: "text-amber-500" },
    { label: t("moderationQueue"), value: flags.length,                                        icon: AlertTriangle, color: "text-destructive" },
    { label: t("studentAdmin"),    value: students.filter(s => s.role === "student_admin").length, icon: Shield,   color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DashLogo size={32} />
            <div className="min-w-0">
              <span className="font-headline font-bold text-sm truncate">{t("adminPortalTitle")}</span>
              <span className="ml-2 text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                {t("mainAdmin")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {adminSchoolId && (
              <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setAnnounceOpen(true)}>
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("broadcast")}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8" onClick={signOutAdmin}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            <span className="font-semibold text-foreground">Admin Privacy Policy: </span>
            As the main admin, you can manage accounts, approve registrations, and broadcast announcements.
            All moderation actions are logged for audit purposes.
          </p>
        </div>

        {!adminSchoolId && initialized && (
          <div className="dash-card p-6 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm font-semibold">Not signed in</p>
            <p className="text-xs text-muted-foreground mt-1">Go to <Link href="/admin-portal/login" className="text-primary underline">/admin-portal/login</Link> to sign in.</p>
          </div>
        )}

        {adminSchoolId && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <div key={stat.label} className="dash-card p-4 animate-in fade-in duration-200" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest text-right leading-tight">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-headline font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <Tabs defaultValue="pending">
              <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start rounded-none overflow-x-auto no-scrollbar">
                {[
                  { v: "pending",  label: `${t("pendingTab")} (${pendingList.length})` },
                  { v: "students", label: t("studentsTab") },
                  { v: "flags",    label: `${t("flaggedTab")} (${flags.length})` },
                  { v: "school",   label: t("schoolSettings") },
                ].map(({ v, label }) => (
                  <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="pending" className="pt-4 space-y-3">
                {pendingLoading && (
                  <div className="dash-card p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading pending approvals...
                  </div>
                )}
                {pendingError && (
                  <div className="dash-card p-4 text-xs text-destructive border border-destructive/20 bg-destructive/10">
                    {pendingError}
                  </div>
                )}
                {!pendingLoading && pendingList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t("allReviewed")}</p>
                  </div>
                ) : pendingList.map((p, i) => (
                  <div key={p.id} className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary font-bold">{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="font-mono font-bold text-primary">{p.studentId}</span>
                        {" · "}{p.faculty} · Year {p.year}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{p.joined}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => reject(p.id)}>
                        <XCircle className="w-3 h-3" /> {t("rejectStudent")}
                      </Button>
                      <Button size="sm" className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:opacity-90" onClick={() => approve(p.id)}>
                        <CheckCircle2 className="w-3 h-3" /> {t("approveStudent")}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="students" className="pt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPeople")} className="pl-9 h-9 text-sm bg-muted/30" />
                </div>
                {filteredStudents.map((s, i) => (
                  <div key={s.id} className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary text-sm">{s.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{s.name}</p>
                        {s.role === "student_admin" && (
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold">{t("studentAdmin")}</Badge>
                        )}
                        <Badge className={`text-[9px] font-bold border ${s.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                          {s.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="font-mono font-bold text-[11px]">{s.studentId}</span>
                        {" · "}{s.faculty}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toggleRole(s.id)}>
                        {s.role === "student" ? t("makeAdmin") : t("removeAdmin")}
                      </Button>
                      <Button size="sm" variant="outline" className={`h-7 text-[10px] ${s.status === "active" ? "text-destructive border-destructive/30" : "text-primary border-primary/30"}`} onClick={() => toggleStatus(s.id)}>
                        {s.status === "active" ? t("suspend") : t("restore")}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="flags" className="pt-4 space-y-3">
                {flagsLoading ? (
                  <div className="dash-card p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading flagged content...
                  </div>
                ) : flags.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t("noFlaggedContent")}</p>
                  </div>
                ) : flags.map((f, i) => (
                  <div key={f.id} className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="w-9 h-9 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">@{f.user}</p>
                      <p className="text-xs text-muted-foreground">{f.reason} · {f.reports} report{f.reports !== 1 ? 's' : ''} · {f.time}</p>
                      {f.contentId && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono bg-muted px-2 py-0.5 rounded w-fit">ID: {f.contentId}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => resolveFlag(f.id, "REMOVE")}>
                        {t("removeContent")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => resolveFlag(f.id, "DISMISSED")}>
                        {t("dismiss")}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="school" className="pt-4">
                <div className="dash-card p-5 space-y-5 max-w-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{t("schoolSettings")}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("schoolName")}</Label>
                      <Input value={schoolNameInput} onChange={e => setSchoolNameInput(e.target.value)} className="h-9 text-sm bg-muted/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("allowedDomain")}</Label>
                      <Input value={allowedDomainInput} onChange={e => setAllowedDomainInput(e.target.value)} className="h-9 text-sm bg-muted/30" placeholder="e.g. university.edu" />
                      <p className="text-[10px] text-muted-foreground">{t("domainNote")}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("requireApproval")}</Label>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t("requireApproval")}</p>
                          <p className="text-[11px] text-muted-foreground">{t("requireApprovalDesc")}</p>
                        </div>
                        <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                      </div>
                    </div>
                    <Button className="dash-button-primary h-9 px-4 text-sm" onClick={saveSchoolSettings} disabled={schoolSaving || !adminSchoolId}>
                      {schoolSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveSettings")}
                    </Button>
                    <div className="pt-4 border-t border-border flex gap-3">
                      <Link href="/admin-portal/fields" className="flex-1">
                        <Button variant="outline" className="w-full h-9 text-xs">
                          <BookOpen className="w-3.5 h-3.5 mr-2" /> Fields
                        </Button>
                      </Link>
                      <Link href="/admin-portal/levels" className="flex-1">
                        <Button variant="outline" className="w-full h-9 text-xs">
                          <Layers className="w-3.5 h-3.5 mr-2" /> Levels
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> {t("broadcastAnnouncement")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("details")}</Label>
              <textarea
                value={announcement} onChange={e => setAnnouncement(e.target.value)}
                placeholder={t("broadcastMsg")}
                className="w-full min-h-[120px] resize-none text-sm bg-muted/30 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{announcement.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAnnounceOpen(false)}>{t("cancel")}</Button>
            <Button size="sm" className="dash-button-primary h-8 px-4 text-xs" onClick={sendAnnouncement} disabled={sending || !announcement.trim()}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              {t("broadcast")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}