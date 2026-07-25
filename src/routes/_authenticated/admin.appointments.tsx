import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail, Phone, Building2, Download, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/admin-utils";

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  component: AppointmentsPage,
});

type MeetingType = "video" | "phone" | "factory_visit" | "showroom_visit" | "onsite_visit";
type ApptStatus = "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "rejected";

const ALL_MEETING: MeetingType[] = ["video", "phone", "factory_visit", "showroom_visit", "onsite_visit"];
const MEETING_LABEL: Record<MeetingType, string> = {
  video: "Video",
  phone: "Phone",
  factory_visit: "Factory",
  showroom_visit: "Showroom",
  onsite_visit: "On-site",
};
const STATUSES: ApptStatus[] = ["pending", "confirmed", "rescheduled", "completed", "cancelled", "rejected"];

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  meeting_types: MeetingType[];
  is_active: boolean;
  notes: string | null;
};

type Appointment = {
  id: string;
  slot_id: string;
  user_id: string | null;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  meeting_type: MeetingType;
  estimated_quantity: string | null;
  product_interest: string | null;
  project_details: string;
  onsite_address: string | null;
  status: ApptStatus;
  admin_notes: string | null;
  created_at: string;
  appointment_slots?: Slot | null;
};

function AppointmentsPage() {
  const [tab, setTab] = useState<"bookings" | "slots">("bookings");
  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Bulk-order B2B booking system"
        actions={
          <div className="flex gap-2">
            <Button
              variant={tab === "bookings" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("bookings")}
            >
              Bookings
            </Button>
            <Button
              variant={tab === "slots" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("slots")}
            >
              Slots
            </Button>
          </div>
        }
      />
      {tab === "bookings" ? <BookingsPanel /> : <SlotsPanel />}
    </div>
  );
}

/* ------------------------------------------ Bookings ------------------------------------------ */

