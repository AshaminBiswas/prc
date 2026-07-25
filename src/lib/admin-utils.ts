import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("activity_logs").insert({
      admin_id: data.user.id,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      details: (details ?? null) as never,
    });
  } catch {
    // swallow — activity logging is best-effort
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
