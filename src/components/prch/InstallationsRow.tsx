import { useRef } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  sector: string;
  gallery: string[] | null;
};

const SKELETON_COUNT = 5;

function SkeletonCard() {
  return (
    <div className="w-[58vw] max-w-[280px] flex-none snap-start overflow-hidden bg-secondary sm:w-[42vw] sm:max-w-none md:w-[30vw] lg:w-[24vw] xl:w-[22vw]">
      <div className="aspect-square w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-10 text-center md:px-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/50">
        <ImageOff className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 font-serif text-xl">No installations yet</h3>
      <p className="text-sm text-muted-foreground">
        Real-world installations across offices, gyms, schools and public spaces will appear here.
      </p>
    </div>
  );
}

export function InstallationsRow() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: installs = [], isLoading } = useQuery({
    queryKey: ["projects", "installations-row"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, location, sector, gallery")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
  });

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden border-t border-border py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl px-5 text-center md:px-10">
        <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          In Use
        </p>
        <h2 className="mb-4 font-serif text-4xl md:text-5xl">Installed Worldwide</h2>
        <p className="text-muted-foreground">
          Real installations across offices, gyms, schools and public spaces.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 pb-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em]">Loading installations</span>
        </div>
      ) : installs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-4 touch-pan-x overscroll-x-contain md:gap-6 md:px-10"
            style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
          >
            {installs.map((it) => {
              const cover = it.gallery?.[0];
              return (
                <Link
                  key={it.id}
                  to="/projects/$slug"
                  params={{ slug: it.slug }}
                  data-card
                  className="group relative block w-[75vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-tr-3xl rounded-bl-3xl bg-secondary sm:w-[46vw] sm:max-w-none md:w-[31vw] lg:w-[23vw]"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={it.title}
                      loading="lazy"
                      draggable={false}
                      className="aspect-square w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">
                        {it.sector}
                      </p>
                      <p className="mt-1 font-serif text-lg text-white">{it.location}</p>
                    </div>
                    <span className="border border-white/80 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-white transition group-hover:bg-white group-hover:text-foreground">
                      View
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {installs.length > 0 && (
            <>
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Previous installations"
                className="absolute left-2 top-1/2 hidden -translate-y-1/2 border border-border bg-background/90 p-2 backdrop-blur transition hover:bg-foreground hover:text-background md:block"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.2} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Next installations"
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 border border-border bg-background/90 p-2 backdrop-blur transition hover:bg-foreground hover:text-background md:block"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.2} />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
