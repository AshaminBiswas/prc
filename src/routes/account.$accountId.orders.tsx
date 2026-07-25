import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  tracking_number: string | null;
  total: number;
  items: Array<{ name?: string; image?: string; quantity?: number; price?: number }> | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
};

export function useOrders(customerId: string, filter?: (o: Order) => boolean) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as unknown as Order[]) ?? []));
  }, [customerId]);
  return useMemo(() => (orders ? (filter ? orders.filter(filter) : orders) : null), [orders, filter]);
}

export const Route = createFileRoute("/account/$accountId/orders")({
  component: OrdersTab,
});

function OrdersTab() {
  const { profile } = useAccount();
  const orders = useOrders(profile.id);

  if (!orders) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No orders yet</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Order · {order.order_number}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusPill label={`Status: ${order.status}`} tone={statusTone(order.status)} />
          <StatusPill label={`Payment: ${order.payment_status}`} />
          <StatusPill label={`Delivery: ${order.delivery_status}`} />
        </div>
      </header>
      <ul className="divide-y divide-border">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            {it.image ? (
              <img src={it.image} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted" />
            )}
            <div className="flex-1">
              <p className="text-sm">{it.name ?? "Item"}</p>
              <p className="text-xs text-muted-foreground">Qty {it.quantity ?? 1}</p>
            </div>
            <p className="text-sm">₹{(it.price ?? 0).toLocaleString()}</p>
          </li>
        ))}
      </ul>
      <footer className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="text-sm">Total: <strong>₹{order.total.toLocaleString()}</strong></p>
        <div className="flex gap-2">
          {order.tracking_number && (
            <Button variant="outline" size="sm">
              Track: {order.tracking_number}
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

function statusTone(s: string) {
  if (["cancelled", "returned"].includes(s)) return "danger";
  if (["delivered", "refunded"].includes(s)) return "success";
  return "default";
}

function StatusPill({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "danger" }) {
  const cls =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-foreground/70";
  return <span className={`rounded-full px-2 py-1 uppercase tracking-widest ${cls}`}>{label}</span>;
}
