"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "@/components/feed/post-card";
import {
  ArrowLeft, MapPin, Calendar, BookOpen, UserPlus, UserCheck,
  MessageCircle, Grid, ImageIcon, Send, Loader2
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

type ProfileUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  cover: string;
  bio: string;
  faculty: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  isVerified: boolean;
  flair?: string;
  isFollowing?: boolean;
};

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { t } = useI18n();
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [posts, setPosts] = useState<any[]>([]);

  const [following, setFollowing] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const handleFollow = async () => {
    if (!dashUser || !user) return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.id)}/follow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ followerId: dashUser.id }),
      });
      if (!res.ok) throw new Error("Request failed");
      setFollowing((v) => !v);
      toast({ title: following ? `Unfollowed ${user.name}` : `Following ${user.name} 👋` });
    } catch {
      toast({ title: "Follow failed", description: "Please try again." });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashUser || !user || !msgText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderId: dashUser.id,
          recipient: user.id,
          content: msgText.trim(),
          images: [],
        }),
      });
      if (!res.ok) throw new Error("Message send failed");
      setMsgOpen(false);
      setMsgText("");
      toast({ title: `Message sent to ${user.name} ✅`, description: "They'll be notified in their inbox." });
    } catch {
      toast({ title: "Message failed", description: "Please try again." });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoadingProfile(true);
      try {
        const qs = new URLSearchParams({ username });
        if (dashUser?.id) qs.set("currentUserId", dashUser.id);
        const res = await fetch(`/api/users/lookup?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || !json?.user) throw new Error(json?.error ?? "Failed to load profile");

        const u = json.user as any;
        const nextUser: ProfileUser = {
          id: u.id,
          name: u.name ?? username,
          username: u.username ?? username,
          avatar: u.profilePhoto ?? "",
          cover: u.coverPhoto ?? "",
          bio: u.bio ?? "",
          faculty: [u.fieldOfStudy, u.level].filter(Boolean).join(" · "),
          location: u.hometown ?? "",
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "",
          followers: u.followersCount ?? 0,
          following: u.followingCount ?? 0,
          isVerified: u.role === "ADMIN" || u.role === "SUPER_ADMIN",
          flair: "",
          isFollowing: !!u.isFollowing,
        };
        setUser(nextUser);
        setFollowing(!!u.isFollowing);

        const postsRes = await fetch(`/api/posts?authorId=${encodeURIComponent(u.id)}&limit=10`, { cache: "no-store" });
        const postsJson = await postsRes.json().catch(() => ({} as any));
        const nextPosts = Array.isArray(postsJson?.posts)
          ? postsJson.posts.map((p: any) => ({
              id: p.id,
              content: p.content ?? "",
              image: Array.isArray(p.images) ? p.images[0] : undefined,
              timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : "now",
              score: Array.isArray(p.likes) ? p.likes.length : 0,
              comments: Array.isArray(p.comments) ? p.comments.length : 0,
              author: {
                name: p.author?.name ?? "Student",
                username: p.author?.username ?? "student",
                avatar: p.author?.profilePhoto ?? "",
                isVerified: false,
              },
            }))
          : [];
        setPosts(nextPosts);
      } catch {
        setUser(null);
        setPosts([]);
      } finally {
        setLoadingProfile(false);
      }
    };
    void run();
  }, [username, dashUser?.id]);

  if (loadingProfile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-16 page-enter">
      <Link href="/main">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2 mb-3">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Button>
      </Link>

      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-40 w-full rounded-xl border border-border overflow-hidden bg-muted">
          <img src={user.cover} alt="Cover" className="w-full h-full object-cover opacity-70" loading="lazy" />
        </div>
        <div className="absolute -bottom-12 left-5 flex items-end gap-4">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <h1 className="text-xl font-headline font-bold flex items-center gap-2">
              {user.name}
              {user.isVerified && <span className="verified-badge">✓</span>}
              {user.flair && (
                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">{user.flair}</span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <div className="absolute -bottom-10 right-5 flex gap-2">
          {/* Working Message button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setMsgOpen(true)}
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t("message")}
          </Button>
          <Button
            size="sm"
            className={following
              ? "h-8 text-xs gap-1.5 border border-primary/40 text-primary bg-transparent hover:bg-primary/10"
              : "dash-button-primary h-8 text-xs gap-1.5"
            }
            onClick={handleFollow}
          >
            {following
              ? <><UserCheck className="w-3.5 h-3.5" /> {t("following2")}</>
              : <><UserPlus className="w-3.5 h-3.5" /> {t("sendRequest")}</>
            }
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About */}
        <div className="space-y-4">
          <div className="dash-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("about")}</h3>
            <p className="text-sm leading-relaxed">{user.bio}</p>
            <div className="space-y-2 pt-1">
              {[
                { icon: BookOpen, text: user.faculty },
                { icon: MapPin,   text: user.location },
                { icon: Calendar, text: `${t("joinedDate")} ${user.joined}` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 pt-3 border-t border-border">
              <div className="text-center">
                <p className="text-base font-bold">{user.followers.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("followers")}</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold">{user.following.toLocaleString()}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">{t("following2")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts + Media */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts">
            <TabsList className="bg-transparent h-auto p-0 gap-6 border-b w-full justify-start rounded-none">
              {[
                { v: "posts", icon: Grid,      label: t("posts") },
                { v: "media", icon: ImageIcon, label: t("media") },
              ].map(({ v, icon: Icon, label }) => (
                <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="posts" className="pt-5 space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No posts yet.
                </div>
              ) : (
                posts.map((p) => (
                  <PostCard key={p.id} {...p} />
                ))
              )}
            </TabsContent>
            <TabsContent value="media" className="pt-5">
              <div className="text-center py-10 text-muted-foreground text-sm">
                Media gallery is not available yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={msgOpen} onOpenChange={open => { setMsgOpen(open); if (!open) setMsgText(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Message {user.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/15 text-primary text-sm">{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <Textarea
              autoFocus
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder={`Write a message to ${user.name}…`}
              className="min-h-[100px] resize-none text-sm bg-muted/30"
              maxLength={500}
              required
            />
            <p className="text-[10px] text-muted-foreground text-right -mt-2">{msgText.length}/500</p>
            <DialogFooter>
              <Button variant="ghost" size="sm" type="button" onClick={() => setMsgOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" className="dash-button-primary h-8 px-4 text-xs" disabled={sending || !msgText.trim()}>
                {sending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  : <Send className="w-3.5 h-3.5 mr-1.5" />
                }
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
