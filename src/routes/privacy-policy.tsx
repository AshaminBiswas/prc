import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ShieldCheck, Lock, Clock, Sparkles } from "lucide-react";
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

// Fallback Privacy Policy content if not yet seeded in database
const FALLBACK_PRIVACY = {
  title: "Privacy Policy",
  updated_at: new Date().toISOString(),
  sections: [
    {
      heading: "1. Information We Collect",
      body: "We collect information you provide directly when requesting quotations, placing orders, creating customer accounts, booking appointments, or submitting contact inquiries. This includes your name, company/firm name, email address, phone number, shipping address, and project specifications.",
    },
    {
      heading: "2. Use of Collected Information",
      body: "Your information is used strictly to process commercial hardware orders, issue 2-Year Warranty Certificates, schedule factory visits, deliver shipments, and respond to technical architectural inquiries. We do not sell or rent customer data to third-party marketing companies.",
    },
    {
      heading: "3. SSL Data Security & Encryption",
      body: "All transmissions between your web browser and the PRC website are encrypted using industry-standard 256-bit Transport Layer Security (TLS/SSL). Authentication credentials and customer database records are stored inside encrypted database vaults.",
    },
    {
      heading: "4. Cookies & Web Analytics",
      body: "We use essential cookies to maintain your shopping cart session, active user login state, and website preferences. Minimal anonymised analytical cookies help us optimize catalog browsing performance.",
    },
    {
      heading: "5. Third-Party Service Providers",
      body: "We share essential data with verified logistical dispatch partners (couriers/freight operators) solely for physical order delivery, and with secure payment gateways for processing encrypted transactions.",
    },
    {
      heading: "6. Your Data Rights & Contact",
      body: "You have the right to request access to, correction of, or deletion of your personal data from our systems. For privacy inquiries or data requests, contact our Compliance Desk at privacy@prchhardware.com.",
    },
  ],
};

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PRC Architectural Hardware" },
      {
        name: "description",
        content:
          "PRC Hardware Privacy Policy detailing customer data security, SSL encryption, warranty certificate records, and privacy rights.",
      },
      { property: "og:title", content: "Privacy Policy — PRC Hardware" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  // Query Supabase cms_pages table for dynamic admin content
  const { data: dbPage } = useQuery({
    queryKey: ["cms-page", "privacy-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("slug", "privacy-policy")
        .maybeSingle();
      if (error) throw error;
      return data as CmsPage | null;
    },
  });

  const title = dbPage?.title || FALLBACK_PRIVACY.title;
  const updatedAt = dbPage?.updated_at
    ? new Date(dbPage.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "24 July 2026";

  // Parse content if stored as JSON or string from Admin CMS
  const content = dbPage?.content;
  let sections: Array<{ heading: string; body: string }> = FALLBACK_PRIVACY.sections;

  if (content) {
    if (typeof content === "object" && Array.isArray(content.sections)) {
      sections = content.sections;
    } else if (typeof content === "string" && content.trim().length > 0) {
      sections = [{ heading: "Privacy Protection Policy", body: content }];
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
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                Data Protection & Privacy Guarantee
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
