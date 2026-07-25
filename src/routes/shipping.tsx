import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Truck, Package, Globe2, MapPin, Clock, PackageCheck } from "lucide-react";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { TrackOrderWidget } from "@/components/prch/TrackOrderWidget";


export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — PRC Precision Hardware" },
      {
        name: "description",
        content:
          "PRC shipping policy — pan-India delivery timelines, bulk freight, international export, packaging standards and order tracking.",
      },
      { property: "og:title", content: "Shipping & Delivery — PRC" },
      {
        property: "og:description",
        content:
          "Delivery zones, timelines and packaging for PRC cubicle, locker and toilet partition hardware. Pan-India and international freight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

const EASE = [0.22, 1, 0.36, 1] as const;

const zones = [
  { region: "Metro Cities", eta: "2 – 4 business days", detail: "Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad." },
  { region: "Tier 2 & 3 Cities", eta: "4 – 7 business days", detail: "State capitals and industrial hubs across India via trusted logistics partners." },
  { region: "Remote & Northeast", eta: "7 – 12 business days", detail: "Serviceable via surface freight; some pin codes may require additional handling." },
  { region: "International Export", eta: "15 – 30 business days", detail: "GCC, SE Asia, Africa and EU via sea/air freight. Custom quotes for bulk B2B orders." },
];

const highlights = [
  { icon: Package, title: "Industrial Packaging", body: "Double-walled cartons with foam inserts and corner protectors. Rated for freight handling." },
  { icon: PackageCheck, title: "QC Before Dispatch", body: "Every order is unit-verified against your PO and photographed before it leaves the warehouse." },
  { icon: Truck, title: "Freight Partners", body: "Delhivery, Blue Dart, VRL and DTDC for domestic. Maersk & DHL for international." },
  { icon: Globe2, title: "Global Reach", body: "Exporting to 12+ countries with full CHA support and export documentation." },
];

function ShippingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground"
          >
            Logistics
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
            className="mt-4 font-serif text-4xl md:text-6xl"
          >
            Shipping & Delivery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Pan-India delivery on every order. Industrial-grade packaging,
            insured freight and real-time tracking — from our warehouse to your
            site.
          </motion.p>
        </div>
      </section>

      <TrackOrderWidget />



      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <h2 className="font-serif text-2xl md:text-3xl">Delivery Zones</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {zones.map((z, i) => (
              <motion.div
                key={z.region}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                className="rounded-tr-3xl rounded-bl-3xl border border-border bg-card p-8"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" strokeWidth={1.4} />
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    {z.region}
                  </p>
                </div>
                <p className="mt-6 font-serif text-2xl">{z.eta}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{z.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <h2 className="font-serif text-2xl md:text-3xl">How We Ship</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
              >
                <h.icon className="h-6 w-6" strokeWidth={1.4} />
                <p className="mt-6 font-serif text-xl">{h.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-background/70">{h.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl">Order Processing</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Retail orders dispatch within 24 – 48 hours of payment confirmation.
                Bulk B2B orders enter production scheduling with a confirmed dispatch
                window shared over email within 2 business days.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl">Tracking</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A tracking link is shared over email and SMS once your order is
                handed to the carrier. Logged-in customers can also track live status
                from their account dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <div className="rounded-tr-3xl rounded-bl-3xl border border-border bg-card p-10 md:p-14">
            <Clock className="h-6 w-6" strokeWidth={1.4} />
            <p className="mt-6 font-serif text-2xl md:text-3xl">Need a custom freight quote?</p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              For bulk orders, project deliveries or international export, our
              logistics team can arrange dedicated freight with insurance and
              scheduled unloading.
            </p>
            <a
              href="/book-appointment"
              className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-[12px] uppercase tracking-[0.28em]"
            >
              Request a Quote
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
