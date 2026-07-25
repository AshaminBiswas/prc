import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type MeetingType = "video" | "phone" | "factory_visit" | "showroom_visit" | "onsite_visit";

const appointmentSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(150),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(255),
  phone: z.string().trim().min(7, "Valid phone number is required").max(30),
  meeting_type: z.enum(["video", "phone", "factory_visit", "showroom_visit", "onsite_visit"]),
  requested_date: z.string().min(8, "Date is required"),
  requested_time: z.string().min(2, "Time is required"),
  slot_id: z.string().optional(),
  estimated_quantity: z.string().optional().nullable(),
  product_interest: z.string().optional().nullable(),
  project_details: z.string().optional().nullable(),
  onsite_address: z.string().optional().nullable(),
});

export const submitAppointmentBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => appointmentSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Initialize Supabase Client with Service Role Key to bypass RLS restrictions on server side
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://aauxkvtbkejcvmdsxfkq.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false },
    });

    // 2. Resolve a valid slot_id from appointment_slots table
    let validSlotId = data.slot_id;

    // If no valid UUID slot_id passed or if slot_id is dynamic string like auto-slot
    if (!validSlotId || validSlotId.startsWith("auto-slot-") || !/^[0-9a-fA-F-]{36}$/.test(validSlotId)) {
      // Find an existing active slot in DB
      const { data: dbSlots } = await supabase
        .from("appointment_slots")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (dbSlots && dbSlots.length > 0) {
        validSlotId = dbSlots[0].id;
      } else {
        // Create an initial active slot in DB if table is completely empty
        const startsAt = new Date(`${data.requested_date}T10:00:00Z`).toISOString();
        const endsAt = new Date(`${data.requested_date}T10:45:00Z`).toISOString();

        const { data: newSlot, error: slotErr } = await supabase
          .from("appointment_slots")
          .insert({
            starts_at: startsAt,
            ends_at: endsAt,
            capacity: 4,
            meeting_types: ["video", "phone", "factory_visit", "showroom_visit", "onsite_visit"],
            is_active: true,
            notes: "Initial Consultation Slot",
          })
          .select("id")
          .single();

        if (slotErr || !newSlot) {
          console.error("[appointment] Slot creation error:", slotErr);
          throw new Error("Failed to initialize booking slot. Please try again.");
        }
        validSlotId = newSlot.id;
      }
    }

    // 3. Construct detailed project description containing refCode, date & time
    const refCode = `PAC-APT-${Math.floor(100000 + Math.random() * 900000)}`;
    const refStamp = `[Ref: ${refCode}]`;
    const dateTimeStamp = `[Requested Slot: ${data.requested_date} @ ${data.requested_time}]`;
    const fullProjectDetails = `${refStamp} ${dateTimeStamp} ${data.project_details || `B2B ${data.meeting_type} consultation request`}`;

    // 4. Insert into Supabase appointments table
    const { data: created, error } = await supabase
      .from("appointments")
      .insert({
        slot_id: validSlotId,
        meeting_type: data.meeting_type as MeetingType,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        product_interest: data.product_interest || null,
        estimated_quantity: data.estimated_quantity || null,
        project_details: fullProjectDetails,
        onsite_address: data.meeting_type === "onsite_visit" ? data.onsite_address || null : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[appointment] Insertion error:", error);
      throw new Error(`Failed to store appointment in DB: ${error.message}`);
    }

    return { ok: true as const, id: created.id, refCode };
  });

export const searchAppointmentStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://aauxkvtbkejcvmdsxfkq.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false },
    });

    const q = (data.query || "").trim();

    let query = supabase.from("appointments").select("*").order("created_at", { ascending: false });

    if (q) {
      if (q.includes("@")) {
        query = query.eq("email", q);
      } else {
        query = query.or(
          `project_details.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%,contact_name.ilike.%${q}%,phone.ilike.%${q}%,admin_notes.ilike.%${q}%`
        );
      }
    } else {
      query = query.limit(20);
    }

    let { data: results, error } = await query;

    if (error) {
      console.error("[searchAppointmentStatus] DB Error:", error);
    }

    // Fallback if query returns 0 rows
    if ((!results || results.length === 0) && q && !q.includes("@")) {
      const { data: fallback } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      results = fallback;
    }

    return (results || []) as unknown as Array<{
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
    }>;
  });
