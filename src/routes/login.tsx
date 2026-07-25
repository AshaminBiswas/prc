import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { ProtectedLogo } from "@/components/prch/ProtectedLogo";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { checkIsAdminUser } from "@/lib/auth-guard";

type Search = { redirect?: string; reset?: string };

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    reset: typeof s.reset === "string" ? s.reset : undefined,
  }),
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — PRC" },
      { name: "description", content: "Sign in to your PRC customer account." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, reset } = useSearch({ from: "/login" });
  const showResetSuccess = reset === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Strictly validate redirect: must start with '/' but NOT with '//' (open redirect) or '/admin'
    const isSafeRedirect = (r?: string) =>
      !!r && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/admin");
    const safeTarget = isSafeRedirect(redirect) ? redirect! : "/account";

    async function handleSessionCheck(sessionUser: { id: string } | null) {
      if (!sessionUser) return;
      const isAdmin = await checkIsAdminUser(sessionUser.id);
      if (isAdmin) {
        // Admin active session -> redirect to /admin dashboard
        navigate({ to: "/admin", replace: true });
      } else {
        // Customer active session -> redirect to customer account
        navigate({ to: safeTarget as never, replace: true });
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void handleSessionCheck(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) void handleSessionCheck(session.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (data.user) {
      const isAdmin = await checkIsAdminUser(data.user.id);
      if (isAdmin) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error("Admin accounts cannot log in through the customer store. Please use the Admin Portal.");
        navigate({ to: "/admin/login", replace: true });
        return;
      }
    }

    setLoading(false);
    toast.success("Welcome back");
  }

  async function signInGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed");
    }
  }

  const [resetAttempts, setResetAttempts] = useState(0);

  async function forgotPassword() {
    if (!email) return toast.error("Enter your email above first");

    if (resetAttempts >= 5) {
      return toast.error("Maximum 5 reset attempts reached. Please check your inbox or wait a few minutes.");
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
          toast.error("Rate limit reached. Please wait 60 seconds or update rate limit in Supabase Dashboard.");
        } else {
          toast.error(error.message);
        }
      } else {
        setResetAttempts((n) => n + 1);
        toast.success(`Check your inbox for a password reset link (Attempt ${resetAttempts + 1}/5)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <ProtectedLogo className="mx-auto h-16 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">Customer Sign in</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {showResetSuccess && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <p className="font-medium">Password reset successful</p>
              <p className="mt-1 text-emerald-600/80 dark:text-emerald-400/80">
                Your password has been updated. Please sign in with your new password.
              </p>
            </div>
          )}
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={forgotPassword}
                  disabled={resetting}
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {resetting ? "Sending…" : "Forgot?"}
                </button>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" onClick={signInGoogle} disabled={loading} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.9 6.9 0 0 1 0-4.42V6.84H2.18a11 11 0 0 0 0 10.1l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.84l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to PRC?{" "}
            <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
