"use client";

import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  MapPin,
  DollarSign,
  Package,
  Book,
  Laptop,
  Home,
  Car,
  Shirt,
  Sparkles,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  description: string;
  images: string[];
  seller: {
    name: string;
    username: string;
    avatar: string;
    rating: number;
    verified: boolean;
  };
  location: string;
  timestamp: string;
  saved?: boolean;
}

export default function MarketplacePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  const toggleSave = (id: string) => {
    setSavedItems(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    toast({ title: savedItems.includes(id) ? "Removed from saved" : "Item saved!", description: savedItems.includes(id) ? "" : "Find it in your saved items." });
  };

  const handleMessage = (sellerName: string) => {
    toast({ title: `Message sent to ${sellerName}`, description: "They'll be notified and can reply in your inbox." });
  };

  const categories = [
    { value: "all", label: "All Items", icon: Package },
    { value: "textbooks", label: "Textbooks", icon: Book },
    { value: "electronics", label: "Electronics", icon: Laptop },
    { value: "housing", label: "Housing", icon: Home },
    { value: "transportation", label: "Transportation", icon: Car },
    { value: "clothing", label: "Clothing", icon: Shirt },
  ];

  const mockListings: Listing[] = [
    {
      id: "1",
      title: "Introduction to Algorithms - CLRS",
      price: 45,
      currency: "XAF",
      category: "textbooks",
      condition: "Good",
      description: "Third edition, some highlighting but in great condition. Perfect for CS students.",
      images: ["https://picsum.photos/seed/book1/300/300"],
      seller: {
        name: "Alex Rivera",
        username: "arivera_cs",
        avatar: "https://picsum.photos/seed/alex/40/40",
        rating: 4.8,
        verified: true
      },
      location: "Engineering Building",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      title: "MacBook Pro M2 13-inch",
      price: 1200,
      currency: "XAF",
      category: "electronics",
      condition: "Like New",
      description: "Selling my 2022 MacBook Pro. 16GB RAM, 512GB SSD. Comes with original box and charger.",
      images: ["https://picsum.photos/seed/macbook/300/300"],
      seller: {
        name: "Sarah Chen",
        username: "schen_bio",
        avatar: "https://picsum.photos/seed/sarah/40/40",
        rating: 5.0,
        verified: true
      },
      location: "Library",
      timestamp: "1 day ago"
    },
    {
      id: "3",
      title: "Room for Rent - Near Campus",
      price: 300,
      currency: "XAF",
      category: "housing",
      condition: "N/A",
      description: "Private room in a 4-bedroom apartment. 5 min walk to campus. Utilities included.",
      images: ["https://picsum.photos/seed/room/300/300"],
      seller: {
        name: "Mike Johnson",
        username: "mjohnson_bus",
        avatar: "https://picsum.photos/seed/mike/40/40",
        rating: 4.5,
        verified: false
      },
      location: "Oak Street",
      timestamp: "3 days ago"
    }
  ];

  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setIsCreateDialogOpen(false);
      toast({
        title: "Listing Created",
        description: "Your item has been posted to the marketplace.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-headline font-bold">Campus Marketplace</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="dash-button-primary gap-2">
                <Plus className="w-4 h-4" />
                Sell Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-xl font-headline font-bold">List Your Item</DialogTitle>
                <DialogDescription>
                  Post an item for sale or trade with fellow students.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateListing} className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Item Title</Label>
                      <Input placeholder="e.g. Calculus Textbook" className="bg-background/50 border-border" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Price</Label>
                        <div className="relative">
                          <Input type="number" placeholder="0" className="bg-background/50 border-border pl-8" required />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                        <Select defaultValue="textbooks">
                          <SelectTrigger className="bg-background/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="textbooks">Textbooks</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="housing">Housing</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Condition</Label>
                      <Select defaultValue="good">
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="like-new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description</Label>
                      <Textarea
                        placeholder="Describe your item in detail..."
                        className="min-h-[100px] bg-background/50 border-border resize-none"
                        maxLength={1000}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Photos</Label>
                      <div className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer bg-muted/20">
                        <Package className="w-8 h-8 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Upload Photos</span>
                        <span className="text-[9px] text-muted-foreground">Max 5 • JPG, PNG</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-border pt-6 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button type="submit" className="dash-button-primary px-8" disabled={isCreating}>
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    List Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
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

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing, i) => (
          <Card
            key={listing.id}
            className="obsidian-card group hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardHeader className="p-0">
              <div className="aspect-square rounded-t-xl overflow-hidden bg-muted">
                <img
                  src={listing.images[0]}
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
                    {listing.currency} {listing.price}
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
                {listing.seller.verified && (
                  <span className="verified-badge text-[8px]">✓</span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleMessage(listing.seller.name)}>
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
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No items found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}