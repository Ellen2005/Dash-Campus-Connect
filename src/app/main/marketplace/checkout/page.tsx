"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ensureDbUser } from "@/lib/client-user";
import { Loader2, Receipt, ShieldCheck, Wallet, X } from "lucide-react";

type CartListing = {
  id: string;
  title: string;
  price: number | null;
  isFree: boolean;
  images: string[];
  status: string;
  seller: { id: string; name: string };
};

type CartItem = {
  id: string;
  quantity: number;
  listing: CartListing;
};

type CartResponse = {
  cart?: { userId: string; items: (CartItem & { listing: CartListing })[] };
};

type PaymentMethod = "MTN_MOBILE_MONEY" | "ORANGE_MONEY";

function formatFCFA(n: number) {
  // No locale assumption: keep FCFA style consistent.
  return `FCFA ${Math.round(n).toLocaleString()}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { dashUser, session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [updating, setUpdating] = useState(false);

  const [step, setStep] = useState<"review" | "payment" | "success">("review");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN_MOBILE_MONEY");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [pin, setPin] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const unit = item.listing.isFree ? 0 : item.listing.price ?? 0;
      return sum + unit * item.quantity;
    }, 0);
  }, [cartItems]);

  const fees = 0; // simulation only
  const total = subtotal + fees;

  const canCheckout = cartItems.length > 0;

  const loadCart = async () => {
    if (!dashUser?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(dashUser.id)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? "Failed to load cart.");

      const items = Array.isArray(json?.cart?.items) ? json.cart.items : json?.cart?.items ?? [];
      setCartItems(items);

      if (Array.isArray(items) && items.length > 0) setStep("review");
    } catch (e: any) {
      toast({ title: "Checkout", description: e?.message ?? "Unable to load cart.", variant: "destructive" });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, [dashUser?.id]);

  const placeOrder = async () => {
    if (!dashUser?.id) return;
    if (!canCheckout) return;

    setPlacingOrder(true);
    try {
      await ensureDbUser(dashUser, session);

      // Simulated "payment" phase
      const reference = `DASH-${Date.now()}`;
      setReferenceCode(reference);

      // In your existing API, paymentMethod is MOBILE_MONEY | ORANGE_MONEY
      const apiPaymentMethod = paymentMethod === "ORANGE_MONEY" ? "ORANGE_MONEY" : "MOBILE_MONEY";

      // Map cart to order items
      const items = cartItems.map((ci) => {
        const unit = ci.listing.isFree ? 0 : ci.listing.price ?? 0;
        return {
          listingId: ci.listing.id,
          quantity: ci.quantity,
          pricePerUnit: unit,
        };
      });

      // Fake success delay
      await new Promise((r) => setTimeout(r, 900));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buyerId: dashUser.id,
          paymentMethod: apiPaymentMethod,
          items,
        }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? "Failed to place order.");

      setStep("success");
      setPaymentOpen(false);
      toast({ title: "Order confirmed", description: "Payment simulated successfully." });
      setCartItems([]);
    } catch (e: any) {
      toast({ title: "Payment failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setPlacingOrder(false);
    }
  };

  const CartRow = ({ item }: { item: CartItem }) => {
    const listing = item.listing;
    const unit = listing.isFree ? 0 : listing.price ?? 0;
    const lineTotal = unit * item.quantity;

    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.images?.[0] || "https://picsum.photos/seed/market-default/160/160"}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{listing.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Seller: {listing.seller?.name ?? "Student"}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              Qty {item.quantity}
            </Badge>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {listing.isFree ? "Free" : formatFCFA(unit)} / unit
            </p>
            <p className="text-sm font-bold">{listing.isFree ? "Free" : formatFCFA(lineTotal)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground">Simulated Mobile Money (MTN/Orange Money) for now.</p>
        </div>
        <Button variant="outline" className="h-10" onClick={() => router.push("/main/marketplace")}>
          Back to marketplace
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-14 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cart...
        </div>
      ) : step === "success" ? (
        <div className="dash-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Payment successful</h2>
          </div>
          <p className="text-sm text-muted-foreground">Reference: <span className="font-semibold">{referenceCode || "—"}</span></p>
          <div className="flex gap-3 pt-2">
            <Button className="dash-button-primary" onClick={() => router.push("/main/marketplace")}>
              Continue browsing
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Your cart is empty.</p>
                <p className="text-xs mt-1">Add items from Marketplace to checkout.</p>
              </div>
            ) : (
              <>
                {cartItems.map((it) => (
                  <CartRow key={it.id} item={it} />
                ))}

                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-bold">Delivery / Location</h3>
                    <p className="text-xs text-muted-foreground">Coming soon (UI only).</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Delivery note</Label>
                    <Input placeholder="e.g. Meet at reception after 4pm" />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <h3 className="font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" /> Order summary
                </h3>
                <p className="text-xs text-muted-foreground">Total includes simulated fees: {formatFCFA(fees)}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{cartItems.length === 0 ? formatFCFA(0) : formatFCFA(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fees</span>
                  <span className="font-semibold">{formatFCFA(fees)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{cartItems.length === 0 ? formatFCFA(0) : formatFCFA(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-2">
                <Button
                  className="dash-button-primary"
                  onClick={() => setPaymentOpen(true)}
                  disabled={!canCheckout}
                >
                  Pay now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/main/marketplace")}
                >
                  Add more items
                </Button>
              </CardFooter>
            </Card>

            <div className="dash-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mobile className="w-4 h-4 text-primary" /> Payment methods
              </div>
              <p className="text-xs text-muted-foreground">MTN Mobile Money + Orange Money are simulated until payment APIs are connected.</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">MTN</Badge>
                <Badge variant="secondary" className="text-[10px]">Orange</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Simulated Mobile Money</DialogTitle>
            <DialogDescription>
              Choose MTN or Orange Money. You can enter any phone number for simulation.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <TabsList className="w-full">
              <TabsTrigger value="MTN_MOBILE_MONEY" className="flex-1">MTN</TabsTrigger>
              <TabsTrigger value="ORANGE_MONEY" className="flex-1">Orange</TabsTrigger>
            </TabsList>

            <TabsContent value={paymentMethod}>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Phone number</Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +237 6xx xxx xxx"
                    inputMode="tel"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Payment PIN (simulation)</Label>
                  <Input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Any 4 digits"
                    inputMode="numeric"
                  />
                </div>

                <div className="dash-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">Amount</p>
                      <p className="text-xs text-muted-foreground">Pay <span className="font-semibold">{formatFCFA(total)}</span></p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{paymentMethod === "ORANGE_MONEY" ? "Orange Money" : "MTN Mobile Money"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">No real charge will be made.</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" type="button" onClick={() => setPaymentOpen(false)} disabled={placingOrder}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button
                    className="dash-button-primary"
                    type="button"
                    onClick={() => void placeOrder()}
                    disabled={placingOrder || !phoneNumber.trim() || !pin.trim()}
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" /> Confirm & Pay
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

