import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, ArrowUpDown, Sparkles, PackageX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { ProductCard } from "@/components/prch/ProductCard";
import { NewArrivalsHeroBanner } from "@/components/prch/NewArrivalsHeroBanner";

const EASE = [0.22, 1, 0.36, 1] as const;

type Product = {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  finish: string | null;
  price: number | null;
  offer_price: number | null;
  mrp: number | null;
  images: string[] | null;
  created_at: string | null;
};

const newArrivalsQuery = queryOptions({
  queryKey: ["prch-new-arrivals"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, short_description, finish, price, offer_price, mrp, images, created_at"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data ?? []) as Product[];
  },
});

export const Route = createFileRoute("/new-arrivals")({
  loader: ({ context }) => context.queryClient.ensureQueryData(newArrivalsQuery),
  head: () => ({
    meta: [
      { title: "New Arrivals — PRC Architectural Hardware" },
      {
        name: "description",
        content:
          "Explore the latest precision hardware releases from PRC — freshly engineered cubicle, locker, glass fittings, and toilet partition hardware.",
      },
      { property: "og:title", content: "New Arrivals — PRC Hardware" },
      {
        property: "og:description",
        content: "Discover the newest hardware innovations added to the PRC collection.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NewArrivalsPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm">Something went wrong loading new arrivals: {error.message}</div>
  ),
});

const FILTER_CATEGORIES = [
  { id: "all", label: "All New Releases" },
  { id: "brass", label: "Brass Hardware" },
  { id: "steel", label: "Stainless Steel" },
  { id: "partition", label: "Partition Fittings" },
  { id: "locks", label: "Locks & Hinges" },
];

function NewArrivalsPage() {
  const { data: rawProducts } = useSuspenseQuery(newArrivalsQuery);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    if (selectedFilter !== "all") {
      const query = selectedFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.finish && p.finish.toLowerCase().includes(query)) ||
          (p.short_description && p.short_description.toLowerCase().includes(query))
      );
    }

    if (sortBy === "price-low") {
      list.sort((a, b) => (a.offer_price ?? a.price ?? 0) - (b.offer_price ?? b.price ?? 0));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (b.offer_price ?? b.price ?? 0) - (a.offer_price ?? a.price ?? 0));
    }

    return list;
  }, [rawProducts, selectedFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        {/* 1. Auto-Sliding Hero Banner Section */}
        <NewArrivalsHeroBanner />

        {/* 2. Interactive Filter Toolbar & Product Grid */}
        <section id="products-grid" className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 py-12 sm:py-16">
          {/* Section Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Latest Catalogue
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground mt-1">
                New Arrival Products
              </h2>
            </div>

            {/* Controls Bar: Filter Chips & Sort Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Category Chips */}
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
                {FILTER_CATEGORIES.map((cat) => {
                  const active = selectedFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFilter(cat.id)}
                      className={`relative rounded-full px-4 py-2 text-xs font-medium transition-all ${
                        active
                          ? "bg-foreground text-background shadow-md"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Selector & Count Pill */}
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Item" : "Items"}
                </span>

                <div className="relative flex items-center rounded-xl border border-border bg-card px-3 py-1.5 text-xs">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-2"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Product Cards Grid */}
          <div className="mt-8">
            {filteredProducts.length === 0 ? (
              <div className="mx-auto max-w-md py-20 text-center">
                <PackageX className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="font-serif text-2xl font-medium">No Products Found</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  No new arrivals match your selected filter. Try selecting "All New Releases".
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedFilter("all")}
                  className="mt-5 rounded-xl bg-foreground px-5 py-2.5 text-xs uppercase tracking-widest text-background"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {filteredProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
                    }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
