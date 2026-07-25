import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatDate } from "@/lib/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  component: WebhooksPage,
  head: () => ({ meta: [{ title: "Razorpay Webhooks · PRC Admin" }] }),
});

type Row = {
  id: string;
  event_type: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  signature_valid: boolean;
  outcome: string;
  note: string | null;
  finalized_order_id: string | null;
  payload: unknown;
  created_at: string;
};

const OUTCOME_META: Record<string, { label: string; tone: "ok" | "warn" | "err" }> = {
  finalized: { label: "Finalized", tone: "ok" },
  already_finalized: { label: "Already finalized", tone: "ok" },
  already_finalized_race: { label: "Finalized (race)", tone: "ok" },
  ignored: { label: "Ignored event", tone: "warn" },
  no_pending: { label: "No pending order", tone: "warn" },
  missing_order_id: { label: "Missing order id", tone: "err" },
  invalid_signature: { label: "Invalid signature", tone: "err" },
  invalid_json: { label: "Invalid JSON", tone: "err" },
  insert_failed: { label: "Insert failed", tone: "err" },
};

function WebhooksPage() {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["razorpay_webhook_events", q],
    queryFn: async () => {
      let req = supabase
        .from("razorpay_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q) req = req.or(`razorpay_order_id.ilike.%${q}%,razorpay_payment_id.ilike.%${q}%,event_type.ilike.%${q}%,outcome.ilike.%${q}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data as Row[];
    },
  });

  const rows = query.data ?? [];
  const stats = {
    total: rows.length,
    verified: rows.filter((r) => r.signature_valid).length,
    finalized: rows.filter((r) => r.outcome === "finalized" || r.outcome === "already_finalized" || r.outcome === "already_finalized_race").length,
    failed: rows.filter((r) => !r.signature_valid || r.outcome === "insert_failed" || r.outcome === "missing_order_id" || r.outcome === "invalid_json").length,
  };

  return (
    <div>
      <PageHeader
        title="Razorpay Webhooks"
        description="Every webhook Razorpay sent — signature verification and idempotent finalization outcomes."
        actions={
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Events (last 200)" value={stats.total} />
        <Stat label="Signature verified" value={stats.verified} />
        <Stat label="Finalized orders" value={stats.finalized} />
        <Stat label="Failures" value={stats.failed} tone={stats.failed > 0 ? "err" : "muted"} />
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by order id, payment id, event, or outcome…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No webhook events yet"
          description="Once Razorpay delivers a webhook to /api/public/razorpay-webhook it will show up here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Sig</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Razorpay order</th>
                <th className="px-4 py-3">Order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = OUTCOME_META[r.outcome] ?? { label: r.outcome, tone: "warn" as const };
                const isOpen = expanded === r.id;
                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-4 py-3 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.event_type ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.signature_valid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest",
                            meta.tone === "ok" && "bg-emerald-500/10 text-emerald-500",
                            meta.tone === "warn" && "bg-amber-500/10 text-amber-500",
                            meta.tone === "err" && "bg-red-500/10 text-red-500",
                          )}
                        >
                          {meta.tone === "err" && <AlertCircle className="h-3 w-3" />}
                          {meta.label}
                        </span>
                        {r.note && <div className="mt-1 text-[11px] text-muted-foreground">{r.note}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">{r.razorpay_order_id ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {r.finalized_order_id ? r.finalized_order_id.slice(0, 8) : "—"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={r.id + "-x"} className="border-b border-border bg-muted/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                            Payload
                          </div>
                          <pre className="max-h-80 overflow-auto rounded-md bg-background p-3 text-[11px] leading-relaxed">
{JSON.stringify(r.payload, null, 2)}
                          </pre>
                          {r.razorpay_payment_id && (
                            <div className="mt-2 text-[11px] text-muted-foreground">
                              Payment: <span className="font-mono">{r.razorpay_payment_id}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: "muted" | "err" }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-serif text-2xl", tone === "err" && value > 0 && "text-red-500")}>{value}</div>
    </div>
  );
}
