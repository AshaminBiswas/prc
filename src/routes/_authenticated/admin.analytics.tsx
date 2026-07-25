import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, FadeIn } from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/admin-utils";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("total, created_at, status, items"),
        supabase.from("products").select("id, name, price, stock, best_seller, category_id"),
        supabase.from("profiles").select("id, created_at"),
      ]);
      const revenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
      const orderCount = orders.data?.length ?? 0;
      const aov = orderCount ? revenue / orderCount : 0;
      // Revenue by month (last 6 months)
      const now = new Date();
      const buckets: { label: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString("en-IN", { month: "short" });
        const start = d.getTime();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
        const total = (orders.data ?? []).filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= start && t < end;
        }).reduce((s, o) => s + Number(o.total ?? 0), 0);
        buckets.push({ label, total });
      }
      const max = Math.max(1, ...buckets.map((b) => b.total));
      return {
        revenue, orderCount, aov,
        customers: customers.data?.length ?? 0,
        activeProducts: products.data?.filter((p) => p.stock > 0).length ?? 0,
        buckets: buckets.map((b) => ({ ...b, pct: (b.total / max) * 100 })),
      };
    },
  });

  return (
    <div>
      <PageHeader title="Analytics" description="Business trends and top performers." />
      {q.isLoading ? <TableSkeleton /> : (
        <FadeIn>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="Revenue" value={formatCurrency(q.data!.revenue)} />
            <Card label="Orders" value={String(q.data!.orderCount)} />
            <Card label="AOV" value={formatCurrency(q.data!.aov)} />
            <Card label="Customers" value={String(q.data!.customers)} />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-serif text-lg">Revenue — Last 6 months</h2>
            <div className="flex h-48 items-end gap-3">
              {q.data!.buckets.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t bg-primary transition-all" style={{ height: `${b.pct}%` }} title={formatCurrency(b.total)} />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-2xl">{value}</div>
    </div>
  );
}
