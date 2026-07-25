import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { validateCouponCode } from "@/lib/coupon.functions";
import { toast } from "sonner";

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

export const Route = createFileRoute("/account/$accountId/cart")({
  component: CartTab,
});

function CartTab() {
  const { accountId } = Route.useParams();
  const { profile } = useAccount();
  const [rows, setRows] = useState<CartRow[] | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Active Admin Coupons
  const { data: dbAdminCoupons } = useQuery({
    queryKey: ["active-cart-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("name, description, discount_type, discount_value")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function load() {
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, variant, material_finish, product:products(id, name, slug, sku, price, mrp, offer_price, gst, images, stock)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setRows((data as unknown as CartRow[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, [profile.id]);

  async function updateQty(id: string, qty: number) {
    if (qty < 1) return;
    const { error } = await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      await load();
    }
  }

  const totals = useMemo(() => {
    if (!rows) return { subtotal: 0, tax: 0, discount: 0, total: 0 };
    let subtotal = 0;
    let tax = 0;
    for (const r of rows) {
      if (!r.product) continue;
      const price = Number(r.product.offer_price ?? r.product.price);
      const line = price * r.quantity;
      subtotal += line;
      tax += (line * Number(r.product.gst ?? 0)) / 100;
    }

    const discount = appliedCoupon ? Math.min(subtotal + tax, appliedCoupon.discount) : 0;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
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

  if (!rows) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  if (rows.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Your cart is empty</p>
        <Button className="mt-4" onClick={() => (window.location.href = "/")}>Continue shopping</Button>
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <ul className="space-y-3">
        {rows.map((r) => {
          const p = r.product;
          const price = p ? Number(p.offer_price ?? p.price) : 0;
          const mrp = p ? Number(p.mrp ?? p.price) : 0;
          const hasDiscount = mrp > price;
          return (
            <li key={r.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              {p?.images?.[0] ? (
                <img src={p.images[0]} alt="" className="h-24 w-24 rounded-lg border border-border object-cover" />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-muted" />
              )}
              <div className="flex-1">
                <p className="font-medium">{p?.name ?? "Product"}</p>
                <p className="text-xs text-muted-foreground">
                  {p?.sku && `SKU: ${p.sku}`}
                  {r.variant && ` · ${r.variant}`}
                  {r.material_finish && ` · ${r.material_finish}`}
                </p>
                <p className="mt-1 text-sm">
                  ₹{price.toLocaleString()}
                  {hasDiscount && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">₹{mrp.toLocaleString()}</span>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => updateQty(r.id, r.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{r.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => updateQty(r.id, r.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="ml-2">
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              </div>
              <p className="text-sm font-medium">₹{(price * r.quantity).toLocaleString()}</p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit space-y-4">
        {/* SUMMARY CARD */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h3 className="mb-4 font-serif text-lg">Order Summary</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label="GST (Estimated)" value={totals.tax} />
            <div className="border-t border-border pt-2">
              <Row label="Total" value={totals.total} strong />
            </div>
          </dl>
          <Button asChild className="mt-4 w-full">
            <Link to="/account/$accountId/checkout" params={{ accountId }}>Proceed to checkout</Link>
          </Button>
          <Button variant="outline" className="mt-2 w-full" onClick={() => (window.location.href = "/")}>
            Continue shopping
          </Button>
        </div>
      </aside>
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


