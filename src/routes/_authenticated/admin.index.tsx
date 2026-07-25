import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, FadeIn, TableSkeleton } from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/admin-utils";
import {
  Package, Boxes, ShoppingCart, Users, Percent, Ticket, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [products, orders, customers, offers, coupons] = await Promise.all([
        supabase.from("products").select("id, status, stock, min_stock", { count: "exact" }),
        supabase.from("orders").select("id, status, total, created_at", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id, status", { count: "exact" }),
        supabase.from("coupons").select("id", { count: "exact" }),
      ]);
      const active = products.data?.filter((p) => p.status === "published").length ?? 0;
      const outOfStock = products.data?.filter((p) => (p.stock ?? 0) === 0).length ?? 0;
      const lowStock = products.data?.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.min_stock ?? 0)).length ?? 0;
      const runningOffers = offers.data?.filter((o) => o.status === "active").length ?? 0;
      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total ?? 0), 0) ?? 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrders = orders.data?.filter((o) => new Date(o.created_at) >= today) ?? [];
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
      const statusCount = (s: string) => orders.data?.filter((o) => o.status === s).length ?? 0;
      return {
        products: products.count ?? 0,
        activeProducts: active,
        outOfStock, lowStock, runningOffers,
        orders: orders.count ?? 0,
        customers: customers.count ?? 0,
        coupons: coupons.count ?? 0,
        totalRevenue, todaySales,
        pending: statusCount("pending"),
        completed: statusCount("completed"),
        cancelled: statusCount("cancelled"),
        refunded: statusCount("refunded"),
        recent: (orders.data ?? []).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
      };
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Live overview of PRC commerce and content." />

      {stats.isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="Today's Sales" value={formatCurrency(stats.data!.todaySales)} />
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="Total Revenue" value={formatCurrency(stats.data!.totalRevenue)} />
            <KPI icon={<ShoppingCart className="h-4 w-4" />} label="Orders" value={String(stats.data!.orders)} />
            <KPI icon={<Users className="h-4 w-4" />} label="Customers" value={String(stats.data!.customers)} />
            <KPI icon={<Package className="h-4 w-4" />} label="Active Products" value={String(stats.data!.activeProducts)} sub={`${stats.data!.products} total`} />
            <KPI icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} label="Low Stock" value={String(stats.data!.lowStock)} />
            <KPI icon={<Boxes className="h-4 w-4 text-red-500" />} label="Out of Stock" value={String(stats.data!.outOfStock)} />
            <KPI icon={<Percent className="h-4 w-4" />} label="Running Offers" value={String(stats.data!.runningOffers)} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatusCard label="Pending Orders" value={stats.data!.pending} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
            <StatusCard label="Completed" value={stats.data!.completed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
            <StatusCard label="Cancelled / Refunded" value={stats.data!.cancelled + stats.data!.refunded} icon={<XCircle className="h-4 w-4 text-red-500" />} />
          </div>

          <FadeIn delay={0.1}>
            <div className="mt-8 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-serif text-lg">Latest Orders</h2>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </div>
              {stats.data!.recent.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">No orders yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.data!.recent.map((o: { id: string; status: string; total: number; created_at: string }) => (
                    <li key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <div className="font-mono text-xs">{o.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest">{o.status}</span>
                        <span className="font-medium">{formatCurrency(Number(o.total))}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <FadeIn>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] uppercase tracking-[0.28em]">{label}</span>
          {icon}
        </div>
        <div className="mt-3 font-serif text-2xl">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </FadeIn>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</div>
        <div className="mt-2 font-serif text-2xl">{value}</div>
      </div>
      {icon}
    </div>
  );
}
