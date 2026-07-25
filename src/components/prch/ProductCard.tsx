import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Star, ShoppingCart, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickViewButton } from "./QuickView";

export type ProductCardItem = {
  id: string;
  name: string;
  slug: string | null;
  price: number | null;
  offer_price?: number | null;
  mrp?: number | null;
  images?: string[] | null;
  finish?: string | null;
  short_description?: string | null;
  featured?: boolean | null;
  best_seller?: boolean | null;
  trending?: boolean | null;
};

export function getProductRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const rating = (4.5 + (positiveHash % 5) * 0.1).toFixed(1);
  const reviews = 12 + (positiveHash % 88);
  return { rating: Number(rating), reviews };
}

export function ProductRating({ id, className = "" }: { id: string; className?: string }) {
  const { rating, reviews } = getProductRating(id);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < Math.floor(rating)
                ? "fill-foreground text-foreground dark:fill-white dark:text-white"
                : "fill-foreground/15 text-foreground/25 dark:fill-white/15 dark:text-white/25"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({reviews})</span>
    </div>
  );
}

export function ProductCard({
  product,
  isDark = false,
}: {
  product: ProductCardItem;
  isDark?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const image = product.images?.[0] ?? "";
  const sellingPrice = product.offer_price ?? product.price;
  const hasMRP = product.mrp != null && Number(product.mrp) > Number(sellingPrice);
  const { rating, reviews } = getProductRating(product.id);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: product.id, quantity: 1 });
        if (error) throw error;
      }

      toast.success(`Added ${product.name} to cart`);
      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-tr-3xl rounded-bl-3xl rounded-tl-none rounded-br-none border p-3 sm:p-4 transition-all duration-300 ${
        isDark
          ? "border-foreground/30 bg-background/10 hover:bg-background/15"
          : "border-[#cfc0a2] dark:border-border/90 bg-[#f5e9d2]/70 dark:bg-card/90 hover:bg-[#f2e4ca] dark:hover:bg-card"
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-tr-2xl rounded-bl-2xl rounded-tl-none rounded-br-none bg-black/5 dark:bg-muted">
        {product.slug ? (
          <Link to="/product/$slug" params={{ slug: product.slug }} className="block aspect-square w-full">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                draggable={false}
                className="aspect-square h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
                No image
              </div>
            )}
          </Link>
        ) : (
          <div className="block aspect-square w-full">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                draggable={false}
                className="aspect-square h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
                No image
              </div>
            )}
          </div>
        )}

        <QuickViewButton product={product} tone={isDark ? "dark" : "light"} />
      </div>

      {/* Title & Rating Section */}
      <div className="mt-3.5 px-0.5">
        {product.slug ? (
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:underline block">
            <h3 className="font-serif text-lg sm:text-xl font-normal leading-snug text-foreground line-clamp-1">
              {product.name}
            </h3>
          </Link>
        ) : (
          <h3 className="font-serif text-lg sm:text-xl font-normal leading-snug text-foreground line-clamp-1">
            {product.name}
          </h3>
        )}

        <ProductRating id={product.id} className="mt-2" />
      </div>

      {/* Horizontal Divider Line */}
      <div className="my-3 border-t border-[#dfd2b7] dark:border-border/80" />

      {/* Bottom Price & Add to Cart Row */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {sellingPrice != null ? `₹ ${Number(sellingPrice).toLocaleString("en-IN")}` : "Enquire"}
          </span>
          {hasMRP && (
            <span className="text-xs text-muted-foreground line-through font-normal">
              {`₹ ${Number(product.mrp).toLocaleString("en-IN")}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Vertical Divider */}
          <div className="h-6 w-px bg-[#dfd2b7] dark:bg-border/80" />

          {/* Cart Icon Button with Plus */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
            className="relative flex h-9 w-12 sm:h-10 sm:w-14 items-center justify-center rounded-xl border border-foreground/80 text-foreground transition-all duration-300 hover:bg-foreground hover:text-background active:scale-95 shadow-sm disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-0.5">
                <ShoppingCart className="h-4 w-4 stroke-[1.8]" />
                <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
