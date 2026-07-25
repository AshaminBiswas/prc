import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatCurrency, formatDate, logActivity } from "@/lib/admin-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled", "refunded", "returned"];

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      void logActivity("order_status_update", "orders", id, { status });
    },
    onSuccess: () => { toast.success("Order updated"); qc.invalidateQueries({ queryKey: ["orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Orders" description="Order lifecycle, payments and delivery." />
      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="No orders yet" description="Orders placed on the storefront will show up here." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {q.data!.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><div className="font-medium">{o.order_number}</div></td>
                  <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(o.total))}</td>
                  <td className="px-4 py-3 text-xs">{o.payment_status}</td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v })}>
                      <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
