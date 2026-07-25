import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Razorpay-Signature",
};

type WebhookPayment = {
  id: string;
  order_id: string;
  status: string;
  method?: string;
};

type WebhookEvent = {
  event: string;
  payload: {
    payment?: { entity: WebhookPayment };
    order?: { entity: { id: string; status: string } };
  };
};

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("RAZORPAY_WEBHOOK_SECRET not configured");
          return new Response("Webhook not configured", { status: 500, headers: CORS });
        }

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();

        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        let ok = false;
        try {
          const a = Buffer.from(signature, "utf8");
          const b = Buffer.from(expected, "utf8");
          ok = a.length === b.length && timingSafeEqual(a, b);
        } catch {
          ok = false;
        }

        // Attempt to parse for logging even on failure
        let parsed: WebhookEvent | null = null;
        try { parsed = JSON.parse(raw) as WebhookEvent; } catch { /* noop */ }

        const logEvent = async (fields: {
          outcome: string;
          note?: string;
          signature_valid: boolean;
          finalized_order_id?: string | null;
        }) => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("razorpay_webhook_events").insert({
              event_type: parsed?.event ?? null,
              razorpay_order_id:
                parsed?.payload?.payment?.entity?.order_id ??
                parsed?.payload?.order?.entity?.id ??
                null,
              razorpay_payment_id: parsed?.payload?.payment?.entity?.id ?? null,
              signature_valid: fields.signature_valid,
              outcome: fields.outcome,
              note: fields.note ?? null,
              finalized_order_id: fields.finalized_order_id ?? null,
              payload: parsed as unknown as never,
            });
          } catch (e) {
            console.error("Failed to log webhook event", e);
          }
        };

        if (!ok) {
          await logEvent({ outcome: "invalid_signature", signature_valid: false });
          return new Response("Invalid signature", { status: 401, headers: CORS });
        }

        if (!parsed) {
          await logEvent({ outcome: "invalid_json", signature_valid: true });
          return new Response("Invalid JSON", { status: 400, headers: CORS });
        }
        const event = parsed;

        // Only act on terminal, money-received events.
        const isPaid =
          event.event === "payment.captured" || event.event === "order.paid";
        if (!isPaid) {
          await logEvent({ outcome: "ignored", note: event.event, signature_valid: true });
          return new Response(JSON.stringify({ ignored: event.event }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const payment = event.payload.payment?.entity;
        const orderId = payment?.order_id ?? event.payload.order?.entity.id;
        if (!orderId) {
          await logEvent({ outcome: "missing_order_id", signature_valid: true });
          return new Response("Missing order id", { status: 400, headers: CORS });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotent: if already placed, ack.
        const { data: existing } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("payment_gateway_order_id", orderId)
          .maybeSingle();
        if (existing) {
          await logEvent({
            outcome: "already_finalized",
            signature_valid: true,
            finalized_order_id: existing.id,
          });
          return new Response(JSON.stringify({ ok: true, orderId: existing.id, already: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const { data: pending } = await supabaseAdmin
          .from("pending_orders")
          .select("*")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();
        if (!pending) {
          console.warn("Webhook: no pending_orders row for", orderId);
          await logEvent({ outcome: "no_pending", signature_valid: true });
          return new Response(JSON.stringify({ ok: true, note: "no_pending" }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .insert({
            customer_id: pending.customer_id,
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
            payment_reference: payment?.id ?? null,
            payment_gateway_order_id: orderId,
          })
          .select("id")
          .single();

        if (error) {
          // Race with the client verify path — the unique index will have finalized it.
          const { data: raced } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("payment_gateway_order_id", orderId)
            .maybeSingle();
          if (raced) {
            await logEvent({
              outcome: "already_finalized_race",
              signature_valid: true,
              finalized_order_id: raced.id,
            });
            return new Response(JSON.stringify({ ok: true, orderId: raced.id, already: true }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          console.error("Webhook order insert failed", error);
          await logEvent({
            outcome: "insert_failed",
            note: error.message,
            signature_valid: true,
          });
          return new Response("Order save failed", { status: 500, headers: CORS });
        }

        await supabaseAdmin
          .from("pending_orders")
          .update({ status: "finalized", finalized_order_id: order.id })
          .eq("razorpay_order_id", orderId);

        await supabaseAdmin.from("cart_items").delete().eq("user_id", pending.customer_id);

        await logEvent({
          outcome: "finalized",
          signature_valid: true,
          finalized_order_id: order.id,
        });

        return new Response(JSON.stringify({ ok: true, orderId: order.id }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
