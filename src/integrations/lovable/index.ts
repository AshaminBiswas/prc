import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

/**
 * Thin wrapper that mirrors the old Lovable Cloud auth API shape,
 * now calling Supabase OAuth directly. This keeps auth.tsx unchanged.
 */
export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: opts?.redirect_uri ?? `${window.location.origin}/auth`,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error };
      }

      // Supabase redirects the browser itself — signal to the caller it's underway.
      return { redirected: true };
    },
  },
};
