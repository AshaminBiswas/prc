import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Truck, Award, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BannerSlide = {
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

// Default high-end luxury fallback slides
const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: "fallback-1",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "NEW ARRIVALS 2026",
    title: "Precision Engineering Meets Modern Luxury",
    description: "Discover our latest architectural hardware releases, crafted from solid brass & satin steel.",
    cta: "Explore Releases",
    cta_link: "#products-grid",
  },
  {
    id: "fallback-2",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "ARCHITECTURAL NOVELTIES",
    title: "Minimalist Partition Systems",
    description: "State-of-the-art cubicle hinges, indicator locks, and heavy-duty glass fittings.",
    cta: "View Collection",
    cta_link: "#products-grid",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function NewArrivalsHeroBanner() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  // Fetch active promo code created by admin from database
  const { data: activeAdminOffer } = useQuery({
    queryKey: ["hero-active-offer"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("name")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.name?.toUpperCase() || null;
    },
  });

  const { data: dbSlides } = useQuery({
    queryKey: ["hero-banner-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, description, image_url, tablet_image_url, mobile_image_url, button_text, button_link, status, type, display_order")
        .eq("status", "active")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const bannerSlides: BannerSlide[] = (dbSlides ?? [])
    .filter((b) => {
      if (!b.image_url) return false;
      const type = (b.type ?? "").toLowerCase();
      return type === "new_arrivals" || type === "newarrivals" || type === "homepage_hero";
    })
    .map((b) => ({
      id: b.id,
      image: b.image_url!,
      tablet_image: b.tablet_image_url,
      mobile_image: b.mobile_image_url,
      eyebrow: b.subtitle || "NEW RELEASE",
      title: b.title || "Next-Gen Architectural Hardware",
      description: b.description,
      cta: b.button_text || "Shop New Release",
      cta_link: b.button_link || "#products-grid",
    }));

  const slidesToRender = bannerSlides.length > 0 ? bannerSlides : FALLBACK_SLIDES;

  // Auto slide every 5.5 seconds
  useEffect(() => {
    if (isPaused || slidesToRender.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slidesToRender.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, slidesToRender.length]);

  const current = slidesToRender[index % slidesToRender.length];

  function copyPromoCode() {
    if (!activeAdminOffer) return;
    navigator.clipboard.writeText(activeAdminOffer);
    setCopied(true);
    toast.success(`Promo code '${activeAdminOffer}' copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 pt-4 pb-2">
      {/* 1. Compact Floating Hero Banner Container (Reduced Height) */}
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-foreground text-background shadow-xl border border-foreground/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Reduced Compact Height: 320px on Mobile, 380px on Tablet, 420px on Desktop */}
        <div className="relative h-[320px] sm:h-[380px] md:h-[420px] w-full">
          {/* Background Image Carousel with Parallax / Scale Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="absolute inset-0 z-0"
            >
              <picture>
                {current.mobile_image && <source media="(max-width: 640px)" srcSet={current.mobile_image} />}
                {current.tablet_image && <source media="(max-width: 1024px)" srcSet={current.tablet_image} />}
                <img
                  src={current.image}
                  alt={current.title}
                  className="h-full w-full object-cover select-none brightness-[0.58]"
                />
              </picture>
              {/* Radial Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Banner Text Overlay */}
          <div className="relative z-10 flex h-full max-w-3xl flex-col justify-center px-6 sm:px-10 md:px-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + "-text"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
                className="text-left"
              >
                {/* Eyebrow & Promo Code Pill */}
                <div className="mb-3.5 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300 backdrop-blur-md border border-amber-500/30">
                    <Sparkles className="h-3 w-3" />
                    {current.eyebrow}
                  </div>


                </div>

                {/* Main Heading */}
                <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium leading-tight text-white tracking-tight">
                  {current.title}
                </h1>

                {/* Subtitle Tagline */}
                {current.description && (
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/80 line-clamp-2 max-w-lg">
                    {current.description}
                  </p>
                )}

                {/* CTA Button */}
                <div className="mt-6 flex items-center gap-3">
                  {current.cta_link?.startsWith("#") ? (
                    <a
                      href={current.cta_link}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-md"
                    >
                      {current.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link
                      to={current.cta_link || "/category/cubicle-hardware"}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-md"
                    >
                      {current.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Controls */}
          {slidesToRender.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev - 1 + slidesToRender.length) % slidesToRender.length)}
                aria-label="Previous Banner"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % slidesToRender.length)}
                aria-label="Next Banner"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {slidesToRender.length > 1 && (
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5">
              {slidesToRender.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Added Value Feature Strip right below the Compact Banner */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">100% Genuine PRC</p>
            <p className="text-[10px] text-muted-foreground">Solid Brass & SS304</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">Express Pan-India</p>
            <p className="text-[10px] text-muted-foreground">Dispatched in 24 Hrs</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">2-Year Warranty</p>
            <p className="text-[10px] text-muted-foreground">Anti-Corrosion Shield</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">Architect Approved</p>
            <p className="text-[10px] text-muted-foreground">Commercial Grade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
