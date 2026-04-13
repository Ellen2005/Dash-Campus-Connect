"use client";

import { useState } from "react";
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
import {
  Sparkles, Edit3, MapPin, Calendar, BookOpen, UserPlus,
  Grid, Image as ImageIcon, Bookmark, Settings, Bell, Shield,
  Globe, Loader2, Camera, Check
} from "lucide-react";

// Static mock data — no async calls, no AI on load
const PROFILE = {
  name: "Alex Rivera",
  username: "arivera_comp",
  avatar: "https://picsum.photos/seed/me/200/200",
  cover: "https://picsum.photos/seed/dashcover/1200/400",
  bio: "Final year Computer Science student. Passionate about AI and distributed systems.",
  faculty: "Computer Science",
  location: "Modern Campus, Wing B",
  joined: "Sept 2021",
  followers: 245,
  following: 189,
};

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { toast } = useToast();
  const [bio, setBio] = useState(PROFILE.bio);
  const [faculty, setFaculty] = useState(PROFILE.faculty);
  const [interests, setInterests] = useState("AI, Coding, Hiking, Chess");
  const [editOpen, setEditOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const handleGenerateBio = () => {
    setGeneratingBio(true);
    setTimeout(() => {
      setBio(`${faculty} student with a passion for ${interests.split(",")[0].trim()}. Building the future one line of code at a time.`);
      setGeneratingBio(false);
    }, 1200);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setEditOpen(false); toast({ title: t("saveChanges"), description: "Profile updated." }); }, 900);
  };

  return (
    <div className="pb-16 page-enter">
      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-40 w-full rounded-xl border border-border overflow-hidden bg-muted">
          <img src={PROFILE.cover} alt="Cover" className="w-full h-full object-cover opacity-70" loading="lazy" />
        </div>
        <div className="absolute -bottom-12 left-5 flex items-end gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={PROFILE.avatar} />
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">AR</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mb-2">
            <h1 className="text-xl font-headline font-bold flex items-center gap-2">
              {PROFILE.name}
              <span className="verified-badge">✓</span>
            </h1>
            <p className="text-xs text-muted-foreground">@{PROFILE.username}</p>
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
                { icon: MapPin,   text: PROFILE.location },
                { icon: Calendar, text: `Joined ${PROFILE.joined}` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 pt-3 border-t border-border">
              <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-base font-bold">{PROFILE.followers}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("followers")}</p>
              </button>
              <button onClick={() => setConnectionsOpen(true)} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-base font-bold">{PROFILE.following}</p>
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
              <PostCard
                author={{ name: PROFILE.name, username: PROFILE.username, avatar: PROFILE.avatar }}
                content="Just finished the distributed systems project! If anyone needs help with the Raft algorithm implementation, hit me up. #ComputerScience #Raft"
                image="https://picsum.photos/seed/code/800/400"
                timestamp="15m ago" score={124} comments={18}
              />
            </TabsContent>

            <TabsContent value="media" className="pt-5">
              <div className="grid grid-cols-3 gap-1.5">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-90 transition-opacity">
                    <img src={`https://picsum.photos/seed/media${i}/300/300`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="saved" className="pt-5">
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No saved posts yet</p>
                <p className="text-xs mt-1">Posts you save will appear here</p>
              </div>
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
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Alerts for messages and campus news</p>
                  </div>
                  <Switch checked={notifs} onCheckedChange={setNotifs} />
                </div>
              </div>

              {/* Privacy */}
              <div className="dash-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />{t("privacy")}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Public Profile</p>
                    <p className="text-[11px] text-muted-foreground">Anyone on campus can see your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
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
