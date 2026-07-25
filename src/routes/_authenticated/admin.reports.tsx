import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, FadeIn } from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/admin-utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState<"7" | "30" | "90" | "365">("30");

  const q = useQuery({
    queryKey: ["reports", range],
    queryFn: async () => {
      const from = new Date(); from.setDate(from.getDate() - Number(range));
      const { data, error } = await supabase.from("orders").select("*").gte("created_at", from.toISOString());
      if (error) throw error;
      const revenue = (data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
      const tax = (data ?? []).reduce((s, o) => s + Number(o.tax ?? 0), 0);
      const shipping = (data ?? []).reduce((s, o) => s + Number(o.shipping ?? 0), 0);
      const discount = (data ?? []).reduce((s, o) => s + Number(o.discount ?? 0), 0);
      return { rows: data ?? [], revenue, tax, shipping, discount };
    },
  });

  function exportCsv() {
    if (!q.data?.rows.length) return;
    const cols = ["order_number", "created_at", "status", "payment_status", "total", "tax", "shipping", "discount"];
    const csv = [cols.join(","), ...q.data.rows.map((r) => cols.map((c) => JSON.stringify((r as Record<string, unknown>)[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales-${range}d.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Sales Reports"
        description="Revenue, tax, shipping and discount breakdown."
        actions={
          <>
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          </>
        }
      />
      {q.isLoading ? <TableSkeleton /> : (
        <FadeIn>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="Revenue" value={formatCurrency(q.data!.revenue)} />
            <Card label="Tax" value={formatCurrency(q.data!.tax)} />
            <Card label="Shipping" value={formatCurrency(q.data!.shipping)} />
            <Card label="Discount" value={formatCurrency(q.data!.discount)} />
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
