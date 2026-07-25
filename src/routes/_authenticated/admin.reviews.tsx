import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { logActivity } from "@/lib/admin-utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) throw error;
      void logActivity("review_moderate", "reviews", id, { status });
    },
    onSuccess: () => { toast.success("Review updated"); qc.invalidateQueries({ queryKey: ["reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Reviews" description="Approve, reject and feature customer reviews." />
      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <ul className="space-y-3">
          {q.data!.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating ?? 0) ? "fill-current" : ""}`} />)}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.status}</span>
              </div>
              <div className="mt-2 font-medium">{r.title ?? "Untitled"}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
