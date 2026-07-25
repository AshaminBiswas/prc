import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  title: string;
  subtitle?: string | null;
  button_link?: string | null;
};

const defaultAnnouncements: Announcement[] = [
  {
    id: "def-1",
    title: "Free Pan-India Delivery on Bulk Orders over ₹10,000",
    subtitle: "EXCLUSIVE OFFER",
    button_link: "/contact",
  },
  {
    id: "def-2",
    title: "10-Year Warranty on Grade 304 Stainless Steel Hardware",
    subtitle: "PRC QUALITY",
    button_link: "/category/cubicle-hardware",
  },
  {
    id: "def-3",
    title: "Architectural Specification Catalog Now Available for Download",
    subtitle: "NEW CATALOG",
    button_link: "/about",
  },
];

export function AnnouncementBar() {
  const { data: dbItems } = useQuery({
    queryKey: ["prc-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, button_link")
        .eq("type", "announcement")
        .neq("status", "disabled")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const announcements: Announcement[] = (() => {
    if (dbItems && dbItems.length > 0) {
      return dbItems.map((item) => ({
        id: item.id,
        title: item.title ?? "",
        subtitle: item.subtitle,
        button_link: item.button_link,
      }));
    }
    return defaultAnnouncements;
  })();

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500); // Auto slide every 4.5 seconds
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const active = announcements[currentIndex];

  const content = (
    <div className="flex items-center justify-center gap-2 transition-all duration-500 ease-in-out">
      {active.subtitle && (
        <span className="rounded-full bg-[#F6EBD5]/20 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#F6EBD5]">
          {active.subtitle}
        </span>
      )}
      <span className="text-[11px] sm:text-xs font-medium tracking-wide text-[#F6EBD5] line-clamp-1">
        {active.title}
      </span>
      <Sparkles className="h-3 w-3 shrink-0 text-[#F6EBD5]/70 hidden sm:inline-block" />
    </div>
  );

  return (
    <div className="relative w-full bg-black text-[#F6EBD5] border-b border-white/10 px-8 py-2 overflow-hidden select-none">
      <div className="mx-auto max-w-7xl flex items-center justify-center text-center">
        {active.button_link ? (
          <Link to={active.button_link as never} className="hover:underline">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      {announcements.length > 1 && (
        <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
            className="pointer-events-auto p-1 text-[#F6EBD5]/60 hover:text-[#F6EBD5] transition-colors"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="pointer-events-auto p-1 text-[#F6EBD5]/60 hover:text-[#F6EBD5] transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
