import { supabase } from "@/integrations/supabase/client";

/**
 * Computes a stable, deterministic account_id and url_hash from a user's UUID
 * as a fallback if the DB triggers haven't set them yet.
 */
export function getDeterministicAccountHash(uid: string): { accountId: string; urlHash: string } {
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, "");
  const code = cleanUid.slice(0, 8).toUpperCase();
  const accountId = `ACC-${code}`;
  const urlHash = `acc${code.toLowerCase()}`;
  return { accountId, urlHash };
}

export async function getOrEnsureProfileHash(user: {
  id: string;
  user_metadata?: Record<string, unknown>;
  email?: string;
}): Promise<string> {
  const uid = user.id;

  // 1. Fetch existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("url_hash, account_id")
    .eq("id", uid)
    .maybeSingle();

  if (profile?.url_hash) {
    return profile.url_hash;
  }

  // 2. Derive stable deterministic IDs
  const deterministic = getDeterministicAccountHash(uid);
  const accountId = profile?.account_id || deterministic.accountId;
  const urlHash = deterministic.urlHash;

  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    null;
  const avatarUrl = (user.user_metadata?.avatar_url as string) || null;

  // 3. Upsert profile with stable url_hash
  const { data: upserted } = await supabase
    .from("profiles")
    .upsert(
      {
        id: uid,
        account_id: accountId,
        url_hash: urlHash,
        full_name: fullName,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" }
    )
    .select("url_hash")
    .maybeSingle();

  if (upserted?.url_hash) {
    return upserted.url_hash;
  }

  return urlHash;
}
