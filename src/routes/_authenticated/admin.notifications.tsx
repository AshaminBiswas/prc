import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatDate } from "@/lib/admin-utils";
import { Bell, AlertTriangle, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const [lowStock, orders] = await Promise.all([
        supabase.from("products").select("id, name, stock, min_stock").order("stock", { ascending: true }).limit(20),
        supabase.from("orders").select("id, order_number, status, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(20),
      ]);
      const items: { icon: React.ReactNode; title: string; sub: string; at: string }[] = [];
      lowStock.data?.filter((p) => p.stock <= (p.min_stock ?? 0)).forEach((p) => items.push({
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, title: `Low stock: ${p.name}`, sub: `Only ${p.stock} left`, at: "",
      }));
      orders.data?.forEach((o) => items.push({
        icon: <ShoppingCart className="h-4 w-4" />, title: `New order ${o.order_number}`, sub: "Pending review", at: formatDate(o.created_at),
      }));
      return items;
    },
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Low stock, new orders and admin alerts." />
      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="You're all caught up" description="No alerts right now." />
      ) : (
        <ul className="space-y-2">
          {q.data!.map((n, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {n.icon}
              <div className="flex-1">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.sub}</div>
              </div>
              <div className="text-xs text-muted-foreground">{n.at}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
