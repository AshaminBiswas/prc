import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import imageSize from "image-size";

export type ImageRole =
  | "hero_image"
  | "craft_image"
  | "materials_image"
  | "closing_images"
  | "og_image";

type Spec = {
  label: string;
  targetW: number;
  targetH: number;
  minW: number;
  minH: number;
  ratioTolerance: number; // fraction, e.g. 0.1 = ±10%
};

const SPECS: Record<ImageRole, Spec> = {
  hero_image:      { label: "Hero",      targetW: 1800, targetH: 1000, minW: 1400, minH: 780,  ratioTolerance: 0.1 },
  craft_image:     { label: "Craft",     targetW: 1600, targetH: 1100, minW: 1200, minH: 825,  ratioTolerance: 0.1 },
  materials_image: { label: "Materials", targetW: 1600, targetH: 1100, minW: 1200, minH: 825,  ratioTolerance: 0.1 },
  closing_images:  { label: "Closing",   targetW: 1200, targetH: 900,  minW: 800,  minH: 600,  ratioTolerance: 0.2 },
  og_image:        { label: "OG / Social", targetW: 1200, targetH: 630, minW: 1000, minH: 525, ratioTolerance: 0.05 },
};

export type ValidationIssue = { role: ImageRole; url: string; error: string };
export type ValidationOk = { role: ImageRole; url: string; width: number; height: number };

async function validateOne(role: ImageRole, url: string): Promise<ValidationIssue | ValidationOk> {
  const spec = SPECS[role];
  try {
    const res = await fetch(url);
    if (!res.ok) return { role, url, error: `Could not download image (${res.status})` };
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > 15 * 1024 * 1024) {
      return { role, url, error: `${spec.label} image is over 15MB — please compress before upload` };
    }
    const dim = imageSize(buf);
    const w = dim.width ?? 0;
    const h = dim.height ?? 0;
    if (!w || !h) return { role, url, error: `${spec.label}: could not read image dimensions` };

    if (w < spec.minW || h < spec.minH) {
      return { role, url, error: `${spec.label} image is too small (${w}×${h}). Minimum ${spec.minW}×${spec.minH}, ideal ${spec.targetW}×${spec.targetH}.` };
    }

    const targetRatio = spec.targetW / spec.targetH;
    const actualRatio = w / h;
    const drift = Math.abs(actualRatio - targetRatio) / targetRatio;
    if (drift > spec.ratioTolerance) {
      const pct = Math.round(spec.ratioTolerance * 100);
      return {
        role,
        url,
        error: `${spec.label} aspect ratio is ${actualRatio.toFixed(2)}:1 but should be ~${targetRatio.toFixed(2)}:1 (${spec.targetW}×${spec.targetH}, ±${pct}%). Please crop and re-upload.`,
      };
    }
    return { role, url, width: w, height: h };
  } catch (e) {
    return { role, url, error: `${spec.label}: ${(e as Error).message}` };
  }
}

export const validateAboutImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { images: { role: ImageRole; url: string }[] }) => {
    if (!input || !Array.isArray(input.images)) throw new Error("Invalid payload");
    return input;
  })
  .handler(async ({ context, data }) => {
    // Admin only
    const { data: isAdmin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const results = await Promise.all(
      data.images.filter((i) => i.url).map((i) => validateOne(i.role, i.url)),
    );
    const errors = results.filter((r): r is ValidationIssue => "error" in r);
    const ok = results.filter((r): r is ValidationOk => "width" in r);
    return { ok: errors.length === 0, errors, valid: ok };
  });
