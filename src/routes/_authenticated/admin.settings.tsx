import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, FadeIn } from "@/components/admin/AdminUI";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type Settings = Record<string, unknown>;

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["settings", "company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "company").maybeSingle();
      if (error) throw error;
      return (data?.value as Settings) ?? {
        company_name: "PRC", tagline: "Precision Hardware",
        email: "", phone: "", address: "",
        gst_number: "", invoice_prefix: "PRC-",
        maintenance_mode: false,
        logo_url: "", favicon_url: "",
      };
    },
  });

  const [v, setV] = useState<Settings>({});
  useEffect(() => { if (q.data) setV(q.data); }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({ key: "company", value: v as never });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["settings", "company"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, val: unknown) => setV((prev) => ({ ...prev, [k]: val }));

  return (
    <div>
      <PageHeader title="Settings" description="Company info, invoices, and site controls." />
      {q.isLoading ? <TableSkeleton rows={5} /> : (
        <FadeIn>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Company Name</Label><Input value={String(v.company_name ?? "")} onChange={(e) => set("company_name", e.target.value)} /></div>
            <div><Label>Tagline</Label><Input value={String(v.tagline ?? "")} onChange={(e) => set("tagline", e.target.value)} /></div>
            <div><Label>Support Email</Label><Input type="email" value={String(v.email ?? "")} onChange={(e) => set("email", e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={String(v.phone ?? "")} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Address</Label><Textarea value={String(v.address ?? "")} onChange={(e) => set("address", e.target.value)} /></div>
            <div><Label>GST Number</Label><Input value={String(v.gst_number ?? "")} onChange={(e) => set("gst_number", e.target.value)} /></div>
            <div><Label>Invoice Prefix</Label><Input value={String(v.invoice_prefix ?? "")} onChange={(e) => set("invoice_prefix", e.target.value)} /></div>
            <div><Label>Logo URL</Label><Input value={String(v.logo_url ?? "")} onChange={(e) => set("logo_url", e.target.value)} /></div>
            <div><Label>Favicon URL</Label><Input value={String(v.favicon_url ?? "")} onChange={(e) => set("favicon_url", e.target.value)} /></div>
            <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div>
                <div className="text-sm font-medium">Maintenance Mode</div>
                <div className="text-xs text-muted-foreground">Show a maintenance page instead of the site.</div>
              </div>
              <Switch checked={!!v.maintenance_mode} onCheckedChange={(x) => set("maintenance_mode", x)} />
            </div>
          </div>
          <div className="mt-6"><Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button></div>
        </FadeIn>
      )}
    </div>
  );
}
