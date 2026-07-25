import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, Send, CheckCircle2, User, Mail, Phone, Building2, MessageSquare, Compass, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

const USER_ROLES = [
  { id: "architect", label: "Architect / Interior Designer" },
  { id: "builder", label: "Commercial Project Builder" },
  { id: "dealer", label: "Dealer / Distributor" },
  { id: "retail", label: "Retail / Homeowner" },
];

const INQUIRY_TYPES = [
  "Bulk Commercial Project Quote",
  "Technical CAD & BIM Specification",
  "Sample Box Request",
  "Custom PVD Finish Matching",
  "Warranty & After-Sales Support",
  "General Enquiry",
];

export function ContactForm() {
  const [role, setRole] = useState("architect");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "Bulk Commercial Project Quote",
    message: "",
  });

  function onChange(key: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const fullDetails = `[Role: ${role.toUpperCase()}] [Subject: ${form.inquiryType}] ${form.phone ? `[Phone: ${form.phone}] ` : ""}${form.message}`;

      const { error } = await supabase.from("contact_messages").insert({
        name: form.name,
        email: form.email,
        company: form.company ? `${form.company} (${role})` : role,
        message: fullDetails,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you! Your message has been sent successfully.");
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        inquiryType: "Bulk Commercial Project Quote",
        message: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact-form" className="relative border-t border-border py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column — Text & Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              Direct Inquiry
            </div>

            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1]">
              Send Us Your Project Specs
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
              Whether you need CAD technical drawings, custom PVD finish matching, or a competitive bulk commercial quote — our hardware engineers respond within 24 hours.
            </p>

            {/* Benefit Highlights */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Fast Commercial Turnaround</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Detailed quotation & material bill of quantities prepared in 24–48 hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Architect Support Desk</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">Free 3D BIM models, CAD blocks, and physical sample boxes provided for specified projects.</p>
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
                <h3 className="font-serif text-3xl font-medium">Inquiry Submitted!</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out to PRC Hardware. Our technical sales engineering team is reviewing your details and will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-xl bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-background"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selector Chips */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    I am inquiring as:
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {USER_ROLES.map((r) => {
                      const active = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition-all ${
                            active
                              ? "border-foreground bg-foreground text-background shadow-sm"
                              : "border-border bg-secondary/50 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Fields Grid */}
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@architecturefirm.com"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Company / Firm Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. Studio Arc Design"
                        value={form.company}
                        onChange={(e) => onChange("company", e.target.value)}
                        disabled={submitting}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Inquiry Type Select */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Inquiry Subject / Category
                  </label>
                  <select
                    value={form.inquiryType}
                    onChange={(e) => onChange("inquiryType", e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors cursor-pointer"
                  >
                    {INQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Project Specs & Details <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      required
                      rows={4}
                      placeholder="Share your hardware quantities, panel thickness (e.g. 12mm/18mm), finish preference, or project timeline..."
                      value={form.message}
                      onChange={(e) => onChange("message", e.target.value)}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting Inquiry…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Inquiry to PRC
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
