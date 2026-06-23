"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, MapPin, Clock, Package, CheckCircle2, Loader2, MessageCircle, Send, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Item = {
  id: string;
  type: string;
  title: string;
  desc: string;
  location: string;
  date: string;
  category: string;
  resolved: boolean;
  poster: string;
  avatar: string;
};

export default function LostFoundPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const { dashUser } = useAuth();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contactItem, setContactItem] = useState<Item | null>(null);
  const [contactMsg, setContactMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [form, setForm] = useState({ type: "lost", title: "", desc: "", location: "", category: "Other" });
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadItems() {
      setItemsLoading(true);
      try {
        const res = await fetch("/api/lost-found?limit=50", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json?.items)) {
          setItems(json.items.map((item: { id: string; type?: string; title: string; description?: string; location?: string; createdAt?: string; category?: string; resolved?: boolean; poster?: { name?: string; profilePhoto?: string } }) => ({
            id: item.id,
            type: item.type?.toLowerCase() || "lost",
            title: item.title,
            desc: item.description || "",
            location: item.location || "",
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "recent",
            category: item.category || "Other",
            resolved: item.resolved || false,
            poster: item.poster?.name || "Student",
            avatar: item.poster?.profilePhoto || "",
          })));
        }
      } catch {
        toast({ title: "Could not load items", variant: "destructive" });
      } finally {
        setItemsLoading(false);
      }
    }
    loadItems();
  }, [toast]);

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.desc.toLowerCase().includes(query.toLowerCase()) ||
    i.location.toLowerCase().includes(query.toLowerCase())
  );

  const lostItems  = filtered.filter(i => i.type === "lost"  && !i.resolved);
  const foundItems = filtered.filter(i => i.type === "found" && !i.resolved);
  const resolved   = filtered.filter(i => i.resolved);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    
    // Try to post to API first
    try {
      if (dashUser?.id) {
        const res = await fetch("/api/lost-found", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            title: form.title,
            description: form.desc,
            location: form.location,
            category: form.category,
            posterId: dashUser.id,
            schoolId: dashUser.schoolId,
          }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.item?.id) {
            setItems(prev => [{
              id: json.item.id,
              type: json.item.type?.toLowerCase() || form.type,
              title: json.item.title,
              desc: json.item.description || form.desc,
              location: json.item.location || form.location,
              date: "Just now",
              category: json.item.category || form.category,
              resolved: false,
              poster: json.item.poster?.name || "You",
              avatar: json.item.poster?.profilePhoto || imagePreview || `https://picsum.photos/seed/${Date.now()}/80/80`,
            }, ...prev]);
            setCreating(false);
            setCreateOpen(false);
            setForm({ type: "lost", title: "", desc: "", location: "", category: "Other" });
            setImagePreview(null);
            if (fileRef.current) fileRef.current.value = "";
            toast({
              title: form.type === "lost" ? t("lostReported") : t("foundPosted"),
              description: t("studentsNotified"),
            });
            return;
          }
        }
      }
    } catch {
      toast({ title: "Failed to post item", variant: "destructive" });
    }
    setCreating(false);
  };

  const markResolved = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));
    toast({ title: t("markedResolved"), description: t("itemReunited") });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMsg.trim()) return;
    setSendingMsg(true);
    setTimeout(() => {
      setSendingMsg(false);
      setContactItem(null);
      setContactMsg("");
      toast({ title: t("messageSent"), description: t("messageDesc") });
    }, 900);
  };

  const CATEGORIES = ["Electronics", "Clothing", "Documents", "Bags", "Keys", "Books", "Other"];

  const ItemList = ({ list, emptyKey }: { list: Item[]; emptyKey: string }) => (
    <div className="space-y-3">
      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyKey}</p>
        </div>
      ) : list.map((item, i) => (
        <div
          key={item.id}
          className={cn("dash-card p-4 space-y-3 animate-in fade-in duration-200", item.resolved && "opacity-60")}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
              <img src={item.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <Badge className={cn("text-[9px] font-bold border shrink-0",
                  item.type === "lost"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {item.type === "lost" ? t("lostItems") : t("foundItems")}
                </Badge>
                {item.resolved && (
                  <Badge className="text-[9px] bg-muted text-muted-foreground border-border">{t("resolvedItems")}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
                <Badge variant="secondary" className="text-[9px]">{item.category}</Badge>
              </div>
            </div>
          </div>
          {!item.resolved && (
            <div className="flex gap-2 pt-1 border-t border-border/50">
              <Button
                variant="outline" size="sm"
                className="flex-1 h-7 text-xs gap-1"
                onClick={() => { setContactItem(item); setContactMsg(""); }}
              >
                <MessageCircle className="w-3 h-3" /> {t("contact")}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs gap-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                onClick={() => markResolved(item.id)}
              >
                <CheckCircle2 className="w-3 h-3" /> {t("markResolved")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 pb-16 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-headline font-bold">{t("lostFoundTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("lostFoundSubtitle")}</p>
        </div>
        <Button size="sm" className="dash-button-primary h-8 px-3 text-xs gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> {t("reportItem")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder={`${t("search")} ${t("lostFoundTitle").toLowerCase()}…`}
          className="pl-9 h-9 text-sm bg-muted/30"
        />
      </div>

      <Tabs defaultValue="lost">
        <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
          {[
            { v: "lost",     label: `${t("lostItems")} (${lostItems.length})` },
            { v: "found",    label: `${t("foundItems")} (${foundItems.length})` },
            { v: "resolved", label: `${t("resolvedItems")} (${resolved.length})` },
          ].map(({ v, label }) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="lost"     className="pt-4"><ItemList list={lostItems}  emptyKey={t("noLostItems")} /></TabsContent>
        <TabsContent value="found"    className="pt-4"><ItemList list={foundItems} emptyKey={t("noFoundItems")} /></TabsContent>
        <TabsContent value="resolved" className="pt-4"><ItemList list={resolved}   emptyKey={t("noResolvedItems")} /></TabsContent>
      </Tabs>

      {/* Report Item Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{t("reportItem")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              {(["lost", "found"] as const).map(type => (
                <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))}
                  className={cn("p-3 rounded-xl border text-sm font-semibold transition-all",
                    form.type === type ? "border-primary/60 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-border/80"
                  )}>
                  {type === "lost" ? `🔍 ${t("iLostSomething")}` : `📦 ${t("iFoundSomething")}`}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("itemName")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t("itemNamePlaceholder")} className="h-9 text-sm bg-muted/30" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("itemDescription")}</Label>
              <Textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                placeholder={t("itemDescPlaceholder")} className="min-h-[80px] resize-none text-sm bg-muted/30" required />
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Photo (Optional)</Label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={imagePreview} alt="Item" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Upload a photo of the item</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setImagePreview(URL.createObjectURL(file));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("location")}</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder={t("locationPlaceholder")} className="h-9 text-sm bg-muted/30" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("itemCategory")}</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-9 text-sm bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" type="button" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" size="sm" className="dash-button-primary h-8 px-4 text-xs" disabled={creating || !form.title.trim()}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                {t("postItem")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={!!contactItem} onOpenChange={open => { if (!open) setContactItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              {t("contactOwner")}
            </DialogTitle>
          </DialogHeader>
          {contactItem && (
            <form onSubmit={handleSendMessage} className="space-y-4 pt-1">
              <div className="dash-card p-3 space-y-1">
                <p className="text-xs font-semibold">{contactItem.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{contactItem.desc}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{contactItem.location}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {t("sendMessage")} → {contactItem.poster}
                </Label>
                <Textarea
                  autoFocus
                  value={contactMsg}
                  onChange={e => setContactMsg(e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  className="min-h-[100px] resize-none text-sm bg-muted/30"
                  maxLength={500}
                  required
                />
                <p className="text-[10px] text-muted-foreground text-right">{contactMsg.length}/500</p>
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm" type="button" onClick={() => setContactItem(null)}>{t("cancel")}</Button>
                <Button type="submit" size="sm" className="dash-button-primary h-8 px-4 text-xs" disabled={sendingMsg || !contactMsg.trim()}>
                  {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                  {t("sendMessage")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}