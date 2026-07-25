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

type Material = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
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

const materialQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prch-material", slug],
    queryFn: async () => {
      const { data: mat, error: matErr } = await supabase
        .from("materials")
        .select("id, name, slug, description, image_url")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (matErr) throw matErr;
      if (!mat) throw notFound();

      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select(
          "id, name, slug, short_description, finish, price, offer_price, mrp, images",
        )
        .eq("material_id", mat.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false });
      if (prodErr) throw prodErr;

      return { material: mat as Material, products: (products ?? []) as Product[] };
    },
  });

export const Route = createFileRoute("/material/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(materialQuery(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Material — PRC" }] };
    const m = loaderData.material;
    const title = `${m.name} Hardware — PRC`;
    const desc =
      m.description ??
      `Explore PRC precision hardware crafted in ${m.name}. Cubicle, locker and toilet partition fittings engineered for public spaces.`;
    const firstProductImage = loaderData.products.find((p) => p.images?.[0])?.images?.[0];
    const image = m.image_url ?? firstProductImage ?? null;
    const url = `/material/${params.slug}`;
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: MaterialPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm">Something went wrong: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="mb-4 font-serif text-4xl">Material not found</h1>
        <Link to="/" className="text-sm underline underline-offset-4">Return home</Link>
      </div>
    </div>
  ),
});

function formatPrice(p: Product) {
  const value = p.offer_price ?? p.price;
  if (value == null) return "Enquire";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
}

function MaterialPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(materialQuery(slug));
  const { material, products } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          {material.image_url ? (
            <img
              src={material.image_url}
              alt={material.name}
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
              Crafted In
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
              className="font-serif text-4xl md:text-6xl"
            >
              {material.name}
            </motion.h1>
            {material.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
                className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground"
              >
                {material.description}
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

        <section className="px-5 py-16 md:px-10 md:py-24">
          {products.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Coming soon
              </p>
              <h2 className="font-serif text-2xl">
                No products published in this material yet.
              </h2>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-4"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            >
              {products.map((p) => {
                return (
                  <motion.article
                    key={p.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0 },
                    }}
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
