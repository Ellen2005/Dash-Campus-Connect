"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Heart,
  MessageCircle,
  MapPin,
  Package,
  Book,
  Laptop,
  Home,
  Car,
  Shirt,
  Sparkles,
  Loader2,
  Store,
  ShoppingCart,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ensureDbUser } from "@/lib/client-user";
import { uploadFile } from "@/lib/upload";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface Listing {
  id: string;
  title: string;
  price?: number | null;
  isFree?: boolean;
  category: string;
  condition: string;
  description: string;
  images: string[];
  seller: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  averageRating?: number | null;
  location: string;
  timestamp: string;
  saved?: boolean;
}

interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  sellerId: string;
  createdAt: string;
  _count: { listings: number };
}

export default function MarketplacePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const { dashUser, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "TEXTBOOKS",
    condition: "GOOD",
    description: "",
    photos: [] as File[],
  });

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", description: "", logo: "" });

  const toggleSave = (id: string) => {
    setSavedItems(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
      toast({ title: savedItems.includes(id) ? "Removed from saved" : "Item saved!", description: savedItems.includes(id) ? "" : "Find it in your saved items." });
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "48");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);

      const res = await fetch(`/api/marketplace?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load listings.");

      const nextListings: Listing[] = Array.isArray(json?.listings)
        ? json.listings.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            isFree: listing.isFree,
            category: listing.category,
            condition: listing.condition,
            description: listing.description,
            images: Array.isArray(listing.images) ? listing.images : [],
            seller: {
              id: listing.seller?.id,
              name: listing.seller?.name ?? "Student",
              username: listing.seller?.username ?? "student",
              avatar: listing.seller?.profilePhoto ?? "",
            },
            averageRating: listing.averageRating,
            location: listing.preferredContact ?? "campus",
            timestamp: listing.createdAt ? new Date(listing.createdAt).toLocaleString() : "now",
          }))
        : [];

      setListings(nextListings);
    } catch (error: any) {
      toast({ title: t("marketplaceUnavailable"), description: error?.message ?? "Please try again." });
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    if (!dashUser?.id) return;
    setBrandsLoading(true);
    try {
      const res = await fetch(`/api/brands?sellerId=${dashUser.id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.brands)) setBrands(json.brands);
    } catch {
      // ignore
    } finally {
      setBrandsLoading(false);
    }
  };

  useEffect(() => {
    void loadListings();
    void loadBrands();
  }, [searchQuery, selectedCategory, dashUser?.id]);

  const handleCreateBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!dashUser?.id) return;
    setIsCreatingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: brandForm.name.trim(),
          description: brandForm.description.trim() || undefined,
          logo: brandForm.logo.trim() || undefined,
          sellerId: dashUser.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create brand.");
      setIsBrandDialogOpen(false);
      setBrandForm({ name: "", description: "", logo: "" });
      toast({ title: "Brand created!", description: "Your brand is now visible on the marketplace." });
      await loadBrands();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleMessage = async (listing: Listing) => {
    if (!dashUser) return;
    if (listing.seller.id === dashUser.id) {
      toast({ title: t("yourListing"), description: t("cannotMessageSelf") });
      return;
    }

    try {
      await ensureDbUser(dashUser, session);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          senderId: dashUser.id,
          recipient: listing.seller.id,
          content: `Hi ${listing.seller.name}, I'm interested in "${listing.title}". Is it still available?`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to message seller.");

      toast({ title: `Message sent to ${listing.seller.name}`, description: t("openingInbox") });
      router.push("/main/messages");
    } catch (error: any) {
      toast({ title: t("unableToMessageSeller"), description: error?.message ?? "Please try again." });
    }
  };

  const categories = [
    { value: "all", label: "All Items", icon: Package },
    { value: "TEXTBOOKS", label: "Textbooks", icon: Book },
    { value: "ELECTRONICS", label: "Electronics", icon: Laptop },
    { value: "HOUSING", label: "Housing", icon: Home },
    { value: "SERVICES", label: "Services", icon: Car },
    { value: "OTHER", label: "Other", icon: Shirt },
  ];
  const filteredListings = useMemo(() => listings, [listings]);

  const handleCreateListing = async (e: FormEvent) => {
    e.preventDefault();
    if (!dashUser) return;

    setIsCreating(true);
    try {
      await ensureDbUser(dashUser, session);
      const numericPrice = Number(form.price);
      const isFree = !form.price || Number.isNaN(numericPrice) || numericPrice <= 0;
      const uploadedImages: string[] = [];
      for (const file of form.photos) {
        const uploaded = await uploadFile(file, "marketplace", dashUser.id);
        if (uploaded.error || !uploaded.url) throw new Error(uploaded.error ?? "Failed to upload marketplace image.");
        uploadedImages.push(uploaded.url);
      }

      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          sellerId: dashUser.id,
          category: form.category,
          condition: form.condition,
          price: isFree ? undefined : numericPrice,
          isFree,
          images: uploadedImages,
          preferredContact: "chat",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to create listing.");

      setIsCreating(false);
      setIsCreateDialogOpen(false);
      setForm({ title: "", price: "", category: "TEXTBOOKS", condition: "GOOD", description: "", photos: [] });
      await loadListings();
      toast({
        title: "Listing Created",
        description: "Your item has been posted to the marketplace.",
      });
    } catch (error: any) {
      setIsCreating(false);
      toast({ title: t("listingFailed"), description: error?.message ?? "Please try again." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-headline font-bold">{t("campusMarketplace")}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push("/main/marketplace/checkout")}
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="dash-button-primary gap-2">
                  <Plus className="w-4 h-4" />
                  {t("sellItem")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-headline font-bold">{t("listYourItem")}</DialogTitle>
                  <DialogDescription>
                    {t("postItemSale")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateListing} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("itemTitle")}</Label>
                        <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. Calculus Textbook" className="bg-background/50 border-border" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("priceLabel")}</Label>
                          <div className="relative">
                            <Input type="number" value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} placeholder="0" className="bg-background/50 border-border pl-16" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">FCFA</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                          <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                            <SelectTrigger className="bg-background/50 border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEXTBOOKS">Textbooks</SelectItem>
                              <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                              <SelectItem value="HOUSING">Housing</SelectItem>
                              <SelectItem value="SERVICES">Services</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Condition</Label>
                        <Select value={form.condition} onValueChange={(value) => setForm((current) => ({ ...current, condition: value }))}>
                          <SelectTrigger className="bg-background/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="LIKE_NEW">Like New</SelectItem>
                            <SelectItem value="GOOD">Good</SelectItem>
                            <SelectItem value="FAIR">Fair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("descriptionLabel")}</Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                          placeholder="Describe your item in detail..."
                          className="min-h-[100px] bg-background/50 border-border resize-none"
                          maxLength={1000}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("photosLabel")}</Label>
                        <label className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer bg-muted/20">
                          <Package className="w-8 h-8 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{form.photos.length > 0 ? `${form.photos.length} selected` : t("uploadPhotos")}</span>
                          <span className="text-[9px] text-muted-foreground">Max 5 • JPG, PNG</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => setForm((current) => ({ ...current, photos: Array.from(e.target.files ?? []).slice(0, 5) }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="border-t border-border pt-6 mt-4">
                    <Button variant="ghost" type="button" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                      Cancel
                    </Button>
                    <Button type="submit" className="dash-button-primary px-8" disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {t("listItem")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchItems")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Brands Section */}
      {dashUser && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Your Brands
            </h2>
            <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" /> Create Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Create Brand</DialogTitle>
                  <DialogDescription>Register your brand for the campus marketplace.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBrand} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Brand Name</Label>
                    <Input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Campus Threads" className="h-9 text-sm bg-muted/30" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
                    <Textarea value={brandForm.description} onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell buyers about your brand" className="min-h-[70px] text-sm bg-muted/30 resize-none" maxLength={500} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Logo URL (optional)</Label>
                    <Input value={brandForm.logo} onChange={e => setBrandForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://example.com/logo.png" className="h-9 text-sm bg-muted/30" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsBrandDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="dash-button-primary" disabled={isCreatingBrand || !brandForm.name.trim()}>
                      {isCreatingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {brandsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading brands...
            </div>
          ) : brands.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {brands.map((brand) => (
                <Card key={brand.id} className="dash-card-hover p-3 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/main/marketplace?brand=${brand.id}`)}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{brand.name}</p>
                    <p className="text-[10px] text-muted-foreground">{brand._count.listings} listings</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-1">No brands yet. Create one to organize your listings.</p>
          )}
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loadingListings")}
        </div>
      ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing, i) => (
          <Card
            key={listing.id}
            className="obsidian-card group hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardHeader className="p-0">
              <div className="aspect-square rounded-t-xl overflow-hidden bg-muted">
                <img
                  src={listing.images[0] || "https://picsum.photos/seed/market-default/300/300"}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-sm line-clamp-2">{listing.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-headline font-bold text-primary">
                    {listing.isFree ? t("free") : `FCFA ${listing.price ?? 0}`}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {listing.condition}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 border border-border">
                  <AvatarImage src={listing.seller.avatar} />
                  <AvatarFallback className="text-[10px]">{listing.seller.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">{listing.seller.name}</span>
                {listing.averageRating && listing.averageRating >= 4 && (
                  <span className="verified-badge text-[8px]">✓</span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleMessage(listing)}>
                <MessageCircle className="w-3 h-3" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`px-3 transition-colors ${savedItems.includes(listing.id) ? 'text-destructive border-destructive/30 bg-destructive/5' : ''}`}
                onClick={() => toggleSave(listing.id)}
              >
                <Heart className={`w-4 h-4 ${savedItems.includes(listing.id) ? 'fill-destructive' : ''}`} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>}

      {!loading && filteredListings.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">{t("noItemsFound")}</h3>
          <p className="text-muted-foreground">{t("adjustSearchFilters")}</p>
        </div>
      )}
    </div>
  );
}