import { createFileRoute } from "@tanstack/react-router";
import { useAccount } from "@/lib/account-context";
import { useOrders, OrderCard } from "./account.$accountId.orders";
import { Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/account/$accountId/cancelled")({
  component: CancelledTab,
});

function CancelledTab() {
  const { profile } = useAccount();
  const orders = useOrders(profile.id, (o) => o.status === "cancelled");
  if (!orders) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <XCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No cancelled orders</p>
      </div>
    );
  return <div className="space-y-4">{orders.map((o) => <OrderCard key={o.id} order={o} />)}</div>;
}
