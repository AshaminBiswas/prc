import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getOrEnsureProfileHash } from "@/lib/profile-utils";

export const Route = createFileRoute("/account/")({
  component: AccountRedirect,
});

function AccountRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/login", search: { redirect: "/account" }, replace: true });
        return;
      }
      const hash = await getOrEnsureProfileHash(sess.session.user);
      navigate({
        to: "/account/$accountId/profile",
        params: { accountId: hash },
        replace: true,
      });
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
