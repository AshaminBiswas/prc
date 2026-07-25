import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdminUser } from "@/lib/auth-guard";
import { ProtectedLogo } from "@/components/prch/ProtectedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldAlert, Lock } from "lucide-react";

type AdminSearch = { redirect?: string; error?: string };

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): AdminSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In — PRC" },
      { name: "description", content: "Isolated admin portal authentication." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // On mount, if user is already logged in, check if they are an admin
  useEffect(() => {
    let mounted = true;
    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const isAdmin = await checkIsAdminUser(data.session.user.id);
        if (isAdmin && mounted) {
          navigate({ to: search.redirect ?? "/admin", replace: true });
          return;
        }
      }
      if (mounted) setChecking(false);
    }

    void checkExistingSession();
    return () => {
      mounted = false;
    };
  }, [navigate, search.redirect]);

  async function handleAdminSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        setLoading(false);
        return toast.error(error?.message ?? "Invalid admin credentials");
      }

      // Check Admin Role
      const isAdmin = await checkIsAdminUser(data.user.id);

      if (!isAdmin) {
        // Customer or non-admin account! Revoke session immediately
        await supabase.auth.signOut();
        setLoading(false);
        toast.error("Access Denied: Account does not have admin privileges.");
        return;
      }

      toast.success("Authenticated — Welcome to Admin Panel");
      navigate({ to: search.redirect ?? "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <ProtectedLogo className="mx-auto h-16 w-auto object-contain" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground">
            <Lock className="h-3 w-3" /> Admin Security Portal
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-md md:p-8">
          {search.error === "unauthorized" && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Unauthorized Access Attempt</p>
                <p className="mt-0.5 opacity-90">
                  Your account does not have admin privileges. Only authorized administrators can access this portal.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@prchardware.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-xs uppercase tracking-[0.2em]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Sign in to Admin
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground underline underline-offset-4">
            Switch to Customer Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
