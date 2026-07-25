import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ShieldCheck, FileText, Sparkles, Scale, Clock, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";

const EASE = [0.22, 1, 0.36, 1] as const;

type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: any;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  updated_at: string;
};

// Fallback Terms & Conditions content if not yet seeded in database
const FALLBACK_TERMS = {
  title: "Terms & Conditions",
  updated_at: new Date().toISOString(),
  sections: [
    {
      heading: "1. Commercial Terms & Quotation Validity",
      body: "All quotations issued by PRC Precision Hardware / Pacific Engineering are valid for 30 calendar days from the date of issue. Prices quoted are exclusive of GST and freight charges unless explicitly stated in the formal proforma invoice.",
    },
    {
      heading: "2. Order Acceptance & Material Specifications",
      body: "An order is deemed accepted upon receipt of written purchase order (PO) or advance payment. PRC reserves the right to make minor technical refinements to hardware dimensions without compromising structural integrity or visual design.",
    },
    {
      heading: "3. 2-Year Hardware Warranty Coverage",
      body: "Every piece of PRC architectural hardware (SS304, SS316, Aluminium, Nylon, and Brass) is backed by our official 2-Year Full Replacement Guarantee. Warranty covers structural cracking, spring mechanism failure, and corrosion in wet restroom environments.",
    },
    {
      heading: "4. Pan-India Delivery & Freight Logistics",
      body: "Dispatches are handled via accredited national logistics partners. Risk of loss passes to the buyer upon handover to the carrier. Transit insurance for high-value commercial shipments is available upon written request.",
    },
    {
      heading: "5. Return & Replacement Policy",
      body: "Standard catalog items in original un-opened packaging may be returned within 14 days of receipt subject to a 15% restocking fee. Custom PVD coated finishes or bespoke sized profiles are non-returnable once production commences.",
    },
    {
      heading: "6. Limitation of Liability & Governing Law",
      body: "PRC's total liability for any claim shall not exceed the invoice value of the affected hardware components. All disputes are subject to the exclusive jurisdiction of courts in Noida / New Delhi, India.",
    },
  ],
};

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — PRC Architectural Hardware" },
      {
        name: "description",
        content:
          "Official Terms and Conditions for PRC Precision Hardware sales, quotations, 2-Year warranty, commercial orders, and Pan-India dispatches.",
      },
      { property: "og:title", content: "Terms & Conditions — PRC Hardware" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  // Query Supabase cms_pages table for dynamic admin content
  const { data: dbPage } = useQuery({
    queryKey: ["cms-page", "terms-and-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("slug", "terms-and-conditions")
        .maybeSingle();
      if (error) throw error;
      return data as CmsPage | null;
    },
  });

  const title = dbPage?.title || FALLBACK_TERMS.title;
  const updatedAt = dbPage?.updated_at
    ? new Date(dbPage.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "24 July 2026";

  // Parse content if stored as JSON or string from Admin CMS
  const content = dbPage?.content;
  let sections: Array<{ heading: string; body: string }> = FALLBACK_TERMS.sections;

  if (content) {
    if (typeof content === "object" && Array.isArray(content.sections)) {
      sections = content.sections;
    } else if (typeof content === "string" && content.trim().length > 0) {
      sections = [{ heading: "Terms & Conditions Guidelines", body: content }];
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-secondary/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="max-w-3xl"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
                <Scale className="h-3.5 w-3.5 text-amber-500" />
                Legal & Commercial Governance
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-tight">
                {title}
              </h1>

              <p className="mt-4 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Last updated on {updatedAt} · Admin Verified Document
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Body Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 md:px-10 py-16 sm:py-24">
          <div className="space-y-10">
            {sections.map((sec, i) => (
              <motion.div
                key={sec.heading || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
                className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm"
              >
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground border-b border-border/60 pb-3">
                  {sec.heading}
                </h2>
                <p className="mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {sec.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
