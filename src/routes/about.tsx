import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { ContactForm } from "@/components/prch/ContactForm";
import { supabase } from "@/integrations/supabase/client";
import aboutCraft from "@/assets/about-craft.jpg";
import aboutFactory from "@/assets/about-factory.jpg";
import aboutMaterials from "@/assets/about-materials.jpg";
import aboutOg from "@/assets/about-og.jpg";
import install1 from "@/assets/install-1.jpg";
import install2 from "@/assets/install-2.jpg";
import install3 from "@/assets/install-3.jpg";
import gallery1 from "@/assets/gallery-1.jpg";

const EASE = [0.22, 1, 0.36, 1] as const;

type Item = { title: string; description: string };
type Stat = { number: string; label: string };
type TL = { year: string; title: string; description: string };

type AboutContent = {
  hero_eyebrow: string; hero_title: string; hero_subtitle: string; hero_image: string | null;
  intro_eyebrow: string; intro_heading: string; intro_body: string;
  craft_eyebrow: string; craft_heading: string; craft_body: string; craft_image: string | null;
  materials_eyebrow: string; materials_heading: string; materials_image: string | null; materials: Item[];
  stats: Stat[];
  principles_eyebrow: string; principles_heading: string; principles: Item[];
  timeline_eyebrow: string; timeline_heading: string; timeline: TL[];
  closing_eyebrow: string; closing_heading: string; closing_body: string;
  closing_cta_label: string; closing_cta_href: string; closing_images: string[];
  seo_title: string | null; seo_description: string | null; og_image: string | null;
};

const FALLBACK: AboutContent = {
  hero_eyebrow: "About PRC",
  hero_title: "Precision hardware, engineered with intent.",
  hero_subtitle: "For the small parts that hold everything together — designed in detail, made to last, installed everywhere.",
  hero_image: null,
  intro_eyebrow: "Our story",
  intro_heading: "Hardware that quietly does its job — for years.",
  intro_body:
    "PRC began with a simple frustration: the fittings inside public washrooms, locker rooms and partitions were treated as an afterthought.\n\nWe set out to make hardware for these spaces the way it should be — precisely engineered, thoughtfully finished, and specified with the same care as the architecture around it.\n\nToday, PRC fittings are installed in offices, airports, schools and stadiums across the country.",
  craft_eyebrow: "The craft",
  craft_heading: "Made by hands that measure in microns.",
  craft_body:
    "Each PRC component passes through a chain of specialists — from CNC operators machining tolerances tighter than 0.05 mm, to finishers who wet-sand every visible surface by hand.\n\nNothing leaves the floor without a serialised inspection stamp.",
  craft_image: null,
  materials_eyebrow: "The materials",
  materials_heading: "Three materials. One standard.",
  materials_image: null,
  materials: [
    { title: "Stainless Steel", description: "SS-304 and SS-316 grades — corrosion-resistant, salt-air tested, brushed or mirror finish." },
    { title: "Aluminium Hardware", description: "Extruded 6063-T5 with anodised satin finish." },
    { title: "Nylon Hardware", description: "Glass-filled nylon 66 for silent operation and thermal stability." },
  ],
  stats: [
    { number: "500+", label: "Projects delivered" },
    { number: "18", label: "States shipped to" },
    { number: "0.05mm", label: "Machining tolerance" },
    { number: "10yr", label: "Standard warranty" },
  ],
  principles_eyebrow: "Principles",
  principles_heading: "The rules we don't break.",
  principles: [],
  timeline_eyebrow: "Timeline",
  timeline_heading: "A slow, deliberate build.",
  timeline: [],
  closing_eyebrow: "Get in touch",
  closing_heading: "Building something that deserves better hardware?",
  closing_body: "Send us your specs, drawings or a rough scope. We'll come back with a material and finish recommendation within 48 hours.",
  closing_cta_label: "Start an enquiry",
  closing_cta_href: "/contact",
  closing_images: [],
  seo_title: null,
  seo_description: null,
  og_image: null,
};

export const Route = createFileRoute("/about")({
  loader: async () => {
    const { getRequestOrigin } = await import("@/lib/origin.functions");
    return { origin: await getRequestOrigin() };
  },
  head: ({ loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const imageUrl = origin ? `${origin}${aboutOg}` : aboutOg;
    return {
      meta: [
        { title: "About PRC — Precision Hardware, Engineered With Intent" },
        { name: "description", content: "PRC designs and manufactures cubicle, locker and partition hardware in stainless steel, aluminium and nylon." },
        { property: "og:title", content: "About PRC — Precision Hardware" },
        { property: "og:description", content: "The craft, materials and philosophy behind PRC." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: origin ? `${origin}/about` : "/about" },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "About PRC — Precision Hardware" },
        { name: "twitter:description", content: "The craft, materials and philosophy behind PRC." },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [{ rel: "canonical", href: "/about" }],
    };
  },
  component: AboutPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

function AboutPage() {
  const [c, setC] = useState<AboutContent>(FALLBACK);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("about_page").select("*").limit(1).maybeSingle();
      if (data) {
        setC({
          ...FALLBACK,
          ...data,
          materials: data.materials?.length ? data.materials : FALLBACK.materials,
          stats: data.stats?.length ? data.stats : FALLBACK.stats,
          principles: data.principles?.length ? data.principles : FALLBACK.principles,
          timeline: data.timeline?.length ? data.timeline : FALLBACK.timeline,
          closing_images: data.closing_images ?? [],
        });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <Hero c={c} />
        <Intro c={c} />
        <Craft c={c} />
        <Materials c={c} />
        <Numbers c={c} />
        <Principles c={c} />
        <Timeline c={c} />
        <ClosingCTA c={c} />
        <ContactForm />
      </main>
      <SiteFooter />
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className={i === 0 ? "text-base md:text-lg" : ""}>{p}</p>
      ))}
    </>
  );
}

