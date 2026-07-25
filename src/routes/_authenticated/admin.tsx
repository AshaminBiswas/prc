import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdminUser } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();

    // 1. Unauthenticated -> Redirect to Admin Login
    if (error || !data?.user) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }

    // 2. Customer / Non-admin -> Strict Role Guard
    const isAdmin = await checkIsAdminUser(data.user.id);
    if (!isAdmin) {
      throw redirect({
        to: "/admin/login",
        search: { error: "unauthorized" },
        replace: true,
      });
    }

    return { user: data.user, isAdmin: true };
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "PRC Admin Panel" }, { name: "robots", content: "noindex" }] }),
});

function AdminLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [paletteBump, setPaletteBump] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function verifyAdminAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        if (mounted) setAuthorized(false);
        navigate({ to: "/admin/login", replace: true });
        return;
      }

      setEmail(data.user.email ?? null);
      const isAdmin = await checkIsAdminUser(data.user.id);

      if (!isAdmin) {
        if (mounted) setAuthorized(false);
        await supabase.auth.signOut();
        toast.error("Access denied: Admin permissions required.");
        navigate({ to: "/admin/login", replace: true });
      } else {
        if (mounted) setAuthorized(true);
      }
    }

    void verifyAdminAuth();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function adminSignOut() {
    await supabase.auth.signOut();
    toast.success("Admin signed out");
    navigate({ to: "/admin/login", replace: true });
  }

  function openPalette() {
    const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    document.dispatchEvent(ev);
    setPaletteBump((n) => n + 1);
  }

  if (authorized === null) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Verifying Admin Security Clearance…
        </p>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-3" />
        <h1 className="font-serif text-2xl font-semibold">Access Denied</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          You do not have authorization to view the PRC Admin Panel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block">
        <AdminSidebar onSignOut={adminSignOut} collapsed={collapsed} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <AdminSidebar onSignOut={adminSignOut} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          userEmail={email}
          onOpenPalette={openPalette}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) setMobileOpen((v) => !v);
            else setCollapsed((v) => !v);
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette key={paletteBump} />
    </div>
  );
}