function BookingsPanel() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApptStatus | "all">("all");

  const list = useQuery({
    queryKey: ["appointments", q, statusFilter],
    queryFn: async () => {
      let req = supabase
        .from("appointments")
        .select("*, appointment_slots(*)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (statusFilter !== "all") req = req.eq("status", statusFilter);
      if (q)
        req = req.or(
          `company_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,project_details.ilike.%${q}%`,
        );
      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []) as unknown as Appointment[];
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Appointment> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("appointments").update(rest as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (selected && selected.id === vars.id) setSelected({ ...selected, ...vars } as Appointment);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment deleted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function exportCsv() {
    const rows = list.data ?? [];
    if (!rows.length) return;
    const cols = [
      "company_name",
      "contact_name",
      "email",
      "phone",
      "meeting_type",
      "estimated_quantity",
      "product_interest",
      "project_details",
      "onsite_address",
      "status",
      "created_at",
    ];
    const header = [...cols, "slot_starts_at"].join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        [
          ...cols.map((c) => JSON.stringify(String((r as Record<string, unknown>)[c] ?? ""))),
          JSON.stringify(r.appointment_slots?.starts_at ?? ""),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prch-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Appointments exported");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          className="max-w-md"
          placeholder="Search company, contact, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApptStatus | "all")}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Button variant="outline" onClick={exportCsv} disabled={!list.data?.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {list.isLoading ? (
        <TableSkeleton />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No appointments yet" description="Bookings from /book-appointment will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <ul className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-xl border border-border bg-card">
            {list.data!.map((a) => {
              const active = selected?.id === a.id;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setSelected(a)}
                    className={`flex w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/60 ${
                      active ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{a.company_name}</span>
                      <Badge variant={a.status === "pending" ? "secondary" : "outline"}>{a.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.contact_name} · {MEETING_LABEL[a.meeting_type]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.appointment_slots?.starts_at
                        ? new Date(a.appointment_slots.starts_at).toLocaleString()
                        : "Slot deleted"}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-border bg-card p-6">
            {selected ? (
              <AppointmentDetail
                appt={selected}
                onUpdate={(patch) => update.mutate({ id: selected.id, ...patch })}
                onDelete={() => {
                  if (confirm("Delete this appointment?")) del.mutate(selected.id);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a booking to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentDetail({
  appt,
  onUpdate,
  onDelete,
}: {
  appt: Appointment;
  onUpdate: (patch: Partial<Appointment>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(appt.admin_notes ?? "");
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-serif text-xl">{appt.company_name}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> {appt.contact_name}
          </div>
          <a href={`mailto:${appt.email}`} className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Mail className="h-3.5 w-3.5" /> {appt.email}
          </a>
          <a href={`tel:${appt.phone}`} className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Phone className="h-3.5 w-3.5" /> {appt.phone}
          </a>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {appt.appointment_slots?.starts_at
              ? new Date(appt.appointment_slots.starts_at).toLocaleString()
              : "Slot deleted"}{" "}
            · {MEETING_LABEL[appt.meeting_type]}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Submitted {formatDate(appt.created_at)}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onUpdate({ status: s })}
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
              appt.status === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DetailRow label="Estimated quantity" value={appt.estimated_quantity} />
      <DetailRow label="Product interest" value={appt.product_interest} />
      {appt.onsite_address && <DetailRow label="On-site address" value={appt.onsite_address} />}

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Project details</div>
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
          {appt.project_details}
        </div>
      </div>

      {/* ADMIN REPLY TO CUSTOMER PANEL */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            <MessageSquare className="h-4 w-4 text-amber-500" /> Customer Reply / Admin Notes (Visible to Customer)
          </div>

          {/* Quick Reply Templates */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const text = `Hi ${appt.contact_name},\n\nYour B2B appointment with PRC Hardware has been CONFIRMED!\n\nMeeting Format: ${MEETING_LABEL[appt.meeting_type]}\nGoogle Meet Link: https://meet.google.com/prc-hardware-b2b\n\nLooking forward to engineering your partition hardware requirements.`;
                setNotes(text);
              }}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            >
              + Confirm Template
            </button>

            <button
              type="button"
              onClick={() => {
                const text = `Hi ${appt.contact_name},\n\nThank you for reaching out to PRC Hardware. We would like to propose rescheduling your consultation slot.\n\nPlease let us know your preferred time for this week.`;
                setNotes(text);
              }}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            >
              + Reschedule Template
            </button>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Write a message, Google Meet link, or showroom directions for the customer... Customer can see this when tracking their booking status on the website."
          className="w-full rounded-lg border border-border bg-background p-3 text-xs font-medium text-foreground outline-none focus:border-foreground resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate({ admin_notes: notes || null });
              toast.success("Admin reply saved & sent to customer tracking portal!");
            }}
            className="text-xs font-semibold"
          >
            Save & Publish Reply to Customer
          </Button>

          <Button asChild variant="outline" size="sm">
            <a
              href={`mailto:${appt.email}?subject=PRC%20Hardware%20Appointment%20Confirmation%20%5B${appt.company_name}%5D&body=${encodeURIComponent(notes)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Email Customer Directly
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

/* -------------------------------------------- Slots ------------------------------------------- */

function SlotsPanel() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const list = useQuery({
    queryKey: ["appointment_slots_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("*")
        .order("starts_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Slot[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: {
      starts_at: string;
      ends_at: string;
      capacity: number;
      meeting_types: MeetingType[];
      notes: string | null;
    }) => {
      const { error } = await supabase.from("appointment_slots").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot created");
      setCreating(false);
      qc.invalidateQueries({ queryKey: ["appointment_slots_admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Slot> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("appointment_slots").update(rest as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment_slots_admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointment_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot deleted");
      qc.invalidateQueries({ queryKey: ["appointment_slots_admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Slots visible to the public on /book-appointment. Only future active slots are shown to customers.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New slot
        </Button>
      </div>

      {creating && (
        <SlotForm
          onCancel={() => setCreating(false)}
          onSubmit={(p) => create.mutate(p)}
          submitting={create.isPending}
        />
      )}

      {list.isLoading ? (
        <TableSkeleton />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No slots yet" description="Create your first bookable slot." />
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {list.data!.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {new Date(s.starts_at).toLocaleString()} — {new Date(s.ends_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Capacity {s.capacity} · {s.meeting_types.map((m) => MEETING_LABEL[m]).join(", ")}
                  {s.notes ? ` · ${s.notes}` : ""}
                </div>
              </div>
              <button
                onClick={() => update.mutate({ id: s.id, is_active: !s.is_active })}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                  s.is_active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
                }`}
              >
                {s.is_active ? "Active" : "Inactive"}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Delete this slot? Existing bookings will block deletion.")) del.mutate(s.id);
                }}
                aria-label="Delete slot"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SlotForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (p: { starts_at: string; ends_at: string; capacity: number; meeting_types: MeetingType[]; notes: string | null }) => void;
  submitting: boolean;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [capacity, setCapacity] = useState(1);
  const [types, setTypes] = useState<MeetingType[]>([...ALL_MEETING]);
  const [notes, setNotes] = useState("");

  const toggle = (t: MeetingType) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return toast.error("Pick a date");
    if (!types.length) return toast.error("Pick at least one meeting type");
    const starts = new Date(`${date}T${startTime}`);
    const ends = new Date(`${date}T${endTime}`);
    if (ends <= starts) return toast.error("End time must be after start time");
    if (starts <= new Date()) return toast.error("Slot must be in the future");
    onSubmit({
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      capacity,
      meeting_types: types,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Date</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Start</span>
          <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">End</span>
          <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Capacity</span>
          <input type="number" min={1} max={20} required value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Allowed meeting types</div>
        <div className="flex flex-wrap gap-2">
          {ALL_MEETING.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => toggle(t)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                types.includes(t) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              }`}
            >
              {MEETING_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create slot"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
