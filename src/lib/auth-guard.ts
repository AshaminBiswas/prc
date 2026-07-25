import { supabase } from "@/integrations/supabase/client";

export type AdminRole =
  | "super_admin"
  | "manager"
  | "sales_manager"
  | "inventory_manager"
  | "content_manager"
  | "customer_support"
  | "marketing_manager";

/**
 * IMPORTANT: These must exactly match the `app_role` enum values in the Supabase database.
 */
export const VALID_ADMIN_ROLES: string[] = [
  "super_admin",
  "manager",
  "sales_manager",
  "inventory_manager",
  "content_manager",
  "customer_support",
  "marketing_manager",
];

/**
 * Checks whether a given user ID has an active admin role in the `user_roles` table.
 * Returns false for regular customers or unauthenticated users.
 */
export async function checkIsAdminUser(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error || !data || data.length === 0) {
      return false;
    }

    return data.some((r) => VALID_ADMIN_ROLES.includes(String(r.role)));
  } catch (err) {
    console.error("[AuthGuard] Error checking admin role:", err);
    return false;
  }
}
