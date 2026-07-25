import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Check,
  ArrowRight,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Building2,
  Hospital,
  GraduationCap,
  Plane,
  ShoppingBag as MallIcon,
  TrainTrack,
  Tag,
  Share2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { ProductRating } from "@/components/prch/ProductCard";
import { validateCouponCode } from "@/lib/coupon.functions";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  short_description: string | null;
  specifications: Record<string, unknown> | null;
  dimensions: Record<string, unknown> | null;
  finish: string | null;
  price: number | null;
  mrp: number | null;
  offer_price: number | null;
  gst: number | null;
  stock: number | null;
  images: string[] | null;
  warranty: string | null;
  brochure_url: string | null;
  install_guide_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  category_id: string | null;
  material_id: string | null;
  category?: { name: string; slug: string } | null;
  material?: { name: string } | null;
};

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prch-product", slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select(
          `id, name, slug, sku, description, short_description, specifications, dimensions, finish,
           price, mrp, offer_price, gst, stock, images, warranty, brochure_url, install_guide_url,
           seo_title, seo_description, og_image, category_id, material_id,
           category:categories!products_category_id_fkey(name, slug), material:materials(name)`,
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;

      // Fallback for direct testing if slug not found
      if (!product) {
        const { data: fallback } = await supabase
          .from("products")
          .select(
            `id, name, slug, sku, description, short_description, specifications, dimensions, finish,
             price, mrp, offer_price, gst, stock, images, warranty, brochure_url, install_guide_url,
             seo_title, seo_description, og_image, category_id, material_id,
             category:categories!products_category_id_fkey(name, slug), material:materials(name)`,
          )
          .eq("status", "published")
          .limit(1)
          .maybeSingle();
        if (fallback) {
          const { data: rel } = await supabase
            .from("products")
            .select("id, name, slug, finish, price, offer_price, mrp, images")
            .eq("status", "published")
            .neq("id", fallback.id)
            .limit(8);
          return { product: fallback as unknown as Product, related: (rel ?? []) as unknown as Product[] };
        }
        throw notFound();
      }

      // Related items
      let related: Product[] = [];
      if (product.category_id) {
        const { data: rel } = await supabase
          .from("products")
          .select("id, name, slug, finish, price, offer_price, mrp, images")
          .eq("category_id", product.category_id)
          .eq("status", "published")
          .neq("id", product.id)
          .limit(8);
        related = (rel ?? []) as unknown as Product[];
      }
      return { product: product as unknown as Product, related };
    },
  });

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(productQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product — PRC Hardware" }] };
    const p = loaderData.product;
    const title = p.seo_title ?? `${p.name} — PRC Hardware`;
    const desc =
      p.seo_description ??
      p.short_description ??
      `${p.name} — precision architectural hardware from PRC.`;
    const image = p.og_image ?? p.images?.[0];
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return { meta };
  },
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm">Something went wrong: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="mb-4 font-serif text-4xl">Product not found</h1>
        <Link to="/" className="text-sm underline underline-offset-4">Return home</Link>
      </div>
    </div>
  ),
});

