import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, PackageX } from "lucide-react";
import { useState } from "react";
import { logActivity } from "@/lib/admin-utils";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, sku, stock, min_stock").order("stock", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const adjust = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
      void logActivity("stock_adjust", "products", id, { stock });
    },
    onSuccess: () => { toast.success("Stock updated"); qc.invalidateQueries({ queryKey: ["inventory"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Inventory" description="Current stock levels and adjustments." />
      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="No products yet" description="Add products to manage inventory." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {q.data!.map((p) => <Row key={p.id} p={p} onSave={(v) => adjust.mutate({ id: p.id, stock: v })} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ p, onSave }: { p: { id: string; name: string; sku: string | null; stock: number; min_stock: number }; onSave: (v: number) => void }) {
  const [v, setV] = useState<string>(String(p.stock));
  const alert = p.stock === 0 ? <PackageX className="h-4 w-4 text-red-500" /> : p.stock <= p.min_stock ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : null;
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-medium">{p.name}</td>
      <td className="px-4 py-3 font-mono text-xs">{p.sku ?? "—"}</td>
      <td className="px-4 py-3"><div className="inline-flex items-center gap-2">{p.stock}{alert}</div></td>
      <td className="px-4 py-3">{p.min_stock}</td>
      <td className="px-4 py-3">
        <div className="inline-flex gap-2">
          <Input type="number" value={v} onChange={(e) => setV(e.target.value)} className="h-8 w-24" />
          <Button size="sm" variant="outline" onClick={() => onSave(Number(v))}>Save</Button>
        </div>
      </td>
    </tr>
  );
}
