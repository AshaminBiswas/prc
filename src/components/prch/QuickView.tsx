import { useEffect, useState } from "react";
import { Eye, X, Loader2, ChevronLeft, ChevronRight, ShoppingBag, Zap, Minus, Plus, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { ProductRating } from "./FeaturedSections";

const EASE = [0.22, 1, 0.36, 1] as const;

export type QuickViewProduct = {
  id: string;
  name: string;
  slug: string | null;
  short_description?: string | null;
  finish?: string | null;
  sku?: string | null;
  price?: number | null;
  offer_price?: number | null;
  mrp?: number | null;
  stock?: number | null;
  images?: string[] | null;
};

function formatPrice(v: number | null | undefined) {
  if (v == null) return null;
  return `₹ ${Number(v).toLocaleString("en-IN")}`;
}

export function QuickViewButton({
  product,
  tone = "light",
}: {
  product: QuickViewProduct;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [liveImages, setLiveImages] = useState<string[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [loadedIdx, setLoadedIdx] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();
  const qc = useQueryClient();

  const images = liveImages ?? product.images ?? [];
  const imagesLen = images.length;

  useEffect(() => {
    if (!open) return;
    setActiveImg(0);
    setQuantity(1);
    setLoadedIdx({});
    setFetching(true);
    let cancelled = false;

    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("images")
        .eq("id", product.id)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data?.images) setLiveImages(data.images as string[]);
        setFetching(false);
      }
    };
    fetchImages();

    const channel = supabase
      .channel(`quickview-product-${product.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${product.id}` },
        (payload) => {
          const next = (payload.new as { images?: string[] | null })?.images;
          if (next) {
            setLiveImages(next);
            setLoadedIdx({});
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [open, product.id]);

  useEffect(() => {
    if (!open || imagesLen < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActiveImg((i) => (i + 1) % imagesLen);
      if (e.key === "ArrowLeft") setActiveImg((i) => (i - 1 + imagesLen) % imagesLen);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, imagesLen]);

  const price = product.offer_price ?? product.price;
  const discounted =
    product.offer_price != null &&
    product.mrp != null &&
    Number(product.offer_price) < Number(product.mrp);

  const discountPct =
    discounted && product.mrp
      ? Math.round(
          ((Number(product.mrp) - Number(product.offer_price)) / Number(product.mrp)) * 100
        )
      : 0;

  async function addToCart() {
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
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: product.id, quantity });
        if (error) throw error;
      }

      toast.success(`Added ${quantity} ${quantity > 1 ? "items" : "item"} to cart`);
      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  async function orderNow() {
    setOrdering(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.info("Sign in to place an order");
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
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: product.id, quantity });
        if (error) throw error;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("url_hash")
        .eq("id", userId)
        .maybeSingle();

      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });
      toast.success("Proceeding to checkout");
      setOpen(false);

      if (profile?.url_hash) {
        navigate({ to: `/account/${profile.url_hash}/cart` as never });
      } else {
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process order");
    } finally {
      setOrdering(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Quick view ${product.name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`absolute right-3 top-3 z-20 flex items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 shadow-sm ${
          tone === "dark"
            ? "border-background/60 bg-foreground/80 text-background hover:bg-background hover:text-foreground"
            : "border-foreground/70 bg-background/90 text-foreground hover:bg-foreground hover:text-background"
        }`}
      >
        <Eye className="h-3 w-3" strokeWidth={1.5} />
        Quick View
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 rounded-none sm:rounded-tr-3xl sm:rounded-bl-3xl border border-border shadow-2xl bg-background max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Quick view details and instant ordering for {product.name}
          </DialogDescription>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground border border-border shadow-md backdrop-blur transition hover:bg-foreground hover:text-background"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left Image Section — Strict 1:1 Aspect Ratio */}
            <div className="relative bg-secondary/40 border-b border-border md:border-b-0 md:border-r p-4 sm:p-5 flex flex-col items-center justify-center">
              <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[320px] overflow-hidden rounded-lg bg-background border border-border/50 shadow-sm">
                {fetching && images.length === 0 ? (
                  <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    {images[activeImg] ? (
                      <motion.div
                        key={activeImg}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="absolute inset-0 aspect-square"
                      >
                        {!loadedIdx[activeImg] && (
                          <div className="absolute inset-0 animate-pulse bg-muted" />
                        )}
                        <img
                          src={images[activeImg]}
                          alt={`${product.name} — image ${activeImg + 1}`}
                          loading="lazy"
                          decoding="async"
                          onLoad={() => setLoadedIdx((s) => ({ ...s, [activeImg]: true }))}
                          className={`absolute inset-0 aspect-square h-full w-full object-contain p-1 transition-opacity duration-300 ${
                            loadedIdx[activeImg] ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </motion.div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </AnimatePresence>
                )}

                {/* Badges */}
                <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
                  {discounted && (
                    <span className="border border-foreground bg-background px-2 py-0.5 text-[8px] uppercase tracking-[0.24em] font-semibold text-foreground shadow-sm">
                      {discountPct}% OFF
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.24em] font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    PRC Genuine
                  </span>
                </div>

                {/* Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur transition hover:bg-foreground hover:text-background"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur transition hover:bg-foreground hover:text-background"
                    >
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-background/80 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] backdrop-blur font-medium">
                      {activeImg + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 flex max-w-[280px] sm:max-w-[320px] gap-1.5 overflow-x-auto p-1 no-scrollbar">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Show image ${i + 1}`}
                      onClick={() => setActiveImg(i)}
                      className={`h-11 w-11 flex-none overflow-hidden rounded border transition ${
                        i === activeImg ? "border-foreground ring-1 ring-foreground" : "border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Details & Order Section — Compact Height */}
            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-[0.32em] text-muted-foreground font-semibold">
                  PRC Hardware
                </p>
                <h3 className="font-serif text-xl sm:text-2xl leading-snug text-foreground">{product.name}</h3>

                <ProductRating id={product.id} className="mt-1.5" />

                {(product.finish || product.sku) && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {product.finish && <span className="rounded bg-secondary px-2 py-0.5">Finish · {product.finish}</span>}
                    {product.sku && <span className="rounded bg-secondary px-2 py-0.5">SKU · {product.sku}</span>}
                  </div>
                )}

                {product.short_description && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {product.short_description}
                  </p>
                )}

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-2.5 border-y border-border/60 py-3">
                  <span className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                    {formatPrice(price) ?? "Enquire"}
                  </span>
                  {discounted && (
                    <span className="text-xs text-muted-foreground line-through font-normal">
                      {formatPrice(product.mrp)}
                    </span>
                  )}
                </div>

                {/* Quantity Picker */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-foreground">Quantity</span>
                  <div className="flex items-center rounded-md border border-border bg-background">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center text-foreground transition hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-8 w-8 items-center justify-center text-foreground transition hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5 pt-3 border-t border-border/60">
                {/* ORDER NOW BUTTON */}
                <button
                  type="button"
                  onClick={orderNow}
                  disabled={ordering || adding}
                  className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-background transition hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 shadow-sm"
                >
                  {ordering ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing Order…
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current" /> Order Now
                    </>
                  )}
                </button>

                {/* ADD TO CART BUTTON */}
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={adding || ordering}
                  className="flex w-full items-center justify-center gap-2 border border-foreground bg-background py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground transition hover:bg-foreground hover:text-background active:scale-[0.99] disabled:opacity-60"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding to Cart…
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                    </>
                  )}
                </button>

                {/* VIEW FULL DETAILS LINK */}
                {product.slug && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/product/$slug", params: { slug: product.slug! } });
                    }}
                    className="mt-0.5 text-center text-[9px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    View Full Product Details &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
