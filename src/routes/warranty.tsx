import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Wrench, FileCheck2, Clock, AlertTriangle, FileText, Download, Sparkles, ArrowRight, CheckCircle2, ChevronDown, Award, Truck, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { WarrantyClaimForm } from "@/components/prch/WarrantyClaimForm";
import { WarrantyCertificateGenerator } from "@/components/prch/WarrantyCertificateGenerator";
import warrantyPolicyPdf from "@/assets/prch-warranty-policy.pdf.asset.json";

const POLICY_LAST_UPDATED = "24 July 2026";
const POLICY_VERSION = "v2.4";

const EASE = [0.22, 1, 0.36, 1] as const;

export const Route = createFileRoute("/warranty")({
  head: () => ({
    meta: [
      { title: "Warranty Policy & Claim Portal — PRC Precision Hardware" },
      {
        name: "description",
        content:
          "PRC 10-Year Warranty coverage for cubicle, locker, and toilet partition hardware. Submit warranty claims online and review material coverage terms.",
      },
      { property: "og:title", content: "Warranty Policy & Claim Portal — PRC Hardware" },
      {
        property: "og:description",
        content:
          "Full warranty terms for PRC stainless steel, aluminium, and nylon hardware. Submit online claims for instant quality assessment.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WarrantyPage,
});

const COVERAGE = [
  {
    material: "Stainless Steel 304 / 316",
    duration: "2 Years",
    tagline: "Solid SS-304 & SS-316 Fittings",
    detail:
      "Full replacement coverage against structural cracking, mechanical spring failure, oxidation, and corrosion under high-moisture restroom conditions.",
    badge: "2-Year Guarantee",
  },
  {
    material: "Anodised Aluminium Hardware",
    duration: "2 Years",
    tagline: "Heavy-Duty Profiles & Channels",
    detail:
      "Protects against surface oxidation, anodising peel, structural bending, and channel separation during regular commercial usage.",
    badge: "2-Year Guarantee",
  },
  {
    material: "High-Impact Nylon & Brass Fittings",
    duration: "2 Years",
    tagline: "Engineered Hardware Accessories",
    detail:
      "Guarantees against material brittleness, cracking, discoloration, and structural foot fatigue in indoor partition installations.",
    badge: "2-Year Guarantee",
  },
];

const CLAIM_STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "Submit Online Claim",
    body: "Fill out the online claim form below with your Order ID, purchase date, and a description or photos of the hardware issue.",
  },
  {
    step: "02",
    icon: FileCheck2,
    title: "24-Hour Quality Audit",
    body: "Our Quality Assurance team reviews your submission within 24 business hours to verify warranty eligibility.",
  },
  {
    step: "03",
    icon: Wrench,
    title: "Direct Site Replacement",
    body: "Upon approval, brand new replacement hardware is dispatched directly to your project site free of charge.",
  },
];

const EXCLUSIONS = [
  "Damage resulting from improper installation not following PRC technical guidelines.",
  "Cosmetic scratches or chemical staining caused by unapproved acidic or abrasive cleaning agents.",
  "Accidental physical damage, vandalism, fire, flooding, or acts of nature.",
  "Unauthorised drilling, welding, or structural modifications made to original hardware pieces.",
  "Consumable rubber gaskets and door bumpers beyond 12 months of installation.",
];

function WarrantyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <CoverageSection />
        <ProcessSection />
        <PdfDownloadSection />
        <section className="border-t border-border py-12 sm:py-16 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">
                    Official Warranty Certificate Issuance
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                    Official PRC 2-Year Warranty Certificates are issued exclusively by authorized PRC Quality Administrators upon project order dispatch. If you require a verified copy of your certificate for site records, contact your sales representative.
                  </p>
                </div>
              </div>

              <a
                href="/admin/warranty-certificate"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md"
              >
                Admin Issuance Portal
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
        <WarrantyClaimForm />
        <ExclusionsSection />
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
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            2-Year Universal Hardware Warranty
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.05]">
            2-Year Warranty & Claim Portal.
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            Every piece of PRC hardware — Stainless Steel, Aluminium, Nylon & Brass — comes with an all-inclusive 2-Year Replacement Warranty Guarantee.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#claim-form"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md"
            >
              <ShieldCheck className="h-4 w-4" />
              File Online Claim
            </a>

            <a
              href="#policy-pdf"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-foreground transition-all hover:bg-secondary active:scale-95 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download Policy PDF
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* 2. Material-Wise Coverage Cards */
function CoverageSection() {
  return (
    <section className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-border/70 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Material Specifics
            </div>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Warranty Coverage By Material
            </h2>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md">
            Guaranteed anti-corrosion and structural protection across all PRC commercial hardware ranges.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {COVERAGE.map((item, i) => (
            <motion.div
              key={item.material}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    {item.badge}
                  </span>
                </div>

                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {item.tagline}
                </p>
                <h3 className="mt-1 font-serif text-3xl font-medium text-foreground">
                  {item.duration}
                </h3>
                <h4 className="mt-2 font-serif text-lg font-medium text-foreground">
                  {item.material}
                </h4>
                <p className="mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>

              <div className="mt-8 border-t border-border/70 pt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>100% Direct Component Replacement</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 3. Process Section */
function ProcessSection() {
  return (
    <section className="border-b border-border bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Simple & Transparent
          </div>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            3-Step Warranty Claim Process
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {CLAIM_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
              className="relative rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl font-light text-muted-foreground">{step.step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. PDF Download Section */
function PdfDownloadSection() {
  return (
    <section id="policy-pdf" className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid gap-8 rounded-3xl border border-border bg-foreground p-8 sm:p-12 text-background md:grid-cols-[1fr_auto] md:items-center shadow-xl"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-amber-300 font-semibold">
              <FileText className="h-4 w-4" />
              Official Documentation
            </div>
            <h2 className="mt-3 font-serif text-2xl sm:text-4xl font-medium text-white leading-snug">
              Download Full PRC Warranty Policy PDF
            </h2>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/80">
              Download the official PRC Warranty Policy document for site submittals, architectural procurement records, and maintenance logs. Includes detailed chemical resistance tables and installation specifications.
            </p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-white/50">
              Last updated: {POLICY_LAST_UPDATED} · Version {POLICY_VERSION} · Format: PDF
            </p>
          </div>

          <div>
            <a
              href={warrantyPolicyPdf.url}
              download="PRC-Warranty-Policy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Download className="h-4 w-4" />
              Download Policy PDF
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* 5. Exclusions Accordion Section */
function ExclusionsSection() {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-10">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
                Warranty Exclusions & Care Guidelines
              </h2>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-6 border-t border-border/70 pt-6"
              >
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  The PRC warranty guarantees against manufacturing defects and structural corrosion under normal commercial use. The following conditions fall outside warranty coverage:
                </p>
                <ul className="space-y-3">
                  {EXCLUSIONS.map((exc) => (
                    <li key={exc} className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">—</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
