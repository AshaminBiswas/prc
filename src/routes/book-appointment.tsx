import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { CalendarClock, CheckCircle2, AlertCircle, Loader2, Video, Phone, Factory, Store, MapPin, Sparkles, Building2, Calendar, Clock, ArrowRight, ShieldCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { submitAppointmentBooking } from "@/lib/appointment.functions";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

export const Route = createFileRoute("/book-appointment")({
  head: () => ({
    meta: [
      { title: "Book a B2B Hardware Consultation — PRC Architectural Hardware" },
      {
        name: "description",
        content:
          "Schedule an exclusive B2B appointment with PRC technical hardware engineers — Video call, Phone, Factory walkthrough, Showroom visit, or On-Site project consultation.",
      },
      { property: "og:title", content: "Book a B2B Consultation — PRC Hardware" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/book-appointment" }],
  }),
  component: BookAppointmentPage,
});

type MeetingType = "video" | "phone" | "factory_visit" | "showroom_visit" | "onsite_visit";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  meeting_types: MeetingType[];
  is_active: boolean;
  notes: string | null;
};

const ALL_MEETING_TYPES: MeetingType[] = ["video", "phone", "factory_visit", "showroom_visit", "onsite_visit"];

const MEETING_LABELS: Record<MeetingType, { label: string; desc: string; Icon: typeof Video }> = {
  video: { label: "Video Call Consultation", desc: "Google Meet or Zoom call with PRC technical engineers", Icon: Video },
  phone: { label: "Direct Phone Call", desc: "Speak directly with our B2B commercial sales desk", Icon: Phone },
  factory_visit: { label: "PRC Factory Walkthrough", desc: "Visit our Noida Sector 63 manufacturing & testing facility", Icon: Factory },
  showroom_visit: { label: "Experience Center Visit", desc: "Examine physical hardware finishes & mock-up partitions", Icon: Store },
  onsite_visit: { label: "On-Site Project Assessment", desc: "PRC technical engineers visit your commercial site", Icon: MapPin },
};

// Generate default slots for next 14 days if database slots are empty
async function generateDefaultSlots() {
  const newSlots = [];
  const now = new Date();

  for (let i = 1; i <= 14; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    // Skip Sundays
    if (day.getDay() === 0) continue;

    const times = ["10:00", "11:30", "14:00", "15:30", "17:00"];
    for (const [idx, time] of times.entries()) {
      const [h, m] = time.split(":").map(Number);
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      const endsAt = new Date(startsAt.getTime() + 45 * 60000);

      newSlots.push({
        id: `auto-slot-${day.toISOString().slice(0, 10)}-${idx}`,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: 4,
        meeting_types: ALL_MEETING_TYPES,
        is_active: true,
        notes: "Automated B2B Consultation Slot",
      } as Slot);
    }
  }

  return newSlots;
}

function BookAppointmentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main>
        <HeroSection />
        <BookingWizardSection />
      </main>
      <SiteFooter />
    </div>
  );
}

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
            <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
            B2B Commercial Consultation
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.05]">
            Book a Technical Consultation.
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            Designed for architects, commercial contractors, and project procurement managers. Schedule a 1-on-1 session to discuss custom finishes, technical CAD specs, MOQ pricing, and dispatch timelines.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/track-appointment"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md"
            >
              <Search className="h-4 w-4" />
              Track Appointment Status
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BookingWizardSection() {
  const submitBooking = useServerFn(submitAppointmentBooking);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType>("video");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{ id: string; refCode: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    estimated_quantity: "10-50 Partition Sets",
    product_interest: "SS304 Cubicle Fittings",
    project_details: "",
    onsite_address: "",
  });

  // Fetch or Auto-Seed Slots
  useEffect(() => {
    let active = true;
    async function loadSlots() {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("id, starts_at, ends_at, capacity, meeting_types, is_active, notes")
        .eq("is_active", true)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(200);

      if (!active) return;

      if (error || !data || data.length === 0) {
        // Auto seed slots if empty
        const seeded = await generateDefaultSlots();
        if (seeded && active) {
          setSlots(seeded);
        }
      } else {
        setSlots(data as Slot[]);
      }
      setLoading(false);
    }

    void loadSlots();
    return () => {
      active = false;
    };
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });

  // Filter slots supporting selected meeting type
  const validSlots = useMemo(() => {
    return slots.filter((s) => s.meeting_types && s.meeting_types.includes(selectedMeetingType));
  }, [slots, selectedMeetingType]);

  // Filter slots matching the selected date picker date (or generate on the fly for that date)
  const activeSlotsForSelectedDate = useMemo(() => {
    const matches = validSlots.filter((s) => {
      const slotISO = new Date(s.starts_at).toISOString().slice(0, 10);
      return slotISO === selectedDateStr;
    });

    if (matches.length > 0) return matches;

    // Fallback on-the-fly slot times if date is picked dynamically
    const targetDate = new Date(selectedDateStr);
    const times = ["10:00", "11:30", "14:00", "15:30", "17:00"];

    return times.map((t, idx) => {
      const [h, m] = t.split(":").map(Number);
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h, m);
      const end = new Date(start.getTime() + 45 * 60000);

      return {
        id: `auto-slot-${selectedDateStr}-${idx}`,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        capacity: 4,
        meeting_types: ALL_MEETING_TYPES,
        is_active: true,
        notes: "Dynamic Date Picker Slot",
      } as Slot;
    });
  }, [validSlots, selectedDateStr]);

  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select an available date & time slot.");
      return;
    }
    if (!form.contact_name || !form.email || !form.phone || !form.company_name) {
      toast.error("Please fill in your contact name, company, email, and phone number.");
      return;
    }
    if (selectedMeetingType === "onsite_visit" && !form.onsite_address) {
      toast.error("Please provide the on-site location address for site visits.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedTimeStr = new Date(selectedSlot.starts_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const res = await submitBooking({
        data: {
          slot_id: selectedSlot.id,
          meeting_type: selectedMeetingType,
          requested_date: selectedDateStr,
          requested_time: selectedTimeStr,
          company_name: form.company_name,
          contact_name: form.contact_name,
          email: form.email,
          phone: form.phone,
          product_interest: form.product_interest,
          estimated_quantity: form.estimated_quantity,
          project_details: form.project_details,
          onsite_address: selectedMeetingType === "onsite_visit" ? form.onsite_address : undefined,
        },
      });

      setBookingSuccess({ id: res.id, refCode: res.refCode });
      toast.success("Appointment booked successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        {bookingSuccess ? (
          /* Success Screen */
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-xl">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="font-serif text-3xl font-medium text-foreground">Appointment Confirmed!</h2>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Booking Reference: <strong className="text-foreground">{bookingSuccess.refCode}</strong>
            </p>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              We have received your B2B consultation request. A PRC technical sales manager will review your specs and send access instructions to <strong className="text-foreground">{form.email}</strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                setBookingSuccess(null);
                setSelectedSlot(null);
              }}
              className="mt-8 rounded-xl bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-background font-semibold"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookAppointment} className="space-y-12">
            {/* STEP 1: Select Consultation Type */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground mb-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px]">1</span>
                Step 1: Choose Meeting Format
              </div>
              <h3 className="font-serif text-2xl font-medium text-foreground">How would you like to consult?</h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_MEETING_TYPES.map((type) => {
                  const meta = MEETING_LABELS[type];
                  const active = selectedMeetingType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedMeetingType(type);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                        active
                          ? "border-foreground bg-foreground/5 shadow-md ring-1 ring-foreground"
                          : "border-border bg-background hover:border-foreground/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-foreground text-background" : "bg-secondary text-foreground"}`}>
                          <meta.Icon className="h-5 w-5" />
                        </div>
                        {active && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{meta.label}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{meta.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Date & Time Slot */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground mb-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px]">2</span>
                Step 2: Select Date & Time Slot
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground">Pick a Date & Time</h3>
                  <p className="text-xs text-muted-foreground">Select a date using the calendar picker below or click a quick date tab.</p>
                </div>

                {/* Date Picker Input */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-sm">
                  <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                  <label htmlFor="appointment-date-picker" className="font-medium text-muted-foreground sr-only">Choose Date</label>
                  <input
                    id="appointment-date-picker"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    max={new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)}
                    value={selectedDateStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDateStr(e.target.value);
                        setSelectedSlot(null);
                      }
                    }}
                    className="bg-transparent font-semibold text-foreground outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick Date Selector Chips */}
              <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i + 1);
                  const iso = d.toISOString().slice(0, 10);
                  const active = selectedDateStr === iso;
                  const label = i === 0 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setSelectedDateStr(iso);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
                        active
                          ? "border-foreground bg-foreground text-background shadow-md"
                          : "border-border bg-background text-foreground hover:border-foreground/40 hover:bg-secondary"
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Available Schedule…
                </div>
              ) : activeSlotsForSelectedDate.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <p>No slots found for {new Date(selectedDateStr).toDateString()}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextDay = new Date(selectedDateStr);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setSelectedDateStr(nextDay.toISOString().slice(0, 10));
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-secondary"
                  >
                    Check Next Available Date <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-3">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Available Slots for {new Date(selectedDateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {activeSlotsForSelectedDate.map((slot) => {
                      const active = selectedSlot?.id === slot.id;
                      const timeStr = new Date(slot.starts_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all ${
                            active
                              ? "border-foreground bg-foreground text-background shadow-md"
                              : "border-border bg-background text-foreground hover:border-foreground/40 hover:bg-secondary"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: Enter B2B Contact & Project Details */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground mb-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px]">3</span>
                Step 3: Business & Project Specifications
              </div>
              <h3 className="font-serif text-2xl font-medium text-foreground">Your Contact Details</h3>

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Company / Architecture Firm Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Commercial Builders"
                      value={form.company_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Contact Person Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={form.contact_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rajesh@apexinfra.com"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Primary Hardware Interest</label>
                    <select
                      value={form.product_interest}
                      onChange={(e) => setForm((prev) => ({ ...prev, product_interest: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground cursor-pointer"
                    >
                      <option value="SS304 Cubicle Fittings">SS304 Cubicle & Toilet Partition Fittings</option>
                      <option value="Solid Brass Indicator Locks">Solid Brass Indicator Locks & Hinges</option>
                      <option value="Anodised Aluminium Profiles">Anodised Aluminium Architectural Profiles</option>
                      <option value="Glass Hardware & Clamps">Glass Hardware & Clamps</option>
                      <option value="Custom PVD Finishes">Custom PVD Finish Matching</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Estimated Hardware Quantity</label>
                    <select
                      value={form.estimated_quantity}
                      onChange={(e) => setForm((prev) => ({ ...prev, estimated_quantity: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground cursor-pointer"
                    >
                      <option value="10-50 Partition Sets">10 – 50 Partition Sets (Small Commercial)</option>
                      <option value="50-200 Partition Sets">50 – 200 Partition Sets (Medium Project)</option>
                      <option value="200+ Partition Sets">200+ Partition Sets (Major Commercial Tower)</option>
                    </select>
                  </div>
                </div>

                {selectedMeetingType === "onsite_visit" && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      On-Site Location Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tower B, DLF Cyber City, Sector 24, Gurugram"
                      value={form.onsite_address}
                      onChange={(e) => setForm((prev) => ({ ...prev, onsite_address: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Project Scope / Specific Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Share any drawings, panel thickness (e.g. 12mm/18mm), finish preference, or timeline..."
                    value={form.project_details}
                    onChange={(e) => setForm((prev) => ({ ...prev, project_details: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background p-4 text-sm font-medium text-foreground outline-none focus:border-foreground resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Confirm Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-xs font-semibold uppercase tracking-[0.24em] text-background transition-all hover:opacity-90 active:scale-98 shadow-xl disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirming Consultation…
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4" /> Confirm B2B Appointment Booking
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
