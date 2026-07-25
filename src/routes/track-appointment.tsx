import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Search, CalendarClock, CheckCircle2, Clock, XCircle, AlertCircle, Mail, Building2, MapPin, Video, Phone, Factory, Store, MessageSquare, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { searchAppointmentStatus } from "@/lib/appointment.functions";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

export const Route = createFileRoute("/track-appointment")({
  head: () => ({
    meta: [
      { title: "Track Appointment Status — PRC Architectural Hardware" },
      {
        name: "description",
        content:
          "Track your B2B hardware consultation booking status in real time using your email address or booking reference code.",
      },
      { property: "og:title", content: "Track Appointment Status — PRC Hardware" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/track-appointment" }],
  }),
  component: TrackAppointmentPage,
});

type AppointmentRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  meeting_type: string;
  product_interest: string | null;
  estimated_quantity: string | null;
  project_details: string;
  onsite_address: string | null;
  status: "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const MEETING_TYPE_LABELS: Record<string, { label: string; Icon: typeof Video }> = {
  video: { label: "Video Call Consultation", Icon: Video },
  phone: { label: "Direct Phone Call", Icon: Phone },
  factory_visit: { label: "PRC Factory Walkthrough", Icon: Factory },
  showroom_visit: { label: "Experience Center Visit", Icon: Store },
  onsite_visit: { label: "On-Site Project Visit", Icon: MapPin },
};

function TrackAppointmentPage() {
  const fetchStatus = useServerFn(searchAppointmentStatus);
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRecord[] | null>(null);

  // Auto-load recent appointments on page load via serverFn
  useEffect(() => {
    async function loadRecentAppointments() {
      setLoading(true);
      try {
        const results = await fetchStatus({ data: { query: "" } });
        if (results && results.length > 0) {
          setAppointments(results as AppointmentRecord[]);
        }
      } catch (e) {
        console.error("Auto load error:", e);
      } finally {
        setLoading(false);
      }
    }
    void loadRecentAppointments();
  }, [fetchStatus]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!queryInput.trim()) {
      toast.error("Please enter your Email Address or Booking Reference ID.");
      return;
    }

    setLoading(true);
    try {
      const q = queryInput.trim();
      const results = await fetchStatus({ data: { query: q } });
      setAppointments(results as AppointmentRecord[]);

      if (!results || results.length === 0) {
        toast.error("No appointment records found.");
      } else {
        toast.success(`Found ${results.length} appointment record(s).`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to search appointment status.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
          </span>
        );
      case "rescheduled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" /> Rescheduled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        );
      case "cancelled":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" /> {status === "cancelled" ? "Cancelled" : "Declined"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> Pending Review
          </span>
        );
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
                <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                Real-Time Tracking Portal
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-tight">
                Track Appointment Status.
              </h1>

              <p className="mt-4 text-base text-muted-foreground max-w-2xl">
                Check your B2B consultation review status, view administrative meeting notes, access video call links, and communicate with PRC engineers.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search & Tracker Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 md:px-10 py-12 sm:py-20">
          {/* Search Box */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lg">
            <form onSubmit={handleSearch} className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enter Email Address or Booking Reference Code
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. rajesh@apexinfra.com or PAC-APT-891234"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-all hover:opacity-90 active:scale-95 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> Track Status
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results List */}
          {appointments !== null && (
            <div className="mt-10 space-y-6">
              {appointments.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h3 className="font-serif text-2xl font-medium text-foreground">No Records Found</h3>
                  <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                    We couldn't find an appointment matching "{queryInput}". Please double-check your email address or booking reference code.
                  </p>
                </div>
              ) : (
                appointments.map((appt) => {
                  const meetingMeta = MEETING_TYPE_LABELS[appt.meeting_type] || MEETING_TYPE_LABELS.video;
                  const MeetingIcon = meetingMeta.Icon;

                  return (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-md space-y-6"
                    >
                      {/* Record Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Building2 className="h-4 w-4 text-amber-500" />
                            <span>{appt.company_name}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{appt.contact_name}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-medium text-foreground mt-1">
                            {meetingMeta.label}
                          </h3>
                        </div>

                        <div>{getStatusBadge(appt.status)}</div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-border/70 bg-secondary/30 p-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                            Meeting Format
                          </span>
                          <span className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
                            <MeetingIcon className="h-4 w-4 text-amber-500" /> {meetingMeta.label}
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                            Client Contact
                          </span>
                          <span className="font-semibold text-foreground block mt-1">{appt.email}</span>
                          <span className="text-muted-foreground text-[11px]">{appt.phone}</span>
                        </div>

                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                            Submitted Date
                          </span>
                          <span className="font-semibold text-foreground block mt-1">
                            {new Date(appt.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Project Specs */}
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold mb-1">
                          Project Specs & Requested Slot
                        </span>
                        <div className="rounded-xl border border-border bg-background p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
                          {appt.project_details}
                        </div>
                      </div>

                      {/* ADMIN REPLY / NOTES BOX */}
                      {appt.admin_notes ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                            <MessageCircleIcon /> Message / Reply From PRC Admin
                          </div>
                          <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium whitespace-pre-line">
                            {appt.admin_notes}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>PRC Technical Sales desk is currently reviewing your appointment request. You will receive an admin reply & meeting link here shortly.</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function MessageCircleIcon() {
  return <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />;
}
