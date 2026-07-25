import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, CreditCard, ShoppingBag, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createRazorpayOrder,
  verifyAndPlaceOrder,
  placeCodOrder,
} from "@/lib/razorpay.functions";
import { validateCouponCode } from "@/lib/coupon.functions";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (r: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  variant: string | null;
  material_finish: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    price: number;
    mrp: number | null;
    offer_price: number | null;
    gst: number | null;
    images: string[] | null;
    stock: number | null;
  } | null;
};

type Address = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: boolean;
};

export const Route = createFileRoute("/account/$accountId/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { accountId } = Route.useParams();
  const { profile } = useAccount();
  const navigate = useNavigate();

  const [rows, setRows] = useState<CartRow[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [payment, setPayment] = useState<"cod" | "upi" | "card">("cod");
  const [placing, setPlacing] = useState(false);
  const [processingStage, setProcessingStage] = useState<null | "creating" | "awaiting" | "verifying">(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Active Admin Coupons
  const { data: dbAdminCoupons } = useQuery({
    queryKey: ["active-checkout-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("name, description, discount_type, discount_value")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addingNew, setAddingNew] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pin_code: "",
    country: "India",
  });

  async function loadCart() {
    const { data } = await supabase
      .from("cart_items")
      .select(
        "id, product_id, quantity, variant, material_finish, product:products(id, name, slug, sku, price, mrp, offer_price, gst, images, stock)",
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setRows((data as unknown as CartRow[]) ?? []);
  }

  async function loadAddresses() {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false });
    const list = (data as Address[]) ?? [];
    setAddresses(list);
    if (list.length && !selectedAddressId) {
      setSelectedAddressId(list.find((a) => a.is_default)?.id ?? list[0].id);
    }
  }

  useEffect(() => {
    void loadCart();
    void loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const totals = useMemo(() => {
    if (!rows) return { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0, count: 0 };
    let subtotal = 0;
    let tax = 0;
    let count = 0;
    for (const r of rows) {
      if (!r.product) continue;
      const price = Number(r.product.offer_price ?? r.product.price);
      const line = price * r.quantity;
      subtotal += line;
      tax += (line * Number(r.product.gst ?? 0)) / 100;
      count += r.quantity;
    }
    const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 149;
    const discount = appliedCoupon ? Math.min(subtotal + tax + shipping, appliedCoupon.discount) : 0;
    const total = Math.max(0, subtotal + tax + shipping - discount);
    return { subtotal, tax, shipping, discount, total, count };
  }, [rows, appliedCoupon]);

  async function handleApplyCoupon(codeToApply?: string) {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    try {
      const res = await validateCouponCode({ data: { code, cartTotal: totals.subtotal } });
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discount: res.discountAmount });
        setCouponCode(res.code);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not apply coupon");
    }
  }

  async function saveNewAddress() {
    const full_name = (newAddr.full_name || profile.full_name || "").trim();
    const phone = (newAddr.phone || profile.phone || "").trim();
    const line1 = newAddr.line1.trim();
    const city = newAddr.city.trim();
    const state = (newAddr.state || "State").trim();
    const pin_code = newAddr.pin_code.trim();

    if (!full_name) return toast.error("Please enter full name");
    if (!phone) return toast.error("Please enter phone number");
    if (!line1) return toast.error("Please enter address line 1");
    if (!city) return toast.error("Please enter city");
    if (!pin_code) return toast.error("Please enter PIN code");

    const payload = {
      full_name,
      phone,
      line1,
      line2: newAddr.line2.trim() || null,
      landmark: newAddr.landmark.trim() || null,
      city,
      state: state || "State",
      pin_code,
      country: newAddr.country.trim() || "India",
      user_id: profile.id,
      is_default: addresses.length === 0,
    };

    const { data, error } = await supabase
      .from("addresses")
      .insert(payload)
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Address saved");
    setAddingNew(false);
    setNewAddr({ full_name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pin_code: "", country: "India" });
    await loadAddresses();
    if (data) setSelectedAddressId((data as Address).id);
  }

  const createGwOrder = useServerFn(createRazorpayOrder);
  const verifyOrder = useServerFn(verifyAndPlaceOrder);
  const codOrder = useServerFn(placeCodOrder);

  async function placeOrder() {
    if (placing) return;
    if (!rows || rows.length === 0) return toast.error("Your cart is empty");
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) return toast.error("Please select a delivery address");

    setPlacing(true);
    try {
      const items = rows.map((r) => {
        const price = Number(r.product?.offer_price ?? r.product?.price ?? 0);
        return {
          product_id: r.product_id,
          name: r.product?.name ?? "",
          sku: r.product?.sku ?? null,
          image: r.product?.images?.[0] ?? null,
          slug: r.product?.slug ?? null,
          variant: r.variant,
          material_finish: r.material_finish,
          quantity: r.quantity,
          unit_price: price,
          gst: Number(r.product?.gst ?? 0),
          line_total: price * r.quantity,
        };
      });

      const totalsPayload = {
        subtotal: Number(totals.subtotal.toFixed(2)),
        tax: Number(totals.tax.toFixed(2)),
        shipping: Number(totals.shipping.toFixed(2)),
        total: Number(totals.total.toFixed(2)),
      };

      // --- Cash on Delivery: no gateway round-trip ---
      if (payment === "cod") {
        await codOrder({ data: { items, address: addr, totals: totalsPayload } });
        toast.success("Order placed successfully");
        navigate({ to: "/account/$accountId/orders", params: { accountId } });
        return;
      }

      // --- Razorpay flow ---
      setProcessingStage("creating");
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load payment gateway. Check your connection.");

      const totalPaise = Math.round(totalsPayload.total * 100);
      const receipt = `rcpt_${Date.now().toString(36)}`;
      const gw = await createGwOrder({
        data: {
          totalPaise,
          receipt,
          items,
          address: addr,
          totals: totalsPayload,
          payment_method: payment as "upi" | "card",
        },
      });

      setProcessingStage("awaiting");

      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Payment gateway unavailable"));
          return;
        }
        let verifying = false;
        const rzp = new window.Razorpay({
          key: gw.keyId,
          amount: gw.amount,
          currency: gw.currency,
          name: "PRC",
          description: `Order · ${items.length} item${items.length === 1 ? "" : "s"}`,
          order_id: gw.orderId,
          prefill: {
            name: addr.full_name,
            contact: addr.phone,
            email: (profile as { email?: string }).email ?? undefined,
          },
          theme: { color: "#111111" },
          handler: (r) => {
            verifying = true;
            setProcessingStage("verifying");
            void (async () => {
              try {
                await verifyOrder({
                  data: {
                    razorpay_order_id: r.razorpay_order_id,
                    razorpay_payment_id: r.razorpay_payment_id,
                    razorpay_signature: r.razorpay_signature,
                  },
                });
                toast.success("Payment successful — order placed");
                navigate({ to: "/account/$accountId/orders", params: { accountId } });
                resolve();
              } catch (err) {
                reject(err instanceof Error ? err : new Error("Verification failed"));
              }
            })();
          },
          modal: {
            ondismiss: () => {
              if (!verifying) reject(new Error("Payment cancelled"));
            },
          },
        });
        rzp.open();
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setProcessingStage(null);
      setPlacing(false);
    }
  }


  if (!rows) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Your cart is empty — nothing to check out.</p>
        <Button asChild className="mt-4">
          <Link to="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">Checkout</p>
        <h1 className="mt-1 font-serif text-3xl">Complete your order</h1>
      </header>

      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-3 text-xs">
        {[
          { n: 1, label: "Address" },
          { n: 2, label: "Payment" },
          { n: 3, label: "Review" },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-3">
            <button
              onClick={() => setStep(s.n as 1 | 2 | 3)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                step >= s.n ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              }`}
            >
              {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
            </button>
            <span className={step >= s.n ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
            {i < 2 && <span className="ml-1 h-px w-8 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === 1 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <h2 className="font-medium">Delivery address</h2>
              </div>

              {addresses.length > 0 && (
                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-3">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      htmlFor={`addr-${a.id}`}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                        selectedAddressId === a.id ? "border-foreground bg-secondary/40" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value={a.id} id={`addr-${a.id}`} className="mt-1" />
                      <div className="text-sm">
                        <p className="font-medium">
                          {a.full_name} {a.is_default && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Default</span>}
                        </p>
                        <p className="text-muted-foreground">{a.phone}</p>
                        <p className="mt-1 text-muted-foreground">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}
                          {a.landmark ? `, ${a.landmark}` : ""}, {a.city}, {a.state} {a.pin_code}, {a.country}
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {addingNew ? (
                <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
                  <Field label="Full name *" value={newAddr.full_name} onChange={(v) => setNewAddr({ ...newAddr, full_name: v })} />
                  <Field label="Phone *" value={newAddr.phone} onChange={(v) => setNewAddr({ ...newAddr, phone: v })} />
                  <Field label="Address line 1 *" value={newAddr.line1} onChange={(v) => setNewAddr({ ...newAddr, line1: v })} className="sm:col-span-2" />
                  <Field label="Address line 2" value={newAddr.line2} onChange={(v) => setNewAddr({ ...newAddr, line2: v })} className="sm:col-span-2" />
                  <Field label="Landmark" value={newAddr.landmark} onChange={(v) => setNewAddr({ ...newAddr, landmark: v })} />
                  <Field label="PIN code *" value={newAddr.pin_code} onChange={(v) => setNewAddr({ ...newAddr, pin_code: v })} />
                  <Field label="City *" value={newAddr.city} onChange={(v) => setNewAddr({ ...newAddr, city: v })} />
                  <Field label="State *" value={newAddr.state} onChange={(v) => setNewAddr({ ...newAddr, state: v })} />
                  <Field label="Country" value={newAddr.country} onChange={(v) => setNewAddr({ ...newAddr, country: v })} />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button onClick={saveNewAddress}>Save address</Button>
                    <Button variant="ghost" onClick={() => setAddingNew(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="mt-4" onClick={() => setAddingNew(true)}>
                  + Add new address
                </Button>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedAddressId}>
                  Continue to payment
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <h2 className="font-medium">Payment method</h2>
              </div>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className="space-y-3">
                {[
                  { id: "cod", label: "Cash on Delivery", desc: "Pay in cash when your order is delivered." },
                  { id: "upi", label: "UPI", desc: "Pay instantly via GPay, PhonePe, Paytm or any UPI app." },
                  { id: "card", label: "Card / Netbanking / Wallet", desc: "Debit, credit, netbanking or wallets via Razorpay." },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    htmlFor={`pay-${opt.id}`}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                      payment === opt.id ? "border-foreground bg-secondary/40" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={opt.id} id={`pay-${opt.id}`} className="mt-1" />
                    <div className="text-sm">
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {payment !== "cod" && (
                <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Payments are processed securely by Razorpay. Your order is placed only after successful payment.
                </p>
              )}
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Review order</Button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-medium">Review & place order</h2>
              <ul className="divide-y divide-border">
                {rows.map((r) => {
                  const p = r.product;
                  const price = p ? Number(p.offer_price ?? p.price) : 0;
                  return (
                    <li key={r.id} className="flex gap-4 py-4">
                      {p?.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-muted" />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{p?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {r.quantity}
                          {r.variant && ` · ${r.variant}`}
                          {r.material_finish && ` · ${r.material_finish}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium">₹{(price * r.quantity).toLocaleString()}</p>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4 text-sm">
                  <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Ship to</p>
                  {(() => {
                    const a = addresses.find((x) => x.id === selectedAddressId);
                    return a ? (
                      <p>
                        {a.full_name}, {a.line1}, {a.city}, {a.state} {a.pin_code}
                      </p>
                    ) : null;
                  })()}
                </div>
                <div className="rounded-xl border border-border p-4 text-sm">
                  <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Payment</p>
                  <p className="uppercase">{payment}</p>
                </div>
              </div>

              {processingStage && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                  <div>
                    <p className="font-medium">
                      {processingStage === "creating" && "Preparing secure payment…"}
                      {processingStage === "awaiting" && "Complete payment in the Razorpay window"}
                      {processingStage === "verifying" && "Verifying payment — do not close this tab"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {processingStage === "verifying"
                        ? "Your order will be confirmed as soon as we verify the payment with Razorpay."
                        : "Please keep this window open until the payment is confirmed."}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={placing}>Back</Button>
                <Button onClick={placeOrder} disabled={placing} aria-busy={placing}>
                  {placing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {placing
                    ? processingStage === "verifying"
                      ? "Verifying payment…"
                      : processingStage === "awaiting"
                        ? "Waiting for payment…"
                        : "Processing…"
                    : `${payment === "cod" ? "Place order" : "Pay"} · ₹${totals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </Button>
              </div>

            </section>
          )}
        </div>

        <aside className="h-fit space-y-4">
          {/* ORDER SUMMARY */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h3 className="mb-4 font-serif text-lg">Order summary</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              {totals.count} item{totals.count === 1 ? "" : "s"}
            </p>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={totals.subtotal} />
              <Row label="GST" value={totals.tax} />
              <Row label={totals.shipping === 0 ? "Shipping (Free)" : "Shipping"} value={totals.shipping} />
              <div className="border-t border-border pt-2">
                <Row label="Total" value={totals.total} strong />
              </div>
            </dl>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Free shipping on orders above ₹5,000. Prices include applicable GST.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-medium" : ""}`}>
      <dt>{label}</dt>
      <dd>₹{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
    </div>
  );
}