function Hero({ c }: { c: AboutContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section ref={ref} className="relative h-[85vh] min-h-[560px] w-full overflow-hidden bg-secondary">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src={c.hero_image || aboutFactory}
          alt="PRC manufacturing floor"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
      </motion.div>
      <motion.div style={{ opacity }} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          className="mb-5 text-[11px] uppercase tracking-[0.36em] text-white/80"
        >{c.hero_eyebrow}</motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          className="max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl"
        >{c.hero_title}</motion.h1>
        {c.hero_subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
            className="mt-6 max-w-xl text-sm text-white/75 md:text-base"
          >{c.hero_subtitle}</motion.p>
        )}
      </motion.div>
    </section>
  );
}

function Intro({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-12 md:px-10">
        <motion.div variants={fadeUp} className="md:col-span-5">
          <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.intro_eyebrow}</p>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">{c.intro_heading}</h2>
        </motion.div>
        <motion.div variants={fadeUp} className="space-y-6 text-muted-foreground md:col-span-7 md:pt-2">
          <Paragraphs text={c.intro_body} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Craft({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border bg-secondary/40 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:px-10">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: EASE }}
          className="relative overflow-hidden">
          <motion.img src={c.craft_image || aboutCraft} alt="" loading="lazy"
            className="h-full w-full object-cover"
            initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE }} />
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <motion.p variants={fadeUp} className="mb-4 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.craft_eyebrow}</motion.p>
          <motion.h2 variants={fadeUp} className="mb-6 font-serif text-4xl leading-tight md:text-5xl">{c.craft_heading}</motion.h2>
          <motion.div variants={fadeUp} className="space-y-4 text-muted-foreground">
            <Paragraphs text={c.craft_body} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Materials({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:px-10">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="order-2 md:order-1">
          <motion.p variants={fadeUp} className="mb-4 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.materials_eyebrow}</motion.p>
          <motion.h2 variants={fadeUp} className="mb-6 font-serif text-4xl leading-tight md:text-5xl">{c.materials_heading}</motion.h2>
          <motion.ul variants={stagger} className="space-y-6">
            {c.materials.map((m) => (
              <motion.li key={m.title} variants={fadeUp} className="border-l border-foreground/30 pl-5">
                <p className="mb-1 font-serif text-xl">{m.title}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, ease: EASE }}
          className="order-1 overflow-hidden md:order-2">
          <motion.img src={c.materials_image || aboutMaterials} alt="" loading="lazy"
            className="h-full w-full object-cover"
            initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE }} />
        </motion.div>
      </div>
    </section>
  );
}

function Numbers({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border bg-foreground py-24 text-background md:py-28">
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 md:grid-cols-4 md:px-10">
        {c.stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="text-center">
            <p className="font-serif text-5xl md:text-6xl">{s.number}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-background/60">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Principles({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: EASE }}
          className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.principles_eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl">{c.principles_heading}</h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
          {c.principles.map((it) => (
            <motion.div key={it.title} variants={fadeUp} className="bg-background p-8 md:p-10">
              <p className="mb-3 font-serif text-2xl">{it.title}</p>
              <p className="text-sm text-muted-foreground">{it.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Timeline({ c }: { c: AboutContent }) {
  return (
    <section className="border-t border-border bg-secondary/40 py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-5 md:px-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: EASE }}
          className="mb-14 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.timeline_eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl">{c.timeline_heading}</h2>
        </motion.div>
        <motion.ol variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="relative border-l border-border pl-8">
          {c.timeline.map((e, i) => (
            <motion.li key={`${e.year}-${i}`} variants={fadeUp} className="relative mb-12 last:mb-0">
              <span className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground" />
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{e.year}</p>
              <p className="mt-1 font-serif text-2xl">{e.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function ClosingCTA({ c }: { c: AboutContent }) {
  const imgs = c.closing_images.length ? c.closing_images : [install1, install2, install3, gallery1];
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mb-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {imgs.slice(0, 4).map((src, i) => (
            <motion.div key={i} variants={fadeUp} className="aspect-[3/4] overflow-hidden bg-secondary">
              <motion.img src={src} alt="" loading="lazy" className="h-full w-full object-cover"
                whileHover={{ scale: 1.06 }} transition={{ duration: 0.7, ease: EASE }} />
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: EASE }}
          className="text-center">
          {c.closing_eyebrow && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">{c.closing_eyebrow}</p>
          )}
          <h2 className="mx-auto mb-6 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">{c.closing_heading}</h2>
          {c.closing_body && (
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">{c.closing_body}</p>
          )}
          {c.closing_cta_label && (
            c.closing_cta_href.startsWith("/") ? (
              <Link to={c.closing_cta_href} className="group inline-flex items-center gap-3 border border-foreground px-6 py-3 text-[11px] uppercase tracking-[0.3em] transition-colors hover:bg-foreground hover:text-background">
                {c.closing_cta_label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.4} />
              </Link>
            ) : (
              <a href={c.closing_cta_href} className="group inline-flex items-center gap-3 border border-foreground px-6 py-3 text-[11px] uppercase tracking-[0.3em] transition-colors hover:bg-foreground hover:text-background">
                {c.closing_cta_label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.4} />
              </a>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}
