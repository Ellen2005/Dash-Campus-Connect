"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectionsDialog } from "@/components/shared/connections-dialog";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload";
import {
  Sparkles, Edit3, MapPin, Calendar, BookOpen, UserPlus,
  Grid, Image as ImageIcon, Bookmark, Settings, Bell, Shield,
  Globe, Loader2, Camera, Check
} from "lucide-react";

interface ProfileData {
  name: string;
  username: string;
  bio: string | null;
  profilePhoto: string | null;
  coverPhoto: string | null;
  hometown: string | null;
  createdAt: string;
  fieldOfStudy: { name: string } | null;
  level: { name: string } | null;
  _count: { followers: number; following: number; posts: number };
}

interface PostData {
  id: string;
  content: string;
  images: string[];
  createdAt: string;
  author: { name: string; username: string; profilePhoto: string | null };
  _count?: { likes: number; comments: number };
}

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { toast } = useToast();
  const { signOut, dashUser, session } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const [editForm, setEditForm] = useState({ bio: "", hometown: "", interests: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadProfile = async () => {
    if (!dashUser?.id) return;
    setLoadingProfile(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`/api/users/${dashUser.id}`, { cache: "no-store" }),
        fetch(`/api/posts?authorId=${dashUser.id}&limit=20`, { cache: "no-store" }),
      ]);
      const profileJson = await profileRes.json().catch(() => ({}));
      const postsJson = await postsRes.json().catch(() => ({}));

      if (profileRes.ok && profileJson) {
        setProfile(profileJson);
        setEditForm({
          bio: profileJson.bio ?? "",
          hometown: profileJson.hometown ?? "",
          interests: (profileJson.interests ?? []).join(", "),
        });
      }
      if (postsRes.ok && Array.isArray(postsJson?.posts)) {
        setPosts(postsJson.posts);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => { void loadProfile(); }, [dashUser?.id]);

  const handlePhotoUpload = async (file: File, type: "profile" | "cover") => {
    if (!dashUser) return;
    setUploadingPhoto(true);
    try {
      const bucket = type === "profile" ? "avatars" : "covers";
      const upload = await uploadFile(file, bucket, dashUser.id);
      if (upload.error || !upload.url) throw new Error(upload.error ?? "Upload failed");

      const res = await fetch(`/api/users/${dashUser.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(type === "profile" ? { profilePhoto: upload.url } : { coverPhoto: upload.url }),
      });
      if (!res.ok) throw new Error("Failed to save photo");

      await loadProfile();
      toast({ title: `${type === "profile" ? "Profile" : "Cover"} photo updated!` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/ai/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicField: profile?.fieldOfStudy?.name ?? "",
          interests: editForm.interests,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditForm(f => ({ ...f, bio: data.bio }));
      }
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    if (!dashUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${dashUser.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bio: editForm.bio || undefined,
          hometown: editForm.hometown || undefined,
          interests: editForm.interests ? editForm.interests.split(",").map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      await loadProfile();
      setEditOpen(false);
      toast({ title: "Profile updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name ?? dashUser?.fullName ?? "";
  const displayUsername = profile?.username ?? dashUser?.username ?? "";
  const initials = displayName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="pb-16 page-enter">
      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-40 w-full rounded-xl border border-border overflow-hidden bg-muted group">
          {profile?.coverPhoto && (
            <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f, "cover"); }} />
          </label>
        </div>
        <div className="absolute -bottom-12 left-5 flex items-end gap-4">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.profilePhoto ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingPhoto ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f, "profile"); }} />
            </label>
          </div>
          <div className="mb-2">
            <h1 className="text-xl font-headline font-bold">{displayName}</h1>
            <p className="text-xs text-muted-foreground">@{displayUsername}</p>
          </div>
        </div>
        <div className="absolute -bottom-10 right-5 flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setEditOpen(true)}>
            <Edit3 className="w-3.5 h-3.5" /> {t("editProfile")}
          </Button>
          <Button size="sm" className="dash-button-primary h-8 text-xs gap-1.5" onClick={() => setConnectionsOpen(true)}>
            <UserPlus className="w-3.5 h-3.5" /> {t("connections")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: About */}
        <div className="space-y-4">
          <div className="dash-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("about")}</h3>
            {loadingProfile ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
            ) : (
              <>
                <p className="text-sm leading-relaxed">{profile?.bio || <span className="text-muted-foreground italic text-xs">No bio yet.</span>}</p>
                <div className="space-y-2 pt-1">
                  {profile?.fieldOfStudy && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{profile.fieldOfStudy.name}{profile.level ? ` · ${profile.level.name}` : ""}</span>
                    </div>
                  )}
                  {profile?.hometown && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{profile.hometown}</span>
                    </div>
                  )}
                  {profile?.createdAt && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{t("joinedDate")} {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-5 pt-3 border-t border-border">
                  <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                    <p className="text-base font-bold">{profile?._count?.followers ?? 0}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("followers")}</p>
                  </button>
                  <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                    <p className="text-base font-bold">{profile?._count?.following ?? 0}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("following2")}</p>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts">
            <TabsList className="bg-transparent h-auto p-0 gap-6 border-b w-full justify-start rounded-none">
              {([
                { v: "posts", icon: Grid, label: t("posts") },
                { v: "media", icon: ImageIcon, label: t("media") },
                { v: "saved", icon: Bookmark, label: t("saved") },
                { v: "settings", icon: Settings, label: t("settings") },
              ] as const).map(({ v, icon: Icon, label }) => (
                <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="posts" className="pt-5 space-y-4">
              {loadingProfile ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading posts…</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No posts yet.</p>
                </div>
              ) : posts.map(post => (
                <PostCard
                  key={post.id}
                  author={{ name: post.author.name, username: post.author.username, avatar: post.author.profilePhoto ?? "" }}
                  content={post.content}
                  image={post.images?.[0]}
                  timestamp={new Date(post.createdAt).toLocaleString()}
                  score={post._count?.likes ?? 0}
                  comments={post._count?.comments ?? 0}
                />
              ))}
            </TabsContent>

            <TabsContent value="media" className="pt-5">
              {loadingProfile ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {posts.filter(p => p.images?.length > 0).flatMap(p => p.images).slice(0, 12).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={img} className="w-full h-full object-cover" loading="lazy" alt="" />
                    </div>
                  ))}
                  {posts.filter(p => p.images?.length > 0).length === 0 && (
                    <div className="col-span-3 text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No media yet.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="pt-5">
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">{t("noSavedPosts")}</p>
                <p className="text-xs mt-1">{t("savedPostsHint")}</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="pt-5 space-y-4">
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />{t("appearance")}</h3>
                <div>
                  <p className="text-xs font-medium mb-1">{t("theme")}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">{t("chooseTheme")}</p>
                  <ThemeToggle />
                </div>
              </div>
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />{t("language")}</h3>
                <p className="text-[11px] text-muted-foreground">{t("chooseLanguage")}</p>
                <div className="flex gap-2">
                  {(["en", "fr"] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${lang === l ? "border-primary/60 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                      {lang === l && <Check className="w-3.5 h-3.5" />}
                      {l === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />{t("notifications")}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("pushNotifications")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("pushNotifDesc")}</p>
                  </div>
                  <Switch checked={notifs} onCheckedChange={setNotifs} />
                </div>
              </div>
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />{t("privacy")}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("publicProfile")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("publicProfileDesc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive"><Shield className="w-4 h-4" />{t("dangerZone")}</h3>
                <Button variant="outline" size="sm" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 h-9"
                  onClick={async () => { await signOut(); router.push("/"); }}>
                  Sign Out
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t("editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Hometown</Label>
              <Input value={editForm.hometown} onChange={e => setEditForm(f => ({ ...f, hometown: e.target.value }))} className="h-9 text-sm bg-muted/30" placeholder="e.g. Yaoundé" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("interests")}</Label>
              <Input value={editForm.interests} onChange={e => setEditForm(f => ({ ...f, interests: e.target.value }))} className="h-9 text-sm bg-muted/30" placeholder="AI, Coding, Hiking…" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("bio")}</Label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary px-2" onClick={handleGenerateBio} disabled={generatingBio}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {generatingBio ? "Drafting…" : t("draftWithAI")}
                </Button>
              </div>
              <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} className="min-h-[90px] resize-none text-sm bg-muted/30" maxLength={160} />
              <p className="text-[10px] text-muted-foreground text-right">{editForm.bio.length}/160</p>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>{t("cancel")}</Button>
              <Button size="sm" className="dash-button-primary h-8 px-4 text-xs" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                {t("saveChanges")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConnectionsDialog open={connectionsOpen} onClose={() => setConnectionsOpen(false)} />
    </div>
  );
}
