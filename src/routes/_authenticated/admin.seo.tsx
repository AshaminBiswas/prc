import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, FadeIn } from "@/components/admin/AdminUI";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type Settings = Record<string, unknown>;

function useSetting(key: string, defaultValue: Settings) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["setting", key],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return (data?.value as Settings) ?? defaultValue;
    },
  });
  const save = useMutation({
    mutationFn: async (v: Settings) => {
      const { error } = await supabase.from("site_settings").upsert({ key, value: v as never });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["setting", key] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return { q, save };
}

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: SEOPage,
});

function SEOPage() {
  const { q, save } = useSetting("seo_defaults", {
    default_title: "PRC — Precision Hardware",
    default_description: "PRC manufactures cubicle, locker and toilet partition hardware.",
    robots: "index, follow",
    canonical_domain: "",
    og_image: "",
  });
  const [values, setValues] = useState<Settings>({});
  useEffect(() => { if (q.data) setValues(q.data); }, [q.data]);

  return (
    <div>
      <PageHeader title="SEO" description="Global meta defaults, robots and Open Graph." />
      {q.isLoading ? <TableSkeleton rows={4} /> : (
        <FadeIn>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Default Title</Label><Input value={String(values.default_title ?? "")} onChange={(e) => setValues({ ...values, default_title: e.target.value })} /></div>
            <div><Label>Canonical Domain</Label><Input value={String(values.canonical_domain ?? "")} onChange={(e) => setValues({ ...values, canonical_domain: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Default Description</Label><Textarea value={String(values.default_description ?? "")} onChange={(e) => setValues({ ...values, default_description: e.target.value })} /></div>
            <div><Label>Robots</Label><Input value={String(values.robots ?? "")} onChange={(e) => setValues({ ...values, robots: e.target.value })} /></div>
            <div><Label>OG Image URL</Label><Input value={String(values.og_image ?? "")} onChange={(e) => setValues({ ...values, og_image: e.target.value })} /></div>
          </div>
          <div className="mt-6"><Button onClick={() => save.mutate(values)} disabled={save.isPending}>Save</Button></div>
        </FadeIn>
      )}
    </div>
  );
}
