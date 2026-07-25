import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, Flame, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickViewButton } from "./QuickView";
import { ProductCard } from "./ProductCard";

const EASE = [0.22, 1, 0.36, 1] as const;

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
    <div className={`flex items-center justify-center gap-1.5 text-foreground font-medium ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating)
                ? "fill-foreground text-foreground dark:fill-white dark:text-white"
                : "fill-foreground/20 text-foreground/30 dark:fill-white/20 dark:text-white/30"
            }`}
          />
        ))}
      </div>
      <span className="font-semibold text-foreground text-[11px]">{rating.toFixed(1)}</span>
      <span className="text-[10px] text-muted-foreground">({reviews})</span>
    </div>
  );
}

type Flag = "featured" | "best_seller" | "trending";

export type Product = {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  finish: string | null;
  price: number | null;
  offer_price: number | null;
  mrp: number | null;
  images: string[] | null;
};

function useProductsByFlag(flag: Flag) {
  return useQuery({
    queryKey: ["prch-products", flag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, short_description, finish, price, offer_price, mrp, images")
        .eq(flag, true)
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

function formatPriceBlock(p: Product, isDark: boolean) {
  const value = p.offer_price ?? p.price;
  if (value == null) return <span className="text-sm font-semibold">Enquire</span>;
  const hasMRP = p.mrp != null && Number(p.mrp) > Number(value);
  return (
    <div className="mt-1 flex items-baseline justify-center gap-2">
      <span className="text-sm sm:text-base font-semibold">{`₹ ${Number(value).toLocaleString("en-IN")}`}</span>
      {hasMRP && (
        <span className={`text-xs line-through ${isDark ? "text-background/50" : "text-muted-foreground"}`}>
          {`₹ ${Number(p.mrp).toLocaleString("en-IN")}`}
        </span>
      )}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  icon,
  flag,
  tone,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  flag: Flag;
  tone: "light" | "dark";
}) {
  const { data, isLoading } = useProductsByFlag(flag);
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth : 280;
    const gap = 24;
    const step = (cardWidth + gap) * (window.innerWidth < 640 ? 1 : 2);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  async function addToCart(e: React.MouseEvent, productId: string) {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(productId);
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
        .eq("product_id", productId)
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
          .insert({ user_id: userId, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
      toast.success("Added to cart");
      qc.invalidateQueries({ queryKey: ["prc-cart-count"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  }

  if (!isLoading && (data?.length ?? 0) === 0) return null;

  const isDark = tone === "dark";

  return (
    <section
      className={`relative isolate z-0 border-t px-5 py-8 md:px-10 md:py-12 ${
        isDark
          ? "border-border bg-foreground text-background"
          : "border-border bg-background text-foreground"
      }`}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p
            className={`mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] ${
              isDark ? "text-background/60" : "text-muted-foreground"
            }`}
          >
            {icon}
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">{title}</h2>
        </div>

        {/* Header Navigation Controls */}
        {data && data.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous products"
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm ${
                isDark
                  ? "border-background/30 bg-background/10 text-background hover:bg-background hover:text-foreground"
                  : "border-border bg-card text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next products"
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm ${
                isDark
                  ? "border-background/30 bg-background/10 text-background hover:bg-background hover:text-foreground"
                  : "border-border bg-card text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-[4/5] animate-pulse rounded-sm ${
                  isDark ? "bg-background/10" : "bg-muted"
                }`}
              />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${
            isDark ? "border-background/20 bg-background/5 text-background/70" : "border-border bg-muted/30 text-muted-foreground"
          }`}>
            <Sparkles className="mb-2 h-8 w-8 opacity-40" />
            <p className="font-serif text-lg font-medium">No Products Flagged for {title} Yet</p>
            <p className="mt-1 max-w-sm text-xs opacity-75">
              Go to <Link to="/admin/products" className="font-semibold text-foreground underline">Admin Panel &gt; Products</Link> and enable <span className="font-semibold uppercase tracking-wider">{eyebrow}</span> on your products to display them in this section.
            </p>
          </div>
        ) : (
          <>
            <div
              ref={ref}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 touch-pan-x overscroll-x-contain md:gap-6"
              style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
            >
              {data!.map((p, i) => {
                return (
                  <motion.div
                    key={p.id}
                    data-card
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: EASE }}
                    className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[23%]"
                  >
                    <ProductCard product={p} isDark={isDark} />
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function FeaturedSection() {
  return (
    <Section
      eyebrow="Curated Selection"
      title="Featured"
      icon={<Sparkles className="h-3 w-3" strokeWidth={1.5} />}
      flag="featured"
      tone="light"
    />
  );
}

export function BestsellerSection() {
  return (
    <Section
      eyebrow="Most Loved"
      title="Bestsellers"
      icon={<Flame className="h-3 w-3" strokeWidth={1.5} />}
      flag="best_seller"
      tone="light"
    />
  );
}

export function TrendingSection() {
  return (
    <Section
      eyebrow="What's Hot"
      title="Trending Now"
      icon={<TrendingUp className="h-3 w-3" strokeWidth={1.5} />}
      flag="trending"
      tone="light"
    />
  );
}
