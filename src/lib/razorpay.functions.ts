import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "crypto";
import { z } from "zod";

const itemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  image: z.string().nullable(),
  slug: z.string().nullable(),
  variant: z.string().nullable(),
  material_finish: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  gst: z.number().nonnegative(),
  line_total: z.number().nonnegative(),
});

const addressSchema = z.object({
  id: z.string().optional(),
  full_name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  pin_code: z.string(),
  country: z.string(),
}).passthrough();

const totalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().positive(),
});

/**
 * Create a Razorpay order AND stash a pending_orders row so the webhook can
 * finalize the order even if the customer closes the checkout window before
 * client-side verification completes.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    totalPaise: number;
    receipt: string;
    items: z.infer<typeof itemSchema>[];
    address: z.infer<typeof addressSchema>;
    totals: z.infer<typeof totalsSchema>;
    payment_method: "upi" | "card";
  }) =>
    z.object({
      totalPaise: z.number().int().positive().max(100_000_000),
      receipt: z.string().min(1).max(40),
      items: z.array(itemSchema).min(1),
      address: addressSchema,
      totals: totalsSchema,
      payment_method: z.enum(["upi", "card"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay not configured");

    // Sanity-check: server-computed total matches passed paise
    const expectedPaise = Math.round(data.totals.total * 100);
    if (expectedPaise !== data.totalPaise) {
      throw new Error("Amount mismatch");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: data.totalPaise,
        currency: "INR",
        receipt: data.receipt,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Razorpay order create failed", res.status, body);
      throw new Error(`Payment gateway error [${res.status}]`);
    }

    const order = (await res.json()) as { id: string; amount: number; currency: string };

    // Stash intent for the webhook fallback.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: pErr } = await supabaseAdmin.from("pending_orders").insert({
      razorpay_order_id: order.id,
      customer_id: context.userId,
      items: data.items as unknown as never,
      shipping_address: data.address as unknown as never,
      billing_address: data.address as unknown as never,
      subtotal: data.totals.subtotal,
      tax: data.totals.tax,
      shipping: data.totals.shipping,
      total: data.totals.total,
      payment_method: data.payment_method,
    });
    if (pErr) {
      console.error("pending_orders insert failed", pErr);
      // Non-fatal for the client — client-verify still works.
    }

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  });

/**
 * Verify Razorpay signature, then insert the order and clear the cart. Idempotent:
 * if the webhook has already finalized this razorpay_order_id, we return that order.
 */
export const verifyAndPlaceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay not configured");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      throw new Error("Payment signature verification failed");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotency: has the webhook (or a prior call) already placed this order?
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("payment_gateway_order_id", data.razorpay_order_id)
      .maybeSingle();
    if (existing) {
      return { orderId: existing.id, paymentId: data.razorpay_payment_id, alreadyPlaced: true };
    }

    // Load stashed intent, verifying the caller owns it.
    const { data: pending, error: pErr } = await supabaseAdmin
      .from("pending_orders")
      .select("*")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();
    if (pErr || !pending) throw new Error("Pending order not found");
    if (pending.customer_id !== context.userId) throw new Error("Forbidden");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: context.userId,
        status: "confirmed",
        payment_status: "paid",
        payment_method: pending.payment_method,
        delivery_status: "pending",
        subtotal: pending.subtotal,
        tax: pending.tax,
        shipping: pending.shipping,
        discount: 0,
        total: pending.total,
        items: pending.items as unknown as never,
        shipping_address: pending.shipping_address as unknown as never,
        billing_address: pending.billing_address as unknown as never,
        payment_reference: data.razorpay_payment_id,
        payment_gateway_order_id: data.razorpay_order_id,
      })
      .select("id")
      .single();

    if (error) {
      // If the webhook raced us, unique index gives 23505 — fetch existing.
      const { data: raced } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("payment_gateway_order_id", data.razorpay_order_id)
        .maybeSingle();
      if (raced) {
        return { orderId: raced.id, paymentId: data.razorpay_payment_id, alreadyPlaced: true };
      }
      console.error("Order insert failed after payment", error, { payment_id: data.razorpay_payment_id });
      throw new Error("Payment received but order could not be saved. Contact support with payment id " + data.razorpay_payment_id);
    }

    await supabaseAdmin.from("pending_orders").update({
      status: "finalized",
      finalized_order_id: order.id,
    }).eq("razorpay_order_id", data.razorpay_order_id);

    await supabaseAdmin.from("cart_items").delete().eq("user_id", context.userId);

    return { orderId: order.id, paymentId: data.razorpay_payment_id, alreadyPlaced: false };
  });

/**
 * Cash-on-delivery: no gateway call. Order is placed directly with
 * payment_status = 'pending'.
 */
export const placeCodOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    items: z.infer<typeof itemSchema>[];
    address: z.infer<typeof addressSchema>;
    totals: z.infer<typeof totalsSchema>;
  }) =>
    z.object({
      items: z.array(itemSchema).min(1),
      address: addressSchema,
      totals: totalsSchema,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: userId,
        status: "pending",
        payment_status: "pending",
        payment_method: "cod",
        delivery_status: "pending",
        subtotal: data.totals.subtotal,
        tax: data.totals.tax,
        shipping: data.totals.shipping,
        discount: 0,
        total: data.totals.total,
        items: data.items as unknown as never,
        shipping_address: data.address as unknown as never,
        billing_address: data.address as unknown as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("cart_items").delete().eq("user_id", userId);
    return { orderId: order.id };
  });
