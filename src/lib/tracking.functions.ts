import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  order_number: z.string().trim().min(3, "Order number is required").max(64),
  email: z.string().trim().email("Invalid email").max(255),
});

export type TrackingResult = {
  found: boolean;
  order_number?: string;
  status?: string | null;
  payment_status?: string | null;
  delivery_status?: string | null;
  tracking_number?: string | null;
  placed_at?: string | null;
  updated_at?: string | null;
  timeline?: Array<{ label: string; completed: boolean; date?: string | null }>;
};

const ORDER_STAGES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

function buildTimeline(
  status: string | null,
  deliveryStatus: string | null,
  placedAt: string | null,
  updatedAt: string | null,
): TrackingResult["timeline"] {
  const s = (deliveryStatus || status || "pending").toLowerCase();
  const idx = Math.max(0, ORDER_STAGES.findIndex((x) => x === s));
  return ORDER_STAGES.map((stage, i) => ({
    label: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    completed: i <= idx,
    date: i === 0 ? placedAt : i === idx ? updatedAt : null,
  }));
}

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<TrackingResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up by order_number, then verify against customer email via profiles or shipping_address
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, status, payment_status, delivery_status, tracking_number, created_at, updated_at, customer_id, shipping_address",
      )
      .eq("order_number", data.order_number)
      .maybeSingle();

    if (error) {
      console.error("[track-order] lookup failed", error);
      throw new Error("Unable to look up order. Please try again.");
    }

    if (!order) {
      return { found: false };
    }

    // Verify email matches either the customer's auth email or the shipping address email
    const providedEmail = data.email.toLowerCase();
    let emailMatches = false;

    const shipEmail =
      (order.shipping_address as { email?: string } | null)?.email?.toLowerCase() ?? null;
    if (shipEmail && shipEmail === providedEmail) emailMatches = true;

    if (!emailMatches && order.customer_id) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.customer_id);
      const authEmail = userRes?.user?.email?.toLowerCase();
      if (authEmail && authEmail === providedEmail) emailMatches = true;
    }

    if (!emailMatches) {
      // Do not disclose existence — return not found on email mismatch.
      return { found: false };
    }

    return {
      found: true,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      delivery_status: order.delivery_status,
      tracking_number: order.tracking_number,
      placed_at: order.created_at,
      updated_at: order.updated_at,
      timeline: buildTimeline(order.status, order.delivery_status, order.created_at, order.updated_at),
    };
  });
