import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, MapPin, Calendar, Layers } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;

type ProjectDetail = {
  id: string;
  slug: string;
  title: string;
  location: string;
  sector: string;
  year: string;
  scope: string;
  description: string | null;
  gallery: string[] | null;
  related_sectors: string[] | null;
};

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — PRC Projects` },
      { name: "description", content: "PRC installation project — precision hardware in use." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — PRC Projects` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/projects/${params.slug}` }],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { slug } = Route.useParams();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, location, sector, year, scope, description, gallery, related_sectors")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as ProjectDetail;
    },
  });

  const { data: related = [] } = useQuery({
    enabled: !!project,
    queryKey: ["project-related", project?.id, project?.sector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, location, sector, year, gallery")
        .eq("is_published", true)
        .eq("sector", project!.sector)
        .neq("id", project!.id)
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PromoBar /><SiteHeader />
        <p className="py-40 text-center text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <PromoBar /><SiteHeader />
        <div className="py-40 text-center">
          <p className="mb-4 text-muted-foreground">Project not found.</p>
          <Link to="/projects" className="text-sm underline">Back to projects</Link>
        </div>
      </div>
    );
  }

  const gallery = project.gallery ?? [];
  const cover = gallery[0];
  const rest = gallery.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative">
          {cover && (
            <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden md:h-[75vh]">
              <motion.img
                initial={{ scale: 1.08, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: EASE }}
                src={cover} alt={project.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-10 md:px-10 md:pb-16">
                <div className="mx-auto max-w-6xl">
                  <Link to="/projects" className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/80 hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> All projects
                  </Link>
                  <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-white/70">
                    {project.sector} · {project.year}
                  </p>
                  <motion.h1
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                    className="max-w-4xl font-serif text-4xl leading-[1.05] text-white md:text-6xl"
                  >{project.title}</motion.h1>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-white/80">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.4} />{project.location}</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" strokeWidth={1.4} />{project.year}</span>
                    <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" strokeWidth={1.4} />{project.sector}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Meta + description */}
        <section className="border-b border-border px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
            <aside className="space-y-6 text-sm md:col-span-1">
              <Meta label="Location" value={project.location} />
              <Meta label="Sector" value={project.sector} />
              <Meta label="Year" value={project.year} />
              <Meta label="Scope" value={project.scope} />
              {project.related_sectors && project.related_sectors.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Related</p>
                  <div className="flex flex-wrap gap-2">
                    {project.related_sectors.map((t) => (
                      <span key={t} className="border border-border px-3 py-1 text-[11px] uppercase tracking-[0.22em]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
            <div className="md:col-span-2">
              <h2 className="mb-6 font-serif text-3xl md:text-4xl">Project overview</h2>
              <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {project.description || project.scope}
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        {rest.length > 0 && (
          <section className="px-5 py-16 md:px-10 md:py-24">
            <div className="mx-auto max-w-6xl">
              <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">Gallery</p>
              <h3 className="mb-10 font-serif text-3xl md:text-4xl">A closer look</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {rest.map((src, i) => (
                  <motion.div
                    key={src + i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: EASE, delay: (i % 4) * 0.06 }}
                    className={`overflow-hidden bg-secondary ${i === 0 && rest.length > 2 ? "md:col-span-2" : ""}`}
                  >
                    <img src={src} alt={`${project.title} — ${i + 2}`} loading="lazy" className="h-full w-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-border px-5 py-16 md:px-10 md:py-24">
            <div className="mx-auto max-w-6xl">
              <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">More in {project.sector}</p>
              <h3 className="mb-10 font-serif text-3xl md:text-4xl">Related projects</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                {related.map((r) => {
                  const rg = (r.gallery as string[] | null) ?? [];
                  return (
                  <Link
                    key={r.id}
                    to="/projects/$slug"
                    params={{ slug: r.slug }}
                    className="group relative block aspect-[4/3] overflow-hidden bg-secondary"
                  >
                    {rg[0] && (
                      <img src={rg[0]} alt={r.title} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">{r.sector} · {r.year}</p>
                      <h4 className="mt-1 font-serif text-xl text-white">{r.title}</h4>
                      <p className="mt-1 text-[12px] text-white/70">{r.location}</p>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-border px-5 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <h3 className="max-w-2xl font-serif text-4xl md:text-5xl">Ready to spec your project?</h3>
            <Link to="/book-appointment"
              className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-6 py-4 text-[11px] uppercase tracking-[0.28em] text-background transition hover:bg-background hover:text-foreground">
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
      <p className="text-[14px]">{value}</p>
    </div>
  );
}
