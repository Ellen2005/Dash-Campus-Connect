"use client";

import { useState } from "react";
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
  Building2, Search, Clock, Send, Loader2, LogOut, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import { useI18n } from "@/lib/i18n";

const mockPending = [
  { id: "1", name: "Alex Rivera",  email: "arivera@demo.edu",  faculty: "Engineering", year: "3", joined: "2 hours ago" },
  { id: "2", name: "Sarah Chen",   email: "schen@demo.edu",    faculty: "Biology",     year: "2", joined: "5 hours ago" },
  { id: "3", name: "Mike Johnson", email: "mjohnson@demo.edu", faculty: "Business",    year: "4", joined: "1 day ago" },
  { id: "4", name: "Priya Sharma", email: "psharm@demo.edu",   faculty: "Medicine",    year: "1", joined: "1 day ago" },
];

const mockStudents = [
  { id: "s1", name: "Jordan Lee",    email: "jlee@demo.edu",    role: "student",       status: "active",    faculty: "Arts" },
  { id: "s2", name: "Kwame Asante",  email: "kasante@demo.edu", role: "student_admin", status: "active",    faculty: "Engineering" },
  { id: "s3", name: "Fatima Diallo", email: "fdiallo@demo.edu", role: "student",       status: "suspended", faculty: "Law" },
];

const mockFlags = [
  { id: "f1", user: "anon_user", reason: "Harassment",          reports: 5, time: "10m ago" },
  { id: "f2", user: "jdoe23",    reason: "Spam / Scam",         reports: 3, time: "1h ago" },
  { id: "f3", user: "user_xyz",  reason: "Inappropriate Media", reports: 8, time: "2h ago" },
];

export default function AdminPortalPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [pendingList, setPendingList] = useState(mockPending);
  const [students, setStudents] = useState(mockStudents);
  const [flags, setFlags] = useState(mockFlags);
  const [search, setSearch] = useState("");
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const approve = (id: string) => {
    const s = pendingList.find(p => p.id === id)!;
    setPendingList(l => l.filter(p => p.id !== id));
    setStudents(prev => [...prev, { id: `s${Date.now()}`, name: s.name, email: s.email, role: "student", status: "active", faculty: s.faculty }]);
    toast({ title: `✅ ${s.name} ${t("approveStudent").toLowerCase()}`, description: "They can now access the campus platform." });
  };

  const reject = (id: string) => {
    const s = pendingList.find(p => p.id === id)!;
    setPendingList(l => l.filter(p => p.id !== id));
    toast({ title: `❌ ${s.name} ${t("rejectStudent").toLowerCase()}`, description: "Registration denied." });
  };

  const toggleRole = (id: string) => {
    const s = students.find(s => s.id === id)!;
    setStudents(prev => prev.map(x => x.id === id ? { ...x, role: x.role === "student" ? "student_admin" : "student" } : x));
    toast({ title: s.role === "student" ? `⭐ ${t("makeAdmin")}` : `↩ ${t("removeAdmin")}`, description: s.name });
  };

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "active" ? "suspended" : "active" } : s));
  };

  const resolveFlag = (id: string) => setFlags(f => f.filter(x => x.id !== id));

  const sendAnnouncement = () => {
    if (!announcement.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setAnnounceOpen(false);
      setAnnouncement("");
      toast({ title: `📢 ${t("announcementBroadcast")}`, description: t("allStudentsNotified") });
    }, 1200);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: t("manageStudents"),  value: students.filter(s => s.status === "active").length, icon: Users,         color: "text-primary" },
    { label: t("pendingApprovals"),value: pendingList.length,                                  icon: Clock,         color: "text-amber-500" },
    { label: t("moderationQueue"), value: flags.length,                                        icon: AlertTriangle, color: "text-destructive" },
    { label: t("studentAdmin"),    value: students.filter(s => s.role === "student_admin").length, icon: Shield,   color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
            <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setAnnounceOpen(true)}>
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("broadcast")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Privacy notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            <span className="font-semibold text-foreground">Admin Privacy Policy: </span>
            As the main admin, you can manage accounts, approve registrations, and broadcast announcements.
            You do <strong>not</strong> have access to private student chats, personal messages, or individual post content.
            All moderation actions are logged for audit purposes.
          </p>
        </div>

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

          {/* Pending Approvals */}
          <TabsContent value="pending" className="pt-4 space-y-3">
            {pendingList.length === 0 ? (
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
                  <p className="text-xs text-muted-foreground truncate">{p.email} · {p.faculty} · Year {p.year}</p>
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

          {/* Students */}
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
                  <p className="text-xs text-muted-foreground truncate">{s.email} · {s.faculty}</p>
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

          {/* Flagged Content */}
          <TabsContent value="flags" className="pt-4 space-y-3">
            {flags.length === 0 ? (
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
                  <p className="text-xs text-muted-foreground">{f.reason} · {f.reports} reports · {f.time}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/10">
                    {t("removeContent")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => resolveFlag(f.id)}>
                    {t("dismiss")}
                  </Button>
                </div>
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
                  <Input defaultValue="Demo University" className="h-9 text-sm bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("allowedDomain")}</Label>
                  <Input defaultValue="demo.edu" className="h-9 text-sm bg-muted/30" placeholder="e.g. university.edu or uni.ac.cm" />
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
                <Button className="dash-button-primary h-9 px-4 text-sm">{t("saveSettings")}</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Broadcast Dialog */}
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
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">
              {t("broadcastNote")}
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
