import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated/admin/create-admin")({
  component: CreateAdminPage,
  head: () => ({
    meta: [
      { title: "Create Admin — PRC Admin Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Role =
  | "super_admin"
  | "manager"
  | "sales_manager"
  | "inventory_manager"
  | "content_manager"
  | "customer_support"
  | "marketing_manager";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Full access to all admin features" },
  { value: "manager", label: "Manager", description: "Manage products, orders and customers" },
  { value: "sales_manager", label: "Sales Manager", description: "Access orders and customer data" },
  { value: "inventory_manager", label: "Inventory Manager", description: "Manage products and inventory" },
  { value: "content_manager", label: "Content Manager", description: "Manage banners, blog and CMS" },
  { value: "customer_support", label: "Customer Support", description: "View orders and handle messages" },
  { value: "marketing_manager", label: "Marketing Manager", description: "Manage offers, coupons and banners" },
];

function CreateAdminPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the auth user via Supabase signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/admin/login`,
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        toast.error("Account created but user ID not returned. Check Supabase Auth.");
        setLoading(false);
        return;
      }

      // Step 2: Assign role in user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role: role as never },
          { onConflict: "user_id,role" }
        );

      if (roleError) {
        toast.error(`User created but role assignment failed: ${roleError.message}`);
        setLoading(false);
        return;
      }

      // Step 3: Ensure profile record exists
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, full_name: fullName } as never,
          { onConflict: "id" }
        );

      if (profileError) {
        // Non-fatal — profile will be created on first login via trigger
        console.warn("[CreateAdmin] Profile upsert warning:", profileError.message);
      }

      toast.success(`Admin account created for ${email}. They will receive a confirmation email.`);
      navigate({ to: "/admin/admins" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create Admin Account"
        description="Add a new admin user to the panel. They will receive a confirmation email."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="e.g. John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirm Password</Label>
            <Input
              id="admin-confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Role</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    role === r.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:border-foreground/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm font-medium">{r.label}</span>
                  </div>
                  <p className={`mt-1 text-[11px] ${role === r.value ? "text-background/70" : "text-muted-foreground"}`}>
                    {r.description}
                  </p>
                </button>
              ))}
            </div>
            {selectedRole && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-semibold text-foreground">{selectedRole.label}</span> — {selectedRole.description}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? "Creating…" : "Create Admin Account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: "/admin/admins" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
