import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      const loginPath = location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
      throw redirect({ to: loginPath, search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
