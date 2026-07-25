import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import cubicle from "@/assets/cat-cubicle.jpg";
import locker from "@/assets/cat-locker.jpg";
import partition from "@/assets/cat-partition.jpg";

const EASE = [0.22, 1, 0.36, 1] as const;

const cats = [
  { title: "Cubicle Hardware", slug: "cubicle-hardware", image: cubicle, caption: "Hinges · Bolts · Brackets" },
  { title: "Locker Hardware", slug: "locker-hardware", image: locker, caption: "Cam Locks · Handles · Hasps" },
  { title: "Toilet Partition Hardware", slug: "toilet-partition-hardware", image: partition, caption: "Foot Supports · Wall Brackets" },
];

export function CategoryGrid() {

  return (
    <section className="px-5 py-8 md:px-10 md:py-12">
      <motion.div
        className="mb-6 flex items-end justify-between gap-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Explore Categories
          </p>
          <motion.h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
          >
            Categories
          </motion.h2>
        </div>

        <motion.a
          href="#"
          className="group/link inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]"
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          whileHover="hover"
        >
          <span className="relative">
            View all
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:w-full" />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:bg-foreground group-hover/link:text-background sm:h-9 sm:w-9">
            <motion.span
              variants={{
                hover: { x: 2 },
              }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.span>
          </span>
        </motion.a>
      </motion.div>

      {/* Swipeable Container on Mobile / Grid on Desktop */}
      <motion.div
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 touch-pan-x overscroll-x-contain md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
        }}
      >
        {cats.map((c) => (
          <motion.div
            key={c.title}
            data-category-card
            className="w-[84%] shrink-0 snap-start md:w-auto"
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.98 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 1, ease: EASE },
              },
            }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group relative block overflow-hidden rounded-3xl bg-secondary md:rounded-[2rem] shadow-sm border border-border/40"
            >
              <div className="overflow-hidden">
                <motion.img
                  src={c.image}
                  alt={c.title}
                  width={1000}
                  height={1300}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover select-none"
                  initial={{ scale: 1.15 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.4, ease: EASE }}
                  whileHover={{ scale: 1.06 }}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <motion.div
                className="absolute inset-x-0 bottom-0 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              >
                <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-white/80 font-medium">
                  {c.caption}
                </p>
                <h3 className="font-serif text-2xl text-white md:text-3xl">{c.title}</h3>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
