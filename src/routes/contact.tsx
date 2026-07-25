import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Phone, MapPin, Clock, ArrowRight, MessageCircle, Copy, Check, ChevronDown, Sparkles, Building2, ShieldCheck, Factory } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { ContactForm } from "@/components/prch/ContactForm";
import contactOg from "@/assets/contact-og.jpg";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const { getRequestOrigin } = await import("@/lib/origin.functions");
    return { origin: await getRequestOrigin() };
  },
  head: ({ loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const imageUrl = origin ? `${origin}${contactOg}` : contactOg;
    return {
      meta: [
        { title: "Contact PRC — Architectural Precision Hardware Enquiries" },
        {
          name: "description",
          content:
            "Connect with PRC Hardware for cubicle, locker, glass fittings, and toilet partition hardware. Bulk quotations, CAD drawings, and technical specification support.",
        },
        { property: "og:title", content: "Contact PRC — Precision Hardware Enquiries" },
        {
          property: "og:description",
          content:
            "Send PRC your hardware specs, bulk enquiry, or project question. Our hardware engineers reply within 24 hours.",
        },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: "/contact" }],
    };
  },
  component: ContactPage,
});

const FAQS = [
  {
    q: "How fast can PRC fulfill bulk commercial hardware orders?",
    a: "Standard catalog items (SS304 & Nylon partition fittings, indicator locks, legs, and hinges) are dispatched within 24–48 hours from our central warehouse. Custom PVD coated finishes or bespoke hardware dimensions typically ship within 7–10 working days.",
  },
  {
    q: "Do you provide CAD files & 3D BIM models for architects?",
    a: "Yes! We provide complete 2D CAD blocks (.DWG) and 3D Revit BIM models for our entire partition hardware range. Contact our support team or request specs through the form to receive the architect specification kit.",
  },
  {
    q: "What is the warranty coverage on PRC Solid Brass & SS304 fittings?",
    a: "All PRC Grade 304 Stainless Steel and Solid Brass fittings carry a 10-Year Mechanical & Anti-Corrosion Warranty. Every batch undergoes rigorous 48-hour salt spray testing to guarantee zero rusting in high-moisture restroom environments.",
  },
  {
    q: "Can I request physical sample boxes for ongoing commercial projects?",
    a: "Absolutely. We supply complimentary physical sample kits containing finish chips, hinge assemblies, and indicator locks to registered architects, interior designers, and commercial project builders.",
  },
  {
    q: "Do you manufacture custom PVD finishes to match specific interior themes?",
    a: "Yes! We specialize in PVD vacuum ion plating including Matt Black, Brushed Gold, Rose Gold, Antique Brass, and Satin Copper finishes tailored for premium hotel & corporate washroom designs.",
  },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <HeroSection />
        <ContactCardsSection />
        <ContactForm />
        <LocationMapSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}

/* 1. Hero Section */
function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-secondary/40 py-20 sm:py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="max-w-3xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Connect With PRC
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.05]">
            Let's Engineer Your Vision.
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            Whether you're specifying hardware for a commercial high-rise, requesting bulk project pricing, or needing custom PVD finishes — our engineering team is at your service.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/919876543210?text=Hi%20PRC%20Hardware%2C%20I%20would%20like%20to%20enquire%20about%20architectural%20hardware."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Support
            </a>

            <a
              href="#contact-form"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md"
            >
              Request Specs & Quote
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* 2. Contact Info Cards Section */
function ContactCardsSection() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  const cards = [
    {
      icon: Phone,
      title: "Direct Phone & Sales",
      mainText: "+91 98765 43210",
      subText: "Mon–Sat: 9:00 AM – 6:30 PM IST",
      copyValue: "+919876543210",
      actionText: "Call Sales Team",
      actionHref: "tel:+919876543210",
    },
    {
      icon: Mail,
      title: "Email Support",
      mainText: "hello@prchhardware.com",
      subText: "General & Project Quote Inquiries",
      copyValue: "hello@prchhardware.com",
      actionText: "Send Email",
      actionHref: "mailto:hello@prchhardware.com",
    },
    {
      icon: Building2,
      title: "Head Office & Experience Center",
      mainText: "Industrial Estate, Sector 63",
      subText: "Noida, UP 201301, India",
      copyValue: "PRC Hardware, Industrial Estate, Sector 63, Noida, UP 201301, India",
      actionText: "Get Directions",
      actionHref: "https://maps.google.com/?q=Sector+63+Noida",
    },
    {
      icon: Factory,
      title: "Manufacturing Plant & Logistics",
      mainText: "PRC Precision Works Unit",
      subText: "Dispatch & Freight Handling Desk",
      copyValue: "PRC Precision Works Unit, Industrial Estate, Sector 63, Noida, UP",
      actionText: "Contact Dispatch",
      actionHref: "mailto:logistics@prchhardware.com",
    },
  ];

  return (
    <section className="border-b border-border py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {card.title}
                </p>
                <h3 className="mt-2 font-serif text-lg font-medium text-foreground leading-snug">
                  {card.mainText}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.subText}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
                <a
                  href={card.actionHref}
                  target={card.actionHref.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  {card.actionText}
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(card.copyValue, card.title)}
                  title="Copy details"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                >
                  {copiedKey === card.title ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 3. Location & Map Embed Section */
function LocationMapSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Showroom & Factory
            </div>

            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight">
              Visit Our Experience Center
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Examine our full collection of cubicle fittings, glass hardware, and PVD finishes in person. Schedule a factory walkthrough with our senior engineers.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Working Hours: Mon – Sat, 9:00 AM – 6:30 PM IST</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>Private Architectural Consultation Available</span>
              </div>
            </div>

            <a
              href="mailto:hello@prchhardware.com?subject=Factory%20and%20Showroom%20Visit%20Request"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.24em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md"
            >
              Book Showroom Visit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Embedded Interactive Google Map Container */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg lg:col-span-7 h-[380px] sm:h-[420px]">
            <iframe
              title="PRC Hardware Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14008.114757106093!2d77.3712!3d28.6280!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5a43173357b%3A0x37ff1302c6328639!2sSector%2063%2C%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full grayscale contrast-125 opacity-90 transition-all hover:grayscale-0 hover:opacity-100"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* 4. Architectural Hardware FAQ Section */
function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Frequently Asked Questions
          </div>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Quick answers regarding CAD specifications, bulk project quotes, warranties, and sample requests.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left font-serif text-base sm:text-lg font-medium text-foreground hover:bg-secondary/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-foreground" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      <div className="border-t border-border/60 px-5 pb-5 pt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
