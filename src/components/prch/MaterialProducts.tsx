import { forwardRef, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuickViewButton } from "./QuickView";
import { ProductCard } from "./ProductCard";

type Category = { id: string; name: string; slug: string; sort_order: number | null };
type Material = { id: string; name: string; slug: string; sort_order: number | null };
type Product = {
  id: string;
  name: string;
  slug: string | null;
  finish: string | null;
  short_description: string | null;
  price: number | null;
  offer_price: number | null;
  mrp: number | null;
  images: string[] | null;
  category_id: string | null;
  material_id: string | null;
  featured: boolean | null;
  trending: boolean | null;
  best_seller: boolean | null;
  updated_at: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const catalogQuery = queryOptions({
  queryKey: ["prch-material-products-section"],
  queryFn: async () => {
    const [cats, mats, prods] = await Promise.all([
      supabase.from("categories").select("id, name, slug, sort_order").eq("status", "active").order("sort_order"),
      supabase.from("materials").select("id, name, slug, sort_order").eq("status", "active").order("sort_order"),
      supabase
        .from("products")
        .select(
          "id, name, slug, finish, short_description, price, offer_price, mrp, images, category_id, material_id, featured, trending, best_seller, updated_at",
        )
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(60),
    ]);
    if (cats.error) throw cats.error;
    if (mats.error) throw mats.error;
    if (prods.error) throw prods.error;
    return {
      categories: (cats.data ?? []) as Category[],
      materials: (mats.data ?? []) as Material[],
      products: (prods.data ?? []) as Product[],
    };
  },
});

function formatINR(n: number | null | undefined) {
  if (n == null) return "";
  return "₹ " + new Intl.NumberFormat("en-IN").format(n);
}

export function MaterialProducts() {
  const { data, isLoading, error } = useQuery(catalogQuery);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null); // null = All
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeCategoryId = categoryId ?? data?.categories[0]?.id ?? null;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.products.filter(
      (p) =>
        (!activeCategoryId || p.category_id === activeCategoryId) &&
        (!materialId || p.material_id === materialId),
    );
  }, [data, activeCategoryId, materialId]);

  const activeCategory = data?.categories.find((c) => c.id === activeCategoryId);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.offsetWidth : 280;
    const gap = 24;
    const step = (cardWidth + gap) * (window.innerWidth < 640 ? 1 : 2);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative isolate z-0 border-t border-border bg-secondary/40 px-5 py-8 md:px-10 md:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Shop by Category
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Precision Hardware</h2>
        </div>

        <div className="flex items-center gap-3">
          {activeCategory ? (
            <Link
              to="/category/$slug"
              params={{ slug: activeCategory.slug }}
              className="group/link inline-flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.28em]"
            >
              <span className="relative">
                View all
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:w-full" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:bg-foreground group-hover/link:text-background sm:h-9 sm:w-9">
                <motion.span
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </motion.span>
              </span>
            </Link>
          ) : null}

          {/* Left & Right Scroll Buttons */}
          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-all hover:scale-105 active:scale-95 hover:border-foreground hover:bg-foreground hover:text-background shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-all hover:scale-105 active:scale-95 hover:border-foreground hover:bg-foreground hover:text-background shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] w-full animate-pulse rounded-tr-3xl rounded-bl-3xl bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">
          Could not load products. {(error as Error).message}
        </p>
      )}

      {data && (
        <>
          {/* Category tabs */}
          <div className="relative mx-auto flex w-fit flex-wrap justify-center gap-x-2 gap-y-3">
            {data.categories.map((c) => {
              const active = activeCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className="relative px-5 py-2 text-[11px] uppercase tracking-[0.28em] transition-colors"
                >
                  <span className={active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}>
                    {c.name}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="category-underline"
                      transition={{ duration: 0.55, ease: EASE }}
                      className="absolute inset-x-3 bottom-0 h-px bg-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Material pills */}
          {data.materials.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setMaterialId(null)}
                className={`rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-all ${
                  materialId === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:border-foreground"
                }`}
              >
                All Finishes
              </button>
              {data.materials.map((m) => {
                const active = materialId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMaterialId(m.id)}
                    className={`rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-all ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Product Scroller Track */}
          <div className="relative mt-8 min-h-[380px]">
            <ProductScroller
              ref={scrollerRef}
              keyName={`${activeCategoryId ?? ""}-${materialId ?? "all"}`}
              products={filtered}
            />
          </div>
        </>
      )}
    </section>
  );
}

const ProductScroller = forwardRef<
  HTMLDivElement,
  { keyName: string; products: Product[] }
>(({ keyName, products }, ref) => {
  return (
    <div className="relative min-h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={keyName}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {products.length === 0 ? (
            <p className="py-20 text-center text-xs uppercase tracking-widest text-muted-foreground">
              No products in this combination yet.
            </p>
          ) : (
            <div
              ref={ref}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 touch-pan-x overscroll-x-contain md:gap-6"
              style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
            >
              {products.map((p, i) => {
                return (
                  <motion.div
                    key={p.id}
                    data-card
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, duration: 0.4, ease: EASE }}
                    className="w-[78%] shrink-0 snap-start sm:w-[48%] md:w-[30%] lg:w-[23%]"
                  >
                    <ProductCard product={p} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
ProductScroller.displayName = "ProductScroller";
