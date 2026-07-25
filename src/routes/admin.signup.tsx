import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/signup")({
  ssr: false,
  component: AdminSignupPage,
});

function AdminSignupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Public admin signup is disabled. New admin accounts must be created from inside the Admin Panel.");
    navigate({ to: "/admin/login", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
