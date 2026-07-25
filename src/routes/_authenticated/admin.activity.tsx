import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatDate } from "@/lib/admin-utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["activity", q],
    queryFn: async () => {
      let req = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) req = req.ilike("action", `%${q}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Activity Logs" description="Every admin action, recorded." />
      <div className="mb-4"><Input placeholder="Search actions…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {query.isLoading ? <TableSkeleton /> : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No activity" />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">When</th></tr>
            </thead>
            <tbody>
              {query.data!.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-3 text-xs">{a.entity_type ?? "—"}{a.entity_id ? ` · ${String(a.entity_id).slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
