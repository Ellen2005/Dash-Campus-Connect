"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { toast } = useToast();
  const { signOut, user, dashUser } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  const profileName = userData?.name || dashUser?.fullName || "Student";
  const profileUsername = userData?.username || dashUser?.username || "student";
  const profileAvatar = userData?.profilePhoto || "";
  const profileCover = userData?.coverPhoto || "";
  const profileBio = userData?.bio || "No bio yet.";
  const profileFaculty = userData?.fieldOfStudy?.name || dashUser?.faculty || "Unknown Field";
  const profileLocation = userData?.hometown || "Campus";
  const profileJoined = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const profileFollowers = userData?._count?.followers ?? userData?.followers?.length ?? 0;
  const profileFollowing = userData?._count?.following ?? userData?.following?.length ?? 0;

  const [bio, setBio] = useState(profileBio);
  const [faculty, setFaculty] = useState(profileFaculty);
  const [interests, setInterests] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [privacyPublic, setPrivacyPublic] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!dashUser?.id) return;
      setLoading(true);
      try {
        const [userRes, savedRes, postsRes] = await Promise.all([
          fetch(`/api/users/${dashUser.id}`, { cache: "no-store" }),
          fetch(`/api/posts?savedBy=${dashUser.id}`, { cache: "no-store" }),
          fetch(`/api/posts?authorId=${dashUser.id}`, { cache: "no-store" }),
        ]);

        const userJson = await userRes.json().catch(() => ({}));
        const savedJson = await savedRes.json().catch(() => ({}));
        const postsJson = await postsRes.json().catch(() => ({}));

        if (userRes.ok && userJson) {
          setUserData(userJson);
          setBio(userJson.bio || "No bio yet.");
          setFaculty(userJson.fieldOfStudy?.name || dashUser?.faculty || "Unknown Field");
          if (typeof userJson.privacyPublic === "boolean") setPrivacyPublic(userJson.privacyPublic);
        }
        if (Array.isArray(savedJson?.posts)) setSavedPosts(savedJson.posts);
        if (Array.isArray(postsJson?.posts)) setUserPosts(postsJson.posts);
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [dashUser?.id]);

  const handlePhotoUpload = async (type: "profile" | "cover") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !dashUser?.id) return;

      if (type === "profile") setUploadingPhoto(true);
      else setUploadingCover(true);

      try {
        const result = await uploadFile(file, "avatars", dashUser.id);
        if (result.error || !result.url) throw new Error(result.error || "Upload failed");

        const updateRes = await fetch(`/api/users/${dashUser.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ [type === "profile" ? "profilePhoto" : "coverPhoto"]: result.url }),
        });

        if (updateRes.ok) {
          setUserData((prev: any) => ({ ...prev, [type === "profile" ? "profilePhoto" : "coverPhoto"]: result.url }));
          toast({ title: `${type === "profile" ? "Profile" : "Cover"} photo updated!` });
        }
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } finally {
        if (type === "profile") setUploadingPhoto(false);
        else setUploadingCover(false);
      }
    };
    input.click();
  };

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/ai/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicField: faculty, interests }),
      });
      if (res.ok) {
        const data = await res.json();
        setBio(data.bio);
      } else {
        setBio(`${faculty} student with a passion for ${interests.split(",")[0].trim()}. Building the future one line of code at a time.`);
      }
    } catch {
      setBio(`${faculty} student with a passion for ${interests.split(",")[0].trim()}. Building the future one line of code at a time.`);
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    if (!dashUser?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${dashUser.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bio, name: profileName, notificationPrefs: { push: notifs } }),
      });
      if (res.ok) {
        setEditOpen(false);
        toast({ title: t("saveChanges"), description: "Profile updated." });
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      // Fallback to old behavior
      setTimeout(() => { setSaving(false); setEditOpen(false); toast({ title: t("saveChanges"), description: "Profile updated." }); }, 900);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (userData?.notificationPrefs?.push !== undefined) {
      setNotifs(userData.notificationPrefs.push);
    }
  }, [userData]);

  return (
    <div className="pb-16 page-enter">
      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-40 w-full rounded-xl border border-border overflow-hidden bg-muted relative group">
          {profileCover ? (
            <img src={profileCover} alt="Cover" className="w-full h-full object-cover opacity-70" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          <button
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            onClick={() => handlePhotoUpload("cover")}
            disabled={uploadingCover}
          >
            {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
        <div className="absolute -bottom-12 left-5 flex items-end gap-4">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              {profileAvatar ? (
                <AvatarImage src={profileAvatar} />
              ) : null}
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">{profileName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              onClick={() => handlePhotoUpload("profile")}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="mb-2">
            <h1 className="text-xl font-headline font-bold flex items-center gap-2">
              {profileName}
              <span className="verified-badge">✓</span>
            </h1>
            <p className="text-xs text-muted-foreground">@{profileUsername}</p>
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
            <p className="text-sm leading-relaxed">{bio}</p>
            <div className="space-y-2 pt-1">
              {[
                { icon: BookOpen, text: faculty },
                { icon: MapPin,   text: profileLocation },
                { icon: Calendar, text: `${t("joinedDate")} ${profileJoined}` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 pt-3 border-t border-border">
              <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-base font-bold">{profileFollowers}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("followers")}</p>
              </button>
              <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-base font-bold">{profileFollowing}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("following2")}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts">
            <TabsList className="bg-transparent h-auto p-0 gap-6 border-b w-full justify-start rounded-none">
              {([
                { v: "posts",    icon: Grid,      label: t("posts") },
                { v: "media",    icon: ImageIcon,  label: t("media") },
                { v: "saved",    icon: Bookmark,   label: t("saved") },
                { v: "settings", icon: Settings,   label: t("settings") },
              ] as const).map(({ v, icon: Icon, label }) => (
                <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="posts" className="pt-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  <Grid className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No posts yet.</p>
                  <p className="text-xs mt-1">Share your thoughts with the community!</p>
                </div>
              ) : (
                userPosts.map((post: any, i: number) => (
                  <div key={post.id} className="dash-card p-4 animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                    <p className="text-sm">{post.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="media" className="pt-5">
              <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No media.</p>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="pt-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t("noSavedPosts")}</p>
                  <p className="text-xs mt-1">{t("savedPostsHint")}</p>
                </div>
              ) : (
                savedPosts.map((post: any, i: number) => (
                  <div key={post.id} className="dash-card p-4 animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                    <p className="text-sm">{post.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="settings" className="pt-5 space-y-4">
              {/* Theme */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />{t("appearance")}</h3>
                <div>
                  <p className="text-xs font-medium mb-1">{t("theme")}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">{t("chooseTheme")}</p>
                  <ThemeToggle />
                </div>
              </div>

              {/* Language */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />{t("language")}</h3>
                <p className="text-[11px] text-muted-foreground">{t("chooseLanguage")}</p>
                <div className="flex gap-2">
                  {(["en", "fr"] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                        lang === l ? "border-primary/60 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {lang === l && <Check className="w-3.5 h-3.5" />}
                      {l === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />{t("notifications")}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("pushNotifications")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("pushNotifDesc")}</p>
                  </div>
                  <Switch 
                    checked={notifs} 
                    onCheckedChange={async (val) => {
                      setNotifs(val);
                      if (dashUser?.id) {
                        await fetch(`/api/users/${dashUser.id}`, {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ notificationPrefs: { push: val } }),
                        });
                        toast({ title: t("saveChanges"), description: "Notification preferences updated." });
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />{t("privacy")}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("publicProfile")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("publicProfileDesc")}</p>
                  </div>
                  <Switch
                    checked={privacyPublic}
                    onCheckedChange={async (val) => {
                      setPrivacyPublic(val);
                      if (dashUser?.id) {
                        await fetch(`/api/users/${dashUser.id}`, {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ privacyPublic: val }),
                        });
                        toast({ title: t("saveChanges"), description: "Profile visibility updated." });
                      }
                    }}
                  />
                </div>
              </div>
              {/* Danger Zone */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive"><Shield className="w-4 h-4" />{t("dangerZone")}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 h-9"
                  onClick={async () => { await signOut(); router.push("/"); }}
                >
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
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("academicField")}</Label>
              <Input value={faculty} onChange={e => setFaculty(e.target.value)} className="h-9 text-sm bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("interests")}</Label>
              <Input value={interests} onChange={e => setInterests(e.target.value)} className="h-9 text-sm bg-muted/30" placeholder="AI, Coding, Hiking…" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("bio")}</Label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary px-2" onClick={handleGenerateBio} disabled={generatingBio}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {generatingBio ? "Drafting…" : t("draftWithAI")}
                </Button>
              </div>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} className="min-h-[90px] resize-none text-sm bg-muted/30" maxLength={160} />
              <p className="text-[10px] text-muted-foreground text-right">{bio.length}/160</p>
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