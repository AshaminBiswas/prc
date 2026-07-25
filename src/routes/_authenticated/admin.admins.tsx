import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

type Role = "super_admin" | "manager" | "sales_manager" | "inventory_manager" | "content_manager" | "customer_support" | "marketing_manager";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const profiles = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string | null }[] };
      // Also fetch emails from auth users (stored in profiles or fallback to user_id)
      const map = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name] as const));
      return (data ?? []).map((r) => ({ ...r, full_name: map.get(r.user_id) ?? null }));
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role removed"); qc.invalidateQueries({ queryKey: ["admins"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Admin Users" description="Who has access to this admin panel." />
        <Link to="/admin/create-admin">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create Admin
          </Button>
        </Link>
      </div>

      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No admin users yet"
          description="Create the first admin account to get started."
          action={
            <Link to="/admin/create-admin">
              <Button className="gap-2"><UserPlus className="h-4 w-4" /> Create Admin</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {q.data!.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{r.full_name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.user_id.slice(0, 12)}…</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                      r.role === "super_admin"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-border text-muted-foreground"
                    }`}>
                      {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove.mutate(r.id)}
                      title="Remove role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
