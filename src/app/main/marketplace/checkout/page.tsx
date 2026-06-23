"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, CreditCard, Loader2, Smartphone, ShoppingBag, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from API or from query params (single item)
  useEffect(() => {
    async function loadCart() {
      try {
        const listingId = searchParams.get("listingId");
        if (listingId) {
          // Single item checkout from Buy Now
          const res = await fetch(`/api/marketplace/${listingId}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json().catch(() => ({}));
            if (json?.id) {
              setCartItems([json]);
            }
          }
        } else if (dashUser?.id) {
          // Cart checkout - load full cart items
          const res = await fetch(`/api/cart/items?userId=${dashUser.id}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json().catch(() => ({}));
            if (Array.isArray(json?.items)) {
              setCartItems(json.items.map((ci: any) => ci.listing || ci).filter(Boolean));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load cart:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [dashUser?.id, searchParams]);

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
  const platformFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + platformFee;

  const removeFromCart = async (item: any) => {
    if (!dashUser || !item.id) return;
    try {
      const res = await fetch(`/api/cart/items?userId=${dashUser.id}&listingId=${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCartItems(prev => prev.filter(i => i.id !== item.id));
        toast({ title: "Removed from cart" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your mobile money number to proceed.",
        variant: "destructive",
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to your cart first.", variant: "destructive" });
      return;
    }

    setProcessing(true);

    try {
      // Submit order via API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buyerId: dashUser?.id,
          items: cartItems.map((item: any) => ({
            listingId: item.id,
            quantity: 1,
            pricePerUnit: item.price || 0,
          })),
          totalPrice: total,
          paymentMethod: paymentMethod === "orange_money" ? "ORANGE_MONEY" : "MOBILE_MONEY",
          phoneNumber,
        }),
      });

      if (res.ok) {
        toast({
          title: "Order Placed Successfully",
          description: "Your payment is being processed.",
        });
        router.push("/main/marketplace");
        return;
      }

      // If API fails, show error but allow retry
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || "Order submission failed");
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-headline font-bold">Checkout</h1>
          <p className="text-xs text-muted-foreground">Complete your purchase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="dash-card p-5 space-y-4 h-fit">
          <h2 className="text-sm font-semibold border-b pb-2">Order Summary</h2>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items in cart</p>
              <p className="text-xs mt-1">Add items from the marketplace first.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => router.push("/main/marketplace")}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {item.images?.[0] && (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: 1</p>
                    </div>
                    <p className="text-xs font-bold">FCFA {item.price || 0}</p>
                    {!searchParams.get("listingId") && (
                      <button
                        onClick={() => removeFromCart(item)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">FCFA {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">FCFA {platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">FCFA {total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Details */}
        <div className="dash-card p-5 space-y-5">
          <h2 className="text-sm font-semibold border-b pb-2">Payment Method</h2>
          
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
            <div className="flex items-center space-x-3 border p-3 rounded-xl hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="mobile_money" id="momo" />
              <Label htmlFor="momo" className="flex items-center gap-2 cursor-pointer w-full font-medium">
                <Smartphone className="w-4 h-4 text-[#F7C800]" /> MTN Mobile Money
              </Label>
            </div>
            <div className="flex items-center space-x-3 border p-3 rounded-xl hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="orange_money" id="om" />
              <Label htmlFor="om" className="flex items-center gap-2 cursor-pointer w-full font-medium">
                <Smartphone className="w-4 h-4 text-[#FF6600]" /> Orange Money
              </Label>
            </div>
            <div className="flex items-center space-x-3 border p-3 rounded-xl hover:bg-muted/50 cursor-pointer opacity-50">
              <RadioGroupItem value="card" id="card" disabled />
              <Label htmlFor="card" className="flex items-center gap-2 w-full font-medium">
                <CreditCard className="w-4 h-4 text-muted-foreground" /> Card (Coming Soon)
              </Label>
            </div>
          </RadioGroup>

          <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-xs">Mobile Money Number</Label>
              <Input
                type="tel"
                placeholder="e.g. 670 000 000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={processing || cartItems.length === 0}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing
                </>
              ) : (
                `Pay FCFA ${total.toLocaleString()}`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}