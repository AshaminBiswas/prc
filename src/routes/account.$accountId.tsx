import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Loader2, User, Package, XCircle, RefreshCw, Truck, MapPin, ShoppingCart, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getOrEnsureProfileHash } from "@/lib/profile-utils";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccountCtx, type AccountProfile } from "@/lib/account-context";

import { checkIsAdminUser } from "@/lib/auth-guard";

type Profile = AccountProfile;

export { useAccount } from "@/lib/account-context";


export const Route = createFileRoute("/account/$accountId")({
  component: AccountLayout,
  head: () => ({
    meta: [
      { title: "My Account — PRC Hardware" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { to: "profile" as const, label: "Profile", Icon: User },
  { to: "orders" as const, label: "Orders", Icon: Package },
  { to: "track-order" as const, label: "Track Order", Icon: Truck },
  { to: "addresses" as const, label: "Addresses", Icon: MapPin },
  { to: "cart" as const, label: "My Cart", Icon: ShoppingCart },
];

function AccountLayout() {
  const { accountId } = useParams({ from: "/account/$accountId" });
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<{ profile: Profile; email: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "forbidden" | "admin_restricted" | "ready">("loading");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      if (isMounted.current) {
        navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      }
      return;
    }
    const uid = sess.session.user.id;
    const email = sess.session.user.email ?? "";

    // Strictly enforce Admin isolation: Admins cannot enter customer portal
    const isAdmin = await checkIsAdminUser(uid);
    if (!isMounted.current) return;
    if (isAdmin) {
      setStatus("admin_restricted");
      return;
    }

    // 1. Fetch user's own profile by authenticated user ID
    let { data: profile } = await supabase
      .from("profiles")
      .select("id, account_id, url_hash, full_name, avatar_url, phone, created_at")
      .eq("id", uid)
      .maybeSingle();

    if (!isMounted.current) return;

    // 2. Ensure profile exists and has url_hash
    if (!profile || !profile.url_hash) {
      await getOrEnsureProfileHash(sess.session.user);
      if (!isMounted.current) return;
      const { data: reProfile } = await supabase
        .from("profiles")
        .select("id, account_id, url_hash, full_name, avatar_url, phone, created_at")
        .eq("id", uid)
        .maybeSingle();
      profile = reProfile;
    }

    if (!isMounted.current) return;

    // 3. Redirect if URL accountId does not match user's actual url_hash
    if (profile?.url_hash && profile.url_hash !== accountId) {
      const segments = pathname.split("/");
      const lastSeg = segments[segments.length - 1];
      const validSub = TABS.some((t) => t.to === lastSeg) ? lastSeg : "profile";

      navigate({
        to: `/account/${profile.url_hash}/${validSub}` as never,
        replace: true,
      });
      return;
    }

    if (!profile || profile.id !== uid) {
      setStatus("forbidden");
      return;
    }
    setState({ profile: profile as Profile, email });
    setStatus("ready");
  }, [accountId, navigate, pathname]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "admin_restricted") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PromoBar />
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">Admin Portal Restricted</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Administrator accounts cannot access customer store accounts or shopping features.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate({ to: "/admin" })}>
              Go to Admin Dashboard
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }
  if (status === "forbidden" || !state) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PromoBar />
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">403 — Access denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You cannot view another user&apos;s account.
          </p>
          <Button onClick={() => navigate({ to: "/account" })} className="mt-6">
            Go to my account
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <AccountCtx.Provider value={{ profile: state.profile, email: state.email, refresh: load }}>
      <div className="min-h-screen bg-background text-foreground">
        <PromoBar />
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Account ID · {state.profile.account_id}
              </p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl">
                {state.profile.full_name || "Welcome"}
              </h1>
              <p className="text-sm text-muted-foreground">{state.email}</p>
            </div>
            <Button variant="outline" onClick={signOut} className="self-start sm:self-auto">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </motion.header>

          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <nav className="flex flex-row gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col lg:overflow-visible">
              {TABS.map(({ to, label, Icon }) => {
                const href = `/account/${accountId}/${to}`;
                const active =
                  pathname === href || pathname === `${href}/`;
                return (
                  <Link
                    key={to}
                    to={href as never}
                    aria-current={active ? "page" : undefined}
                    data-active={active ? "true" : "false"}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </main>
        <SiteFooter />
      </div>
    </AccountCtx.Provider>
  );
}
