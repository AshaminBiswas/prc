import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Slide = {
  id: string;
  image: string;
  tablet_image?: string | null;
  mobile_image?: string | null;
  eyebrow: string;
  title: string;
  description?: string | null;
  cta: string;
  cta_link?: string | null;
};

export function HeroSlider() {
  const { data: dbSlides, isLoading } = useQuery({
    queryKey: ["prc-hero-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, description, image_url, tablet_image_url, mobile_image_url, button_text, button_link, status, type")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const slides: Slide[] = (dbSlides ?? [])
    .filter((b) => {
      if (!b.image_url) return false;
      if (b.status === "disabled") return false;
      const type = (b.type ?? "homepage_hero").toLowerCase();
      return type === "homepage_hero" || type === "hero" || type === "" || type === "null";
    })
    .slice(0, 6)
    .map((b) => ({
      id: b.id,
      image: b.image_url!,
      tablet_image: b.tablet_image_url,
      mobile_image: b.mobile_image_url,
      eyebrow: b.subtitle ?? "PRC Hardware",
      title: b.title ?? "Precision Engineering",
      description: b.description,
      cta: b.button_text || "Explore Range",
      cta_link: b.button_link || "/category/cubicle-hardware",
    }));

  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const prev = () => setI((n) => (n - 1 + slides.length) % slides.length);
  const next = () => setI((n) => (n + 1) % slides.length);

  if (isLoading) {
    return (
      <section className="relative h-[calc(100vh-6.5rem)] min-h-[520px] w-full animate-pulse bg-muted" />
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative flex h-[calc(100vh-6.5rem)] min-h-[480px] w-full flex-col items-center justify-center bg-muted/30 px-6 text-center border-b border-border">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-4">
          <ImageIcon className="h-8 w-8" />
        </div>
        <h2 className="font-serif text-3xl font-normal text-foreground md:text-4xl">PRC Hardware Banners</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          No hero section slides have been published yet. Upload hero banners directly from your device in the Admin Panel under <strong>Banners / Media → Hero Section</strong>.
        </p>
        <Link
          to="/admin/banners"
          className="mt-6 border border-foreground bg-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-background transition hover:bg-transparent hover:text-foreground"
        >
          Manage Hero Banners
        </Link>
      </section>
    );
  }

  return (
    <section className="relative h-[calc(100vh-6.5rem)] min-h-[520px] w-full overflow-hidden bg-secondary">
      {slides.map((s, idx) => (
        <div
          key={s.id + idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          aria-hidden={idx !== i}
        >
          <picture className="h-full w-full">
            {s.mobile_image && <source media="(max-width: 640px)" srcSet={s.mobile_image} />}
            {s.tablet_image && <source media="(max-width: 1024px)" srcSet={s.tablet_image} />}
            <img
              src={s.image}
              alt={s.title}
              width={1920}
              height={800}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === 0 ? "high" : "low"}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full px-6 pb-12 sm:pb-16 md:px-12 md:pb-20">
              <p className="mb-2 sm:mb-3 text-[11px] uppercase tracking-[0.32em] text-white/85">
                {s.eyebrow}
              </p>
              <h1 className="mb-4 max-w-2xl font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-white">
                {s.title}
              </h1>
              {s.description && (
                <p className="mb-6 max-w-xl text-xs sm:text-sm text-white/80 line-clamp-2">{s.description}</p>
              )}
              {s.cta_link ? (
                <Link
                  to={s.cta_link as never}
                  className="inline-block border border-white/80 bg-transparent px-8 py-3 text-[11px] uppercase tracking-[0.28em] text-white transition hover:bg-white hover:text-foreground"
                >
                  {s.cta}
                </Link>
              ) : (
                <button className="border border-white/80 bg-transparent px-8 py-3 text-[11px] uppercase tracking-[0.28em] text-white transition hover:bg-white hover:text-foreground">
                  {s.cta}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 p-2 text-white/80 transition hover:text-white"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.2} />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 p-2 text-white/80 transition hover:text-white"
          >
            <ChevronRight className="h-8 w-8" strokeWidth={1.2} />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-[3px] w-8 transition ${idx === i ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
