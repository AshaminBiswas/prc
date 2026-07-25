import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { QuickViewButton } from "@/components/prch/QuickView";
import { ProductCard } from "@/components/prch/ProductCard";

const EASE = [0.22, 1, 0.36, 1] as const;

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image?: string | null;
};


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
};

const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prch-category", slug],
    queryFn: async () => {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, seo_title, seo_description")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (catErr) throw catErr;
      if (!cat) throw notFound();

      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select(
          "id, name, slug, short_description, finish, price, offer_price, mrp, images",
        )
        .eq("category_id", cat.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false });
      if (prodErr) throw prodErr;

      return { category: cat as Category, products: (products ?? []) as Product[] };
    },
  });

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(categoryQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Category — PRC" }] };
    const c = loaderData.category;
    const title = c.seo_title ?? `${c.name} — PRC`;
    const desc =
      c.seo_description ?? c.description ?? `Explore ${c.name} from PRC.`;
    const image = c.og_image ?? c.image_url ?? null;
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return { meta };
  },

  component: CategoryPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm">Something went wrong: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          404
        </p>
        <h1 className="mb-4 font-serif text-4xl">Category not found</h1>
        <Link to="/" className="text-sm underline underline-offset-4">
          Return home
        </Link>
      </div>
    </div>
  ),
});

function formatPrice(p: Product) {
  const value = p.offer_price ?? p.price;
  if (value == null) return "Enquire";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  const { category, products } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          ) : null}
          <div className="relative px-5 py-24 text-center md:px-10 md:py-32">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mb-4 text-[11px] uppercase tracking-[0.32em] text-muted-foreground"
            >
              Collection
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
              className="font-serif text-4xl md:text-6xl"
            >
              {category.name}
            </motion.h1>
            {category.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
                className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground"
              >
                {category.description}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
              className="mt-6 text-[11px] uppercase tracking-[0.28em] text-muted-foreground"
            >
              {products.length} {products.length === 1 ? "Product" : "Products"}
            </motion.p>
          </div>
        </section>

        {/* Products */}
        <section className="px-5 py-16 md:px-10 md:py-24">
          {products.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Coming soon
              </p>
              <h2 className="font-serif text-2xl">
                No products published in this category yet.
              </h2>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {products.map((p) => {
                const image = p.images?.[0];
                const discounted =
                  p.offer_price != null &&
                  p.mrp != null &&
                  Number(p.offer_price) < Number(p.mrp);
                return (
                  <motion.article
                    key={p.id}
                    variants={{
                      hidden: { opacity: 0, y: 24 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, ease: EASE },
                      },
                    }}
                    className="group"
                  >
                    <ProductCard product={p} />

                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
