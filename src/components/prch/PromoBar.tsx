import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PromoBar() {
  const [open, setOpen] = useState(true);

  const { data: dbItems } = useQuery({
    queryKey: ["prc-promobar-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("title")
        .eq("type", "announcement")
        .neq("status", "disabled")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (!open) return null;

  const defaultMessages = [
    "Free Pan-India Delivery on Bulk Orders over ₹10,000",
    "10-Year Warranty on Grade 304 Stainless Steel Hardware",
    "Architectural Specification Catalog Available for Download",
  ];

  const fetchedMessages = (dbItems ?? [])
    .map((d) => d.title)
    .filter(Boolean) as string[];

  const messages = fetchedMessages.length > 0 ? fetchedMessages : defaultMessages;

  // Duplicate messages 6 times for seamless endless scrolling without gaps
  const loop = [...messages, ...messages, ...messages, ...messages, ...messages, ...messages];

  return (
    <div className="relative overflow-hidden border-b border-border bg-foreground text-background">
      <div className="flex whitespace-nowrap py-2.5 animate-[marquee_35s_linear_infinite]">
        {loop.map((m, i) => (
          <span
            key={i}
            className="mx-8 text-[11px] uppercase tracking-[0.22em] font-medium"
          >
            {m} <span className="ml-8 opacity-40">•</span>
          </span>
        ))}
      </div>
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        suppressHydrationWarning
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 transition hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
