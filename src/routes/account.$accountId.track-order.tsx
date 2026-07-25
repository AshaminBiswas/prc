import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { OrderCard } from "./account.$accountId.orders";

type Order = Parameters<typeof OrderCard>[0]["order"];

export const Route = createFileRoute("/account/$accountId/track-order")({
  component: TrackOrderTab,
});

function TrackOrderTab() {
  const { profile } = useAccount();
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", profile.id)
      .or(`order_number.eq.${q},tracking_number.eq.${q}`)
      .maybeSingle();
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Order not found");
    setOrder(data as unknown as Order);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="rounded-2xl border border-border bg-card p-6">
        <Label>Order number or tracking number</Label>
        <div className="mt-2 flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PRC-YYYYMMDD-XXXXXX" required />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          </Button>
        </div>
      </form>
      {order && <OrderCard order={order} />}
    </div>
  );
}
