import { createContext, useContext } from "react";

export type AccountProfile = {
  id: string;
  account_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
};

export const AccountCtx = createContext<{
  profile: AccountProfile;
  email: string;
  refresh: () => Promise<void>;
} | null>(null);

export function useAccount() {
  const ctx = useContext(AccountCtx);
  if (!ctx) throw new Error("useAccount outside layout");
  return ctx;
}