function formatINR(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const { product, related } = data;
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Fetch active admin offers from Supabase
  const { data: dbAdminCoupons } = useQuery({
    queryKey: ["active-admin-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("name, description, discount_type, discount_value")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const availableChips = useMemo(() => {
    if (dbAdminCoupons && dbAdminCoupons.length > 0) {
      return dbAdminCoupons.map((c) => ({
        code: c.name.toUpperCase(),
        label: c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`,
      }));
    }
    return [];
  }, [dbAdminCoupons]);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const mrpVal = product.mrp ?? (product.price ? product.price * 1.18 : 2000);
  const offerPriceVal = product.offer_price ?? product.price ?? 1700;
  const discountAmount = Math.max(0, mrpVal - offerPriceVal);
  const discountPct = mrpVal > 0 ? Math.round((discountAmount / mrpVal) * 100) : 15;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalSavings = discountAmount + couponDiscount;

  const inStock = (product.stock ?? 10) > 0;

  // Selected chips
  const [selectedMaterial, setSelectedMaterial] = useState("AL");
  const [selectedCategoryChip, setSelectedCategoryChip] = useState("CUBICLE");

  async function handleAddToCart() {
    setAdding(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.info("Sign in to add items to your cart");
        navigate({ to: "/login" });
        return;
      }
      const userId = session.session.user.id;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: userId, product_id: product.id, quantity: qty });
      }

      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });
      toast.success(`Added ${qty} x ${product.name} to cart`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    setBuying(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.info("Sign in to proceed to checkout");
        navigate({ to: "/login" });
        return;
      }
      const userId = session.session.user.id;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: userId, product_id: product.id, quantity: qty });
      }

      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });

      const { data: profile } = await supabase.from("profiles").select("url_hash").eq("id", userId).maybeSingle();
      if (profile?.url_hash) {
        navigate({ to: `/account/${profile.url_hash}/checkout` as never });
      } else {
        navigate({ to: "/account" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not process Buy Now request");
    } finally {
      setBuying(false);
    }
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    const code = couponInput.trim().toUpperCase();
    try {
      const res = await validateCouponCode({ data: { code, cartTotal: offerPriceVal } });
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discount: res.discountAmount });
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply coupon");
    }
  }

  return (
    <div className="min-h-screen bg-[#F6EBD5] dark:bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      <PromoBar />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">


        {/* TOP SECTION: 3-COLUMN LAYOUT (Gallery | Summary Specs | Price Details Card) */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* COLUMN 1: GALLERY (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl bg-transparent p-0 flex items-center justify-center overflow-hidden">
              {/* Discount Badge Top-Left */}
              {discountPct > 0 && (
                <span className="absolute left-3 top-3 z-10 rounded-md bg-amber-500/90 text-white font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-sm">
                  {discountPct}% OFF
                </span>
              )}

              {/* Main Image */}
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="aspect-square h-full w-full object-contain"
                />
              ) : (
                <div className="flex aspect-square h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* Thumbnail Slider Row */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar py-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square h-14 w-14 overflow-hidden rounded-xl transition p-1 bg-transparent shrink-0 ${
                      i === activeImg ? "opacity-100" : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="aspect-square h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: MAIN PRODUCT INFO (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                {product.category?.name || "ALUMINIUM HARDWARE"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-foreground mt-1 leading-tight">
                {product.name}
              </h1>
              <ProductRating id={product.id} className="mt-2 text-xs" />
            </div>

            {/* Quick Specs Table */}
            <div className="rounded-xl border border-border/70 bg-white/70 dark:bg-card/70 p-4 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Product Code</span>
                <span className="col-span-2 font-semibold text-foreground font-mono">{product.sku || "PRC-AL-TR-001"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Brand</span>
                <span className="col-span-2 font-semibold text-foreground">PRC</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Material</span>
                <span className="col-span-2 font-semibold text-foreground">{product.material?.name || "Aluminium"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Finish</span>
                <span className="col-span-2 font-semibold text-foreground">{product.finish || "Matte Anodized"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Color</span>
                <span className="col-span-2 font-semibold text-foreground">Natural Aluminium</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1">
                <span className="text-muted-foreground font-medium">Category</span>
                <span className="col-span-2 font-semibold text-foreground">{product.category?.name || "Cubicle Hardware"}</span>
              </div>
            </div>

            {/* Big Price Row with Automatic Coupon Discount */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-foreground">
                  {formatINR(Math.max(0, offerPriceVal - couponDiscount))}
                </span>
                {offerPriceVal > Math.max(0, offerPriceVal - couponDiscount) && (
                  <span className="text-sm font-medium text-muted-foreground line-through">
                    {formatINR(offerPriceVal)}
                  </span>
                )}
                {mrpVal > offerPriceVal && (
                  <span className="text-sm font-medium text-muted-foreground line-through">
                    {formatINR(mrpVal)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              {appliedCoupon && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Coupon {appliedCoupon.code} Applied (Extra {formatINR(appliedCoupon.discount)} OFF!)</span>
                </div>
              )}
            </div>



            <p className="text-[11px] font-medium text-muted-foreground">GST Included (18%)</p>

            {/* Shipping & Stock Status Strip */}
            <div className="flex items-center gap-6 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> In Stock
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-4 w-4 text-amber-500" /> Ships within 24 Hours
              </span>
            </div>

            {/* Quantity Stepper & Add To Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border bg-white dark:bg-card p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  suppressHydrationWarning
                  className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary rounded-lg transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center font-semibold text-xs font-mono">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  suppressHydrationWarning
                  className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary rounded-lg transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                suppressHydrationWarning
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 px-4 text-xs font-bold uppercase tracking-[0.2em] text-background hover:opacity-90 active:scale-98 transition shadow-md disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" /> ADD TO CART
              </button>
            </div>

            {/* BUY NOW BUTTON */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buying}
              suppressHydrationWarning
              className="w-full rounded-xl border border-foreground bg-white dark:bg-card py-3 text-xs font-bold uppercase tracking-[0.22em] text-foreground hover:bg-foreground hover:text-background transition-all shadow-xs disabled:opacity-50"
            >
              {buying ? "PROCEEDING..." : "BUY NOW"}
            </button>
          </div>

          {/* COLUMN 3: PRICE DETAILS SIDEBAR CARD (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-white dark:bg-card p-5 space-y-5 shadow-sm">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider border-b border-border pb-3 text-foreground">
              PRICE DETAILS
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>MRP</span>
                <span className="font-mono">{formatINR(mrpVal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount ({discountPct}%)</span>
                <span className="font-mono text-rose-500">- {formatINR(discountAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border/50">
                <span>Offer Price</span>
                <span className="font-mono">{formatINR(offerPriceVal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/40">
                <span>Final Price</span>
                <span className="font-mono">{formatINR(offerPriceVal)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-border">
                <span>Total Savings</span>
                <span className="font-mono">{formatINR(totalSavings)}</span>
              </div>
            </div>

            {/* Guarantee Trust Badges */}
            <div className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground border-t border-border/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>GST Included (18%)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>7 Days Easy Returns</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>QUANTITY</span>
                <div className="flex items-center rounded-lg border border-border bg-secondary/30 px-2 py-1 font-mono">
                  <span>{qty}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-bold uppercase tracking-[0.2em] text-background hover:opacity-90 transition shadow-sm disabled:opacity-50"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> ADD TO CART
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={buying}
                className="w-full rounded-xl border border-foreground/40 bg-secondary/30 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition disabled:opacity-50"
              >
                {buying ? "PROCEEDING..." : "BUY NOW"}
              </button>
            </div>

            {/* Sales Desk Banner */}
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3 text-[11px] text-muted-foreground flex items-center gap-2.5">
              <Headphones className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-foreground block">Bulk Order?</span>
                <Link to="/contact" className="underline hover:text-foreground font-medium">Contact our sales team</Link>
              </div>
            </div>
          </div>
        </div>

        {/* 6-CARD STRUCTURED DETAILS GRID (DYNAMIC DATA) */}
        <div className="space-y-6 pt-6 border-t border-border/60">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: PRODUCT SPECIFICATIONS */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">1.</span> PRODUCT SPECIFICATIONS
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Product Name</span>
                  <span className="col-span-2 font-semibold text-foreground">{product.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Auto SEO Name</span>
                  <span className="col-span-2 font-mono text-muted-foreground text-[11px]">{product.slug}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Product Code</span>
                  <span className="col-span-2 font-mono font-semibold text-foreground">
                    {product.sku || (product.specifications?.sku as string) || `PRC-${product.slug.toUpperCase().slice(0, 10)}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Brand</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.brand as string) || "PRC Hardware"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Color</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.color as string) || product.finish || "Natural Anodized"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Material</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {product.material?.name || (product.specifications?.material as string) || "Aluminium"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Finish</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {product.finish || (product.specifications?.finish as string) || "Matte Finish"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-medium">Net Quantity</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.net_quantity as string) || "1 Piece"}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: DIMENSIONS */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">2.</span> DIMENSIONS
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Length</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.dimensions?.length as string) || "2400 mm"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Width</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.dimensions?.width as string) || "35 mm"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Height</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.dimensions?.height as string) || "42 mm"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Weight</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.dimensions?.weight as string) || "1.45 kg"}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium block">Compatible With / For</span>
                  <div className="space-y-1 text-muted-foreground">
                    {((product.dimensions?.compatible_with as string[]) || [
                      product.category?.name || "Cubicle Hardware",
                      "Aluminium Channel",
                      "Toilet & Urinal Partition",
                    ]).map((comp, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {comp}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-medium">Units</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.dimensions?.units as string) || "Piece"}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: DESCRIPTION */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">3.</span> DESCRIPTION
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.description ||
                  product.short_description ||
                  "Designed for high-performance restroom partition systems, this premium architectural hardware item provides excellent rigidity, corrosion resistance, and long-term durability. Engineered using precision extrusion for smooth installation and maintenance-free operation."}
              </p>

              {/* Ideal For Grid */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Ideal For</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground">
                  {((product.specifications?.ideal_for as string[]) || [
                    "Corporate Offices",
                    "Hospitals",
                    "Schools",
                    "Airports",
                    "Shopping Malls",
                    "Metro Stations",
                  ]).map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 4: WARRANTY */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">4.</span> WARRANTY
              </h3>

              <div className="space-y-2.5 text-xs text-foreground font-medium">
                {((product.specifications?.warranty_terms as string[]) || [
                  product.warranty || "2 Year Universal Manufacturing Warranty",
                  "Covers Manufacturing Defects & Finish Tarnish",
                  "Corrosion & Rust Resistant Certification",
                  "Easy Part Replacement Program",
                  "Dedicated Technical Support Included",
                ]).map((term, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{term}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 5: MANUFACTURER INFORMATION */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">5.</span> MANUFACTURER INFORMATION
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Generic Name</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.generic_name as string) || `${product.name} Hardware`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Country of Origin</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.country_of_origin as string) || "India"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Manufactured By</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.manufacturer_name as string) || "Pacific Products & Solutions"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-medium">Name and Address</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {(product.specifications?.manufacturer_address as string) ||
                      "Pacific Products & Solutions, Noida, Uttar Pradesh - 201301 India"}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 6: PRICING DETAILS SUMMARY */}
            <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 space-y-4 shadow-sm">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="text-amber-500 font-mono">6.</span> PRICING DETAILS
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">MRP</span>
                  <span className="font-mono font-semibold text-foreground">{formatINR(mrpVal)}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Discount ({discountPct}%)</span>
                  <span className="font-mono font-semibold text-rose-500">- {formatINR(discountAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Offer Price</span>
                  <span className="font-mono font-semibold text-foreground">{formatINR(offerPriceVal)}</span>
                </div>

                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Total Savings</span>
                  <span className="font-mono">{formatINR(totalSavings)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-foreground">
                RELATED PRODUCTS
              </h2>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {related.map((item) => {
                const itemImg = item.images?.[0] || "";
                const itemPrice = item.offer_price ?? item.price ?? 0;
                return (
                  <Link
                    key={item.id}
                    to="/product/$slug"
                    params={{ slug: item.slug }}
                    className="group rounded-2xl border border-border bg-white dark:bg-card p-3 flex flex-col justify-between hover:border-foreground/40 transition shadow-xs"
                  >
                    <div className="aspect-square w-full rounded-xl bg-secondary/30 overflow-hidden flex items-center justify-center p-2">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="aspect-square h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-[10px] text-muted-foreground uppercase">No Image</div>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:underline">
                        {item.name}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-foreground font-mono">{formatINR(itemPrice)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>



      <SiteFooter />
    </div>
  );
}
