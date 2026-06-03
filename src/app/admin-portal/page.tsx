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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, Shield, Users, Megaphone, AlertTriangle,
  Building2, Search, Clock, Send, Loader2, LogOut, Info, Plus, Trash2,
  BookOpen, GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";

type PendingUser = { id: string; name: string; studentId: string; username?: string; faculty?: string; year?: string; joined?: string };
type SchoolUser = { id: string; name: string; studentId: string; faculty?: string; year?: string; role?: string; status?: string };
type Field = { id: string; name: string; description?: string | null; _count?: { students: number; communities: number } };
type Level = { id: string; name: string; description?: string | null; order: number; _count?: { students: number; communities: number } };

export default function AdminPortalPage() {
  const { toast } = useToast();
  const { t } = useI18n();

  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  const [adminSchoolName, setAdminSchoolName] = useState<string | null>(null);
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [allowedDomainInput, setAllowedDomainInput] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [schoolSaving, setSchoolSaving] = useState(false);

  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState("");

  const [students, setStudents] = useState<SchoolUser[]>([]);
  const [search, setSearch] = useState("");

  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({ name: "", description: "" });
  const [fieldSaving, setFieldSaving] = useState(false);

  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelForm, setLevelForm] = useState({ name: "", description: "", order: "" });
  const [levelSaving, setLevelSaving] = useState(false);

  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);

  // Load admin session
  useEffect(() => {
    fetch("/api/admin-portal/me", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => {
        const school = json?.school;
        if (school?.id) {
          setAdminSchoolId(school.id);
          setAdminSchoolName(school.name ?? school.id);
          setRequireApproval(!!school.requireApproval);
          setSchoolNameInput(school.name ?? "");
          setAllowedDomainInput(school.allowedDomain ?? "");
        }
      });
  }, []);

  // Load pending users
  useEffect(() => {
    if (!adminSchoolId) return;
    setPendingLoading(true);
    setPendingError("");
    fetch("/api/admin/pending-users", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => {
        if (Array.isArray(json?.users)) setPendingList(json.users);
        else if (json?.error) setPendingError(json.error);
      })
      .finally(() => setPendingLoading(false));
  }, [adminSchoolId]);

  // Load students
  useEffect(() => {
    if (!adminSchoolId) return;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => { if (Array.isArray(json?.users)) setStudents(json.users); });
  }, [adminSchoolId]);

  // Load fields
  const loadFields = () => {
    if (!adminSchoolId) return;
    setFieldsLoading(true);
    fetch("/api/admin-portal/fields", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => { if (Array.isArray(json?.fields)) setFields(json.fields); })
      .finally(() => setFieldsLoading(false));
  };
  useEffect(() => { loadFields(); }, [adminSchoolId]);

  // Load levels
  const loadLevels = () => {
    if (!adminSchoolId) return;
    setLevelsLoading(true);
    fetch("/api/admin-portal/levels", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}))
      .then(json => { if (Array.isArray(json?.levels)) setLevels(json.levels); })
      .finally(() => setLevelsLoading(false));
  };
  useEffect(() => { loadLevels(); }, [adminSchoolId]);

  const approve = async (id: string) => {
    const user = pendingList.find(p => p.id === id);
    if (!user) return;
    const res = await fetch("/api/admin/approve-user", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { toast({ title: "Approval failed", description: json?.error }); return; }
    setPendingList(l => l.filter(p => p.id !== id));
    setStudents(prev => [...prev, { id, name: user.name, studentId: user.studentId, role: "student", status: "active", faculty: user.faculty }]);
    toast({ title: `✅ ${user.name} approved`, description: "They can now access the platform." });
  };

  const reject = async (id: string) => {
    const user = pendingList.find(p => p.id === id);
    if (!user) return;
    const res = await fetch("/api/admin/reject-user", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { toast({ title: "Rejection failed", description: json?.error }); return; }
    setPendingList(l => l.filter(p => p.id !== id));
    toast({ title: `❌ ${user.name} rejected` });
  };

  const toggleRole = async (id: string) => {
    const s = students.find(s => s.id === id);
    if (!s) return;
    const nextRole = s.role === "student_admin" ? "student" : "student_admin";
    const res = await fetch("/api/admin/update-user", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id, role: nextRole }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast({ title: "Failed", description: j?.error }); return; }
    setStudents(prev => prev.map(x => x.id === id ? { ...x, role: nextRole } : x));
    toast({ title: nextRole === "student_admin" ? `⭐ ${s.name} promoted` : `↩ ${s.name} demoted` });
  };

  const toggleStatus = async (id: string) => {
    const s = students.find(s => s.id === id);
    if (!s) return;
    const nextStatus = s.status === "suspended" ? "active" : "suspended";
    const res = await fetch("/api/admin/update-user", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id, status: nextStatus }),
    });
    if (!res.ok) return;
    setStudents(prev => prev.map(x => x.id === id ? { ...x, status: nextStatus } : x));
  };

  const saveSchoolSettings = async () => {
    setSchoolSaving(true);
    const res = await fetch("/api/admin-portal/update-school", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: schoolNameInput.trim(), allowedDomain: allowedDomainInput.trim() || null, requireApproval }),
    }).catch(() => null);
    setSchoolSaving(false);
    if (!res?.ok) { toast({ title: "Save failed" }); return; }
    const json = await res.json().catch(() => ({}));
    setAdminSchoolName(json?.school?.name ?? adminSchoolName);
    toast({ title: "Saved", description: "School settings updated." });
  };

  const createField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldSaving(true);
    const res = await fetch("/api/admin-portal/fields", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: fieldForm.name.trim(), description: fieldForm.description.trim() || undefined }),
    }).catch(() => null);
    setFieldSaving(false);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) { toast({ title: "Failed", description: json?.error ?? "Could not create field." }); return; }
    setFieldDialogOpen(false);
    setFieldForm({ name: "", description: "" });
    toast({ title: `Field "${json.field?.name}" created`, description: "Auto-communities generated." });
    loadFields();
  };

  const deleteField = async (id: string, name: string) => {
    if (!confirm(`Delete field "${name}"? This will also delete related communities.`)) return;
    const res = await fetch(`/api/admin-portal/fields/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) { setFields(f => f.filter(x => x.id !== id)); toast({ title: "Field deleted" }); }
  };

  const createLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLevelSaving(true);
    const res = await fetch("/api/admin-portal/levels", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: levelForm.name.trim(), description: levelForm.description.trim() || undefined, order: parseInt(levelForm.order) || 0 }),
    }).catch(() => null);
    setLevelSaving(false);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) { toast({ title: "Failed", description: json?.error ?? "Could not create level." }); return; }
    setLevelDialogOpen(false);
    setLevelForm({ name: "", description: "", order: "" });
    toast({ title: `Level "${json.level?.name}" created`, description: "Auto-communities generated." });
    loadLevels();
  };

  const deleteLevel = async (id: string, name: string) => {
    if (!confirm(`Delete level "${name}"? This will also delete related communities.`)) return;
    const res = await fetch(`/api/admin-portal/levels/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) { setLevels(l => l.filter(x => x.id !== id)); toast({ title: "Level deleted" }); }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: announcement.trim() }),
    }).catch(() => null);
    setSending(false);
    const json = await res?.json().catch(() => ({}));
    if (!res?.ok) { toast({ title: "Broadcast failed", description: json?.error }); return; }
    setAnnounceOpen(false);
    setAnnouncement("");
    toast({ title: `📢 Announcement broadcast!`, description: `Sent to ${json?.delivered ?? 0} students.` });
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: t("manageStudents"), value: students.filter(s => s.status === "active").length, icon: Users, color: "text-primary" },
    { label: t("pendingApprovals"), value: pendingList.length, icon: Clock, color: "text-amber-500" },
    { label: "Fields", value: fields.length, icon: BookOpen, color: "text-primary" },
    { label: "Levels", value: levels.length, icon: GraduationCap, color: "text-primary" },
  ];

  const tabClass = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DashLogo size={32} />
            <div className="min-w-0">
              <span className="font-headline font-bold text-sm truncate">{adminSchoolName ?? t("adminPortalTitle")}</span>
              <span className="ml-2 text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                {t("mainAdmin")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setAnnounceOpen(true)}>
              <Megaphone className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t("broadcast")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8"
              onClick={() => fetch("/api/admin-portal/logout", { method: "POST" }).finally(() => { window.location.href = "/admin-portal/login"; })}>
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!adminSchoolId && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs">
              Not signed in. <a href="/admin-portal/login" className="text-primary font-bold hover:underline">Sign in</a> to manage your school.
            </p>
          </div>
        )}

        {adminSchoolId && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              <span className="font-semibold text-foreground">Admin Privacy Policy: </span>
              You can manage accounts, approve registrations, and broadcast announcements.
              You do <strong>not</strong> have access to private student chats or personal messages.
            </p>
          </div>
        )}

        {/* Stats */}
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
              { v: "pending", label: `${t("pendingTab")} (${pendingList.length})` },
              { v: "students", label: t("studentsTab") },
              { v: "fields", label: `Fields (${fields.length})` },
              { v: "levels", label: `Levels (${levels.length})` },
              { v: "school", label: t("schoolSettings") },
            ].map(({ v, label }) => (
              <TabsTrigger key={v} value={v} className={tabClass}>{label}</TabsTrigger>
            ))}
          </TabsList>

          {/* Pending */}
          <TabsContent value="pending" className="pt-4 space-y-3">
            {pendingLoading && (
              <div className="dash-card p-4 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading pending approvals…
              </div>
            )}
            {pendingError && (
              <div className="dash-card p-4 text-xs text-destructive border border-destructive/20 bg-destructive/10">{pendingError}</div>
            )}
            {!pendingLoading && pendingList.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("allReviewed")}</p>
              </div>
            )}
            {pendingList.map((p, i) => (
              <div key={p.id} className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary font-bold">{p.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="font-mono font-bold text-primary">{p.studentId}</span>
                    {p.faculty && ` · ${p.faculty}`}{p.year && ` · Year ${p.year}`}
                  </p>
                  {p.joined && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{p.joined}
                    </p>
                  )}
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

          {/* Students */}
          <TabsContent value="students" className="pt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPeople")} className="pl-9 h-9 text-sm bg-muted/30" />
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students yet.</p>
              </div>
            )}
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
                    {s.faculty && ` · ${s.faculty}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toggleRole(s.id)}>
                    {s.role === "student_admin" ? t("removeAdmin") : t("makeAdmin")}
                  </Button>
                  <Button size="sm" variant="outline" className={`h-7 text-[10px] ${s.status === "active" ? "text-destructive border-destructive/30" : "text-primary border-primary/30"}`} onClick={() => toggleStatus(s.id)}>
                    {s.status === "active" ? t("suspend") : t("restore")}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Fields */}
          <TabsContent value="fields" className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Creating a field auto-generates communities for all level combinations.</p>
              <Button size="sm" className="dash-button-primary h-8 text-xs gap-1.5" onClick={() => setFieldDialogOpen(true)} disabled={!adminSchoolId}>
                <Plus className="w-3.5 h-3.5" /> Add Field
              </Button>
            </div>
            {fieldsLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
            {!fieldsLoading && fields.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No fields yet. Add your first field of study.</p>
              </div>
            )}
            {fields.map((f, i) => (
              <div key={f.id} className="dash-card p-4 flex items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{f.name}</p>
                  {f.description && <p className="text-xs text-muted-foreground truncate">{f.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {f._count?.students ?? 0} students · {f._count?.communities ?? 0} communities
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteField(f.id, f.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </TabsContent>

          {/* Levels */}
          <TabsContent value="levels" className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Creating a level auto-generates communities for all field combinations.</p>
              <Button size="sm" className="dash-button-primary h-8 text-xs gap-1.5" onClick={() => setLevelDialogOpen(true)} disabled={!adminSchoolId}>
                <Plus className="w-3.5 h-3.5" /> Add Level
              </Button>
            </div>
            {levelsLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
            {!levelsLoading && levels.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No levels yet. Add your first level of study.</p>
              </div>
            )}
            {levels.sort((a, b) => a.order - b.order).map((l, i) => (
              <div key={l.id} className="dash-card p-4 flex items-center gap-3 animate-in fade-in duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {l.order || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{l.name}</p>
                  {l.description && <p className="text-xs text-muted-foreground truncate">{l.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {l._count?.students ?? 0} students · {l._count?.communities ?? 0} communities
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteLevel(l.id, l.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </TabsContent>

          {/* School Settings */}
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
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("requireApproval")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("requireApprovalDesc")}</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                <Button className="dash-button-primary h-9 px-4 text-sm" onClick={saveSchoolSettings} disabled={schoolSaving || !adminSchoolId}>
                  {schoolSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveSettings")}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base font-semibold">Add Field of Study</DialogTitle></DialogHeader>
          <form onSubmit={createField} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Name</Label>
              <Input value={fieldForm.name} onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
              <Textarea value={fieldForm.description} onChange={e => setFieldForm(f => ({ ...f, description: e.target.value }))} className="text-sm bg-muted/30 min-h-[60px] resize-none" maxLength={300} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFieldDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="dash-button-primary" disabled={fieldSaving || !fieldForm.name.trim()}>
                {fieldSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base font-semibold">Add Level</DialogTitle></DialogHeader>
          <form onSubmit={createLevel} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Name</Label>
              <Input value={levelForm.name} onChange={e => setLevelForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Level 1 or Year 1" className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Order (for sorting)</Label>
              <Input type="number" value={levelForm.order} onChange={e => setLevelForm(f => ({ ...f, order: e.target.value }))} placeholder="1" className="h-9 text-sm bg-muted/30" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
              <Textarea value={levelForm.description} onChange={e => setLevelForm(f => ({ ...f, description: e.target.value }))} className="text-sm bg-muted/30 min-h-[60px] resize-none" maxLength={300} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLevelDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="dash-button-primary" disabled={levelSaving || !levelForm.name.trim()}>
                {levelSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> {t("broadcastAnnouncement")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Textarea value={announcement} onChange={e => setAnnouncement(e.target.value)}
              placeholder={t("broadcastMsg")} className="min-h-[120px] resize-none text-sm bg-muted/30" maxLength={500} />
            <p className="text-[10px] text-muted-foreground text-right">{announcement.length}/500</p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">{t("broadcastNote")}</div>
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
