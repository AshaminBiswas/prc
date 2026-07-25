import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;

type Sector = "All" | "Corporate" | "Hospitality" | "Education" | "Transit" | "Retail";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  sector: string;
  year: string;
  scope: string;
  gallery: string[] | null;
  grid_span: string;
};

const sectors: Sector[] = ["All", "Corporate", "Hospitality", "Education", "Transit", "Retail"];

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — PRC Precision Hardware" },
      { name: "description", content: "Selected PRC installations across corporate, hospitality, education, transit and retail spaces — cubicle, locker and partition hardware in stainless steel, aluminium and nylon." },
      { property: "og:title", content: "Projects — PRC Precision Hardware" },
      { property: "og:description", content: "Selected PRC hardware installations across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [active, setActive] = useState<Sector>("All");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, location, sector, year, scope, gallery, grid_span")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
  });

  const filtered = useMemo(
    () => (active === "All" ? projects : projects.filter((p) => p.sector === active)),
    [active, projects],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <section className="border-b border-border px-5 pb-16 pt-20 md:px-10 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-6xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mb-4 text-[11px] uppercase tracking-[0.32em] text-muted-foreground"
            >Projects</motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              className="max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl"
            >Precision hardware, installed at scale.</motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              className="mt-6 max-w-2xl text-muted-foreground"
            >
              A selection of PRC installations across offices, transit hubs, schools, gyms, hotels and retail
              flagships. Every project engineered for daily use and finished to last.
            </motion.p>
          </div>
        </section>

        <section className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-4 md:px-10">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`shrink-0 border px-4 py-2 text-[11px] uppercase tracking-[0.24em] transition ${
                  active === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >{s}</button>
            ))}
          </div>
        </section>

        <section className="px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-6xl auto-rows-[280px] grid-cols-1 gap-4 md:auto-rows-[360px] md:grid-cols-3 md:gap-6">
            {filtered.map((p, i) => {
              const cover = p.gallery?.[0];
              return (
                <motion.article
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease: EASE, delay: (i % 6) * 0.05 }}
                  className={`group relative overflow-hidden bg-secondary ${
                    p.grid_span === "wide" ? "md:col-span-2" : ""
                  } ${p.grid_span === "tall" ? "md:row-span-2" : ""}`}
                >
                  <Link
                    to="/projects/$slug"
                    params={{ slug: p.slug }}
                    className="block h-full w-full"
                    aria-label={p.title}
                  >
                    {cover ? (
                      <img
                        src={cover} alt={p.title} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/70">
                        <span>{p.sector}</span><span>·</span><span>{p.year}</span>
                      </div>
                      <h2 className="font-serif text-2xl text-white md:text-3xl">{p.title}</h2>
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/80">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.4} />{p.location}
                      </div>
                      <p className="mt-3 max-w-md text-[13px] text-white/70">{p.scope}</p>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>

          {!isLoading && filtered.length === 0 && (
            <p className="py-24 text-center text-muted-foreground">No projects in this sector yet.</p>
          )}
          {isLoading && (
            <p className="py-24 text-center text-muted-foreground">Loading projects…</p>
          )}
        </section>

        <section className="border-t border-border px-5 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">Have a project?</p>
              <h3 className="max-w-2xl font-serif text-4xl md:text-5xl">
                Let's engineer the hardware for your next space.
              </h3>
            </div>
            <Link
              to="/book-appointment"
              className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-6 py-4 text-[11px] uppercase tracking-[0.28em] text-background transition hover:bg-background hover:text-foreground"
            >
              Book an appointment
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.4} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
