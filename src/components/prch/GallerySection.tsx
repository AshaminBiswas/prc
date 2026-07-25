import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";

const fallback = [
  { src: g1, alt: "Brushed stainless steel cubicle hinge detail" },
  { src: g2, alt: "Satin aluminium wall bracket" },
  { src: g3, alt: "Matte black nylon bracket hardware" },
  { src: g4, alt: "Modern office washroom cubicle installation" },
  { src: g5, alt: "School locker room with aluminium hardware" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

type Tile = { src: string; alt: string; subtitle?: string | null; link?: string | null };

export function GallerySection() {
  // Query manual gallery entries ONLY — Product catalog images are NOT pulled
  const { data: galleryItems } = useQuery({
    queryKey: ["prc-manual-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, image_url, button_link")
        .eq("type", "gallery")
        .neq("status", "disabled")
        .order("display_order", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const tiles: Tile[] = (() => {
    if (galleryItems && galleryItems.length > 0) {
      const out: Tile[] = galleryItems.map((g) => ({
        src: g.image_url ?? g1,
        alt: g.title ?? "PRC Gallery",
        subtitle: g.subtitle,
        link: g.button_link,
      }));
      return out;
    }
    return fallback.map((f) => ({ src: f.src, alt: f.alt, link: null }));
  })();

  return (
    <section className="border-t border-border py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl px-5 text-center md:px-10">
        <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Gallery
        </p>
        <h2 className="mb-4 font-serif text-4xl md:text-5xl">The PRC Archive</h2>
        <p className="text-muted-foreground">
          A closer look at materials, finishes, and real-world installations.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 lg:grid-cols-4 md:px-10"
      >
        {tiles.map((tile, idx) => {
          const wrapperClass = `group relative overflow-hidden rounded-tr-3xl rounded-bl-3xl bg-secondary ${
            idx === 0 ? "lg:col-span-2 lg:row-span-2" : ""
          }`;
          const imgClass = `w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            idx === 0 ? "aspect-square lg:aspect-auto lg:h-full" : "aspect-square"
          }`;
          const inner = (
            <>
              <img
                src={tile.src}
                alt={tile.alt}
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                draggable={false}
                className={imgClass}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="font-serif text-lg leading-tight">{tile.alt}</p>
                {tile.subtitle && (
                  <p className="mt-1 text-xs text-white/80">{tile.subtitle}</p>
                )}
              </div>
            </>
          );

          return (
            <motion.div key={tile.src + idx} className={wrapperClass}>
              {tile.link ? (
                <Link to={tile.link as never} className="block h-full">
                  {inner}
                </Link>
              ) : (
                <div className="block h-full">{inner}</div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
