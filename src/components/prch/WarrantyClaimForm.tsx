import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, ShieldCheck, FileText, Mail, Calendar, Wrench, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

const PRODUCT_CATEGORIES = [
  "SS304 Cubicle Hinge Assembly",
  "SS304 / Brass Indicator Bolt",
  "SS304 Partition Support Leg",
  "Aluminium Partition Profile",
  "Glass Hardware Fitting / Clamp",
  "Nylon Partition Fittings",
  "PVD Finish Discoloration",
  "Other Hardware Item",
];

export function WarrantyClaimForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    order_id: "",
    product: PRODUCT_CATEGORIES[0],
    purchase_date: new Date().toISOString().slice(0, 10),
    issue: "",
    contact_email: "",
  });

  function onChange(key: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.order_id || !form.contact_email || !form.issue) {
      toast.error("Please fill in Order ID, Email, and Description of the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("warranty_claims").insert({
        order_id: form.order_id,
        product: form.product,
        purchase_date: form.purchase_date,
        issue: form.issue,
        contact_email: form.contact_email,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Warranty claim submitted successfully!");
      setForm({
        order_id: "",
        product: PRODUCT_CATEGORIES[0],
        purchase_date: new Date().toISOString().slice(0, 10),
        issue: "",
        contact_email: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit warranty claim.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="claim-form" className="relative border-t border-border py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column — Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground border border-border">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              Online Claim Portal
            </div>

            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1]">
              Submit Your Warranty Claim
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
              Provide your order details and photos of the hardware issue. Our Quality Assurance engineering team evaluates all claims within 24 business hours.
            </p>

            {/* Quick Policy Points */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Hassle-Free Replacement</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Approved claims receive brand new hardware replacements directly dispatched to your site.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Order ID or Invoice Required</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Have your PRC Order ID, Tax Invoice, or Serial Tag number ready to expedite verification.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column — Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-lg lg:col-span-7"
          >
            {submitted ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <h3 className="font-serif text-3xl font-medium">Warranty Claim Received!</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Your claim has been logged into our quality system. A PRC warranty specialist will review your details and send resolution instructions to your email address within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-xl bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-background"
                >
                  File Another Claim
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Order ID */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Order ID / Invoice No. <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. PRC-2026-0812"
                        value={form.order_id}
                        onChange={(e) => onChange("order_id", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Contact Email Address <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. contact@projectsite.com"
                        value={form.contact_email}
                        onChange={(e) => onChange("contact_email", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Product Category Select */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Affected Hardware Product
                    </label>
                    <select
                      value={form.product}
                      onChange={(e) => onChange("product", e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors cursor-pointer"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase / Installation Date */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Approximate Purchase Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={form.purchase_date}
                        onChange={(e) => onChange("purchase_date", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Defect Description */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Description of Hardware Defect <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      required
                      rows={4}
                      placeholder="Please describe the issue (e.g. spring tension loss in cubicle hinge, tarnishing on indicator lock, bracket structural failure)..."
                      value={form.issue}
                      onChange={(e) => onChange("issue", e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-xs font-semibold uppercase tracking-[0.24em] text-background transition-all hover:opacity-95 active:scale-98 shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting Claim…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Submit Warranty Claim
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
