import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  order_id: z.string().trim().min(1, "Order ID is required").max(100),
  product: z.string().trim().min(1, "Product is required").max(200),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid purchase date")
    .refine((v) => {
      const d = new Date(v + "T00:00:00Z");
      return !isNaN(d.getTime()) && d.getTime() <= Date.now();
    }, "Purchase date cannot be in the future"),
  issue: z.string().trim().min(10, "Please describe the issue (min 10 characters)").max(4000),
  contact_email: z.string().trim().email("Invalid email").max(255),
});

export const submitWarrantyClaim = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { error } = await supabase.from("warranty_claims").insert({
      order_id: data.order_id,
      product: data.product,
      purchase_date: data.purchase_date,
      issue: data.issue,
      contact_email: data.contact_email,
      status: "new",
    });

    if (error) {
      console.error("[warranty-claim] insert failed", error);
      throw new Error("Failed to submit claim. Please try again.");
    }

    return { ok: true as const };
  });
