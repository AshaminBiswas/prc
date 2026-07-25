import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Lock, Mail } from "lucide-react";
import { PromoBar } from "@/components/prch/PromoBar";
import { SiteHeader } from "@/components/prch/SiteHeader";
import { SiteFooter } from "@/components/prch/SiteFooter";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — PRC" },
      { name: "description", content: "Set a new password for your PRC account." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const EASE = [0.22, 1, 0.36, 1] as const;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash on load and fires
    // a PASSWORD_RECOVERY event. We listen for it to unlock the form.
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setAuthorized(true);
        setReady(true);
      }
    });
    // Also check any existing session (user may have opened link in a tab
    // that already had a session, or hash already consumed on hot reload).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setAuthorized(true);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { reset: "success" }, replace: true });
  }

  async function resendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      return toast.error("Enter a valid email address");
    }
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox for a new reset link");
    setResendEmail("");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
          <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-serif text-2xl">Reset password</h1>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Choose a new password
                </p>
              </div>
            </div>

            {!ready ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !authorized ? (
              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    This reset link is invalid or has expired. Enter your email below and we’ll send a fresh link.
                  </p>
                </div>
                <form onSubmit={resendResetEmail} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="resend-email">Email address</Label>
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resending}>
                    {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resend reset email
                  </Button>
                </form>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Go to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthorized(false);
                    setResendEmail("");
                  }}
                  className="w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  Link expired? Resend reset email
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}
