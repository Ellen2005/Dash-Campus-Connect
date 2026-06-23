"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ShoppingBag, Package, CheckCircle2, XCircle, Clock, Loader2, Eye, ArrowLeft, CreditCard, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  listingId: string;
  quantity: number;
  pricePerUnit: number;
  listing: {
    id: string;
    title: string;
    images: string[];
    sellerId: string;
    seller: { id: string; name: string; username: string };
  };
};

type Order = {
  id: string;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  buyerId: string;
  buyer: { id: string; name: string; username: string; profilePhoto: string };
  items: OrderItem[];
  createdAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function OrdersPage() {
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const router = useRouter();
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("buying");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    if (!dashUser?.id) return;
    setLoading(true);
    try {
      const [buyerRes, sellerRes] = await Promise.all([
        fetch(`/api/orders?buyerId=${dashUser.id}`, { cache: "no-store" }),
        fetch(`/api/orders?sellerId=${dashUser.id}`, { cache: "no-store" }),
      ]);
      const buyerJson = await buyerRes.json().catch(() => ({}));
      const sellerJson = await sellerRes.json().catch(() => ({}));
      if (Array.isArray(buyerJson?.orders)) setBuyerOrders(buyerJson.orders);
      if (Array.isArray(sellerJson?.orders)) setSellerOrders(sellerJson.orders);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [dashUser?.id]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Order ${status.toLowerCase()}`, description: "Order status updated." });
        loadOrders();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
    }
  };

  const pendingOrders = sellerOrders.filter(o => o.status === "PENDING");
  const confirmedOrders = sellerOrders.filter(o => o.status === "CONFIRMED");

  return (
    <div className="space-y-6 pb-20 page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/main/marketplace")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-headline font-bold">My Orders</h1>
          <p className="text-xs text-muted-foreground">Track your purchases and sales</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 gap-4 border-b w-full justify-start rounded-none">
            <TabsTrigger value="buying" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
              Buying ({buyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="selling" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
              Selling ({sellerOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buying" className="pt-4 space-y-3">
            {buyerOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No purchases yet</p>
                <p className="text-xs mt-1">Items you buy will appear here.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => router.push("/main/marketplace")}>
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              buyerOrders.map((order) => (
                <Card key={order.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                      {order.items[0]?.listing?.images?.[0] ? (
                        <img src={order.items[0].listing.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted"><Package className="w-5 h-5 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{order.items.map(i => i.listing?.title).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} item(s) · FCFA {order.totalPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`text-[10px] border ${statusColors[order.status] || statusColors.PENDING}`}>{order.status}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="selling" className="pt-4 space-y-4">
            {sellerOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No sales yet</p>
                <p className="text-xs mt-1">When someone buys your items, orders will appear here.</p>
              </div>
            ) : (
              <>
                {pendingOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                      <Clock className="w-4 h-4" /> Pending Approval ({pendingOrders.length})
                    </h3>
                    {pendingOrders.map((order) => (
                      <Card key={order.id} className="border-amber-500/20 bg-amber-500/5">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarImage src={order.buyer?.profilePhoto} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs">
                                  {(order.buyer?.name || "B")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{order.buyer?.name || "Buyer"}</p>
                                <p className="text-[10px] text-muted-foreground">@{order.buyer?.username}</p>
                              </div>
                            </div>
                            <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">PENDING</Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                                  {item.listing?.images?.[0] && <img src={item.listing.images[0]} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <span className="flex-1 truncate">{item.listing?.title || "Item"}</span>
                                <span className="font-medium">x{item.quantity}</span>
                                <span className="text-muted-foreground">FCFA {item.pricePerUnit.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-xs">
                              {order.paymentMethod === "ORANGE_MONEY" ? (
                                <Smartphone className="w-3.5 h-3.5 text-[#FF6600]" />
                              ) : (
                                <Smartphone className="w-3.5 h-3.5 text-[#F7C800]" />
                              )}
                              <span>{order.paymentMethod === "ORANGE_MONEY" ? "Orange Money" : "MTN Mobile Money"}</span>
                              <span className="font-bold text-primary">FCFA {order.totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/30" onClick={() => updateOrderStatus(order.id, "CANCELLED")}>
                                <XCircle className="w-3 h-3 mr-1" /> Reject
                              </Button>
                              <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground" onClick={() => updateOrderStatus(order.id, "CONFIRMED")}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {confirmedOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-400">
                      <Package className="w-4 h-4" /> Active Orders ({confirmedOrders.length})
                    </h3>
                    {confirmedOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarImage src={order.buyer?.profilePhoto} />
                                <AvatarFallback className="bg-primary/15 text-primary text-xs">
                                  {(order.buyer?.name || "B")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{order.buyer?.name || "Buyer"}</p>
                                <p className="text-[10px] text-muted-foreground">{order.items.length} item(s) · FCFA {order.totalPrice.toLocaleString()}</p>
                              </div>
                            </div>
                            <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="SHIPPED">Shipped</SelectItem>
                                <SelectItem value="DELIVERED">Delivered</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {sellerOrders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">History</h3>
                    {sellerOrders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED").map((order) => (
                      <Card key={order.id} className="opacity-70">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{order.items.map(i => i.listing?.title).join(", ")}</p>
                            <p className="text-[10px] text-muted-foreground">FCFA {order.totalPrice.toLocaleString()}</p>
                          </div>
                          <Badge className={`text-[10px] border ${statusColors[order.status]}`}>{order.status}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Order Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedOrder.buyer?.profilePhoto} />
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {(selectedOrder.buyer?.name || "B")[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{selectedOrder.buyer?.name}</p>
                  <p className="text-[10px] text-muted-foreground">@{selectedOrder.buyer?.username}</p>
                </div>
                <Badge className={`ml-auto text-[10px] border ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Items</Label>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded bg-muted/20">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                      {item.listing?.images?.[0] && <img src={item.listing.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.listing?.title || "Item"}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} · FCFA {item.pricePerUnit.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">FCFA {selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{selectedOrder.paymentMethod === "ORANGE_MONEY" ? "Orange Money" : "MTN Mobile Money"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-xs">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}