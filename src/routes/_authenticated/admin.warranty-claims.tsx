import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatDate } from "@/lib/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Search, Mail, FileText, Calendar, Wrench, CheckCircle2, Clock, XCircle, Truck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/warranty-claims")({
  component: AdminWarrantyClaimsPage,
  head: () => ({
    meta: [{ title: "Warranty Claims — Admin Panel" }, { name: "robots", content: "noindex" }],
  }),
});

type WarrantyClaim = {
  id: string;
  order_id: string;
  product: string;
  issue: string;
  contact_email: string;
  purchase_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "approved", label: "Approved for Replacement", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "dispatched", label: "Replacement Dispatched", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "rejected", label: "Claim Rejected", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
];

function AdminWarrantyClaimsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);

  // Fetch claims from Supabase warranty_claims table
  const { data: claims, isLoading } = useQuery({
    queryKey: ["admin_warranty_claims", search, statusFilter],
    queryFn: async () => {
      let query = supabase.from("warranty_claims").select("*").order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search.trim()) {
        query = query.or(
          `order_id.ilike.%${search}%,contact_email.ilike.%${search}%,product.ilike.%${search}%,issue.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as WarrantyClaim[];
    },
  });

  // Mutation to update claim status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("warranty_claims").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_warranty_claims"] });
      toast.success("Warranty claim status updated successfully!");
      setSelectedClaim(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update claim status.");
    },
  });

  function getStatusBadge(status: string) {
    const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${opt.color}`}>
        {opt.label}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Warranty Claims"
        description="Review, evaluate, and process customer-submitted hardware warranty claims."
        actions={
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            {claims?.length || 0} Total Claims Logged
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, Email, Product, or Issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {["all", "pending", "approved", "dispatched", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {st === "all" ? "All Claims" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !claims || claims.length === 0 ? (
        <EmptyState
          title="No Warranty Claims Found"
          description="No customer warranty claims have been submitted yet matching your current filters."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Hardware Product</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map((claim) => (
                  <tr key={claim.id} className="transition-colors hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="font-mono text-xs font-bold text-foreground">{claim.order_id}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Submitted: {formatDate(claim.created_at)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${claim.contact_email}`} className="hover:underline">
                          {claim.contact_email}
                        </a>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs font-semibold text-foreground">{claim.product}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                        {claim.issue}
                      </div>
                    </td>

                    <td className="p-4">{getStatusBadge(claim.status)}</td>

                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                        className="text-xs font-semibold"
                      >
                        Inspect Claim
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claim Detail & Status Update Dialog */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Warranty Claim Details</DialogTitle>
              <DialogDescription className="text-xs">
                Review submitted issue for Order ID: <strong className="font-mono text-foreground">{selectedClaim.order_id}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/30 p-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">Order ID</span>
                  <span className="font-mono font-bold text-foreground text-sm">{selectedClaim.order_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">Purchase Date</span>
                  <span className="font-medium text-foreground">{selectedClaim.purchase_date || "Not Specified"}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold mb-1">Customer Email</span>
                <a href={`mailto:${selectedClaim.contact_email}`} className="font-semibold text-foreground underline text-sm">
                  {selectedClaim.contact_email}
                </a>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold mb-1">Hardware Product</span>
                <span className="font-medium text-foreground">{selectedClaim.product}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold mb-1">Reported Issue / Defect</span>
                <div className="rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {selectedClaim.issue}
                </div>
              </div>

              {/* Status Manager */}
              <div className="border-t border-border pt-3">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                  Update Claim Status
                </label>
                <Select
                  value={selectedClaim.status}
                  onValueChange={(newStatus) => {
                    updateStatus.mutate({ id: selectedClaim.id, status: newStatus });
                  }}
                >
                  <SelectTrigger className="w-full text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedClaim(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
