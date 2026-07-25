import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const validateSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required").max(50),
  cartTotal: z.number().min(0).default(0),
});

type CouponResult = {
  valid: boolean;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  message: string;
};

export const validateCouponCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => validateSchema.parse(input))
  .handler(async ({ data }): Promise<CouponResult> => {
    const codeUpper = data.code.trim().toUpperCase();
    const cartTotal = data.cartTotal || 0;

    // Check Supabase offers table created by Admin
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://aauxkvtbkejcvmdsxfkq.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

    const { data: dbOffer, error } = await supabase
      .from("offers")
      .select("*")
      .ilike("name", codeUpper)
      .eq("status", "active")
      .maybeSingle();

    if (!error && dbOffer) {
      const isPercent = dbOffer.discount_type === "percentage";
      const val = Number(dbOffer.discount_value || 0);

      let discountAmount = isPercent ? Math.round((cartTotal * val) / 100) : val;
      if (cartTotal > 0 && discountAmount > cartTotal) discountAmount = cartTotal;

      return {
        valid: true,
        code: dbOffer.name.toUpperCase(),
        discountType: isPercent ? "percentage" : "fixed",
        discountValue: val,
        discountAmount: discountAmount || val,
        message: `Coupon ${dbOffer.name.toUpperCase()} applied! Saved ₹${discountAmount || val}.`,
      };
    }

    return {
      valid: false,
      code: codeUpper,
      discountType: "fixed",
      discountValue: 0,
      discountAmount: 0,
      message: `Invalid or inactive coupon code "${codeUpper}". Only active coupons created by admin are valid.`,
    };
  });

export const getActiveCoupons = createServerFn({ method: "GET" })
  .handler(async () => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://aauxkvtbkejcvmdsxfkq.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

    const { data: dbOffers } = await supabase
      .from("offers")
      .select("id, name, description, discount_type, discount_value")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return (dbOffers || []).map((o) => ({
      code: o.name.toUpperCase(),
      description: o.description || `${o.discount_type === "percentage" ? `${o.discount_value}% Off` : `₹${o.discount_value} Off`}`,
      type: o.discount_type,
      value: o.discount_value,
    }));
  });
