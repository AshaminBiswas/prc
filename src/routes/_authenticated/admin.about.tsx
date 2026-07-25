import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/admin/AdminUI";

type Item = { title: string; description: string };
type Stat = { number: string; label: string };
type TL = { year: string; title: string; description: string };

type AboutRow = {
  id: string;
  hero_eyebrow: string; hero_title: string; hero_subtitle: string; hero_image: string | null;
  intro_eyebrow: string; intro_heading: string; intro_body: string;
  craft_eyebrow: string; craft_heading: string; craft_body: string; craft_image: string | null;
  materials_eyebrow: string; materials_heading: string; materials_image: string | null; materials: Item[];
  stats: Stat[];
  principles_eyebrow: string; principles_heading: string; principles: Item[];
  timeline_eyebrow: string; timeline_heading: string; timeline: TL[];
  closing_eyebrow: string; closing_heading: string; closing_body: string;
  closing_cta_label: string; closing_cta_href: string; closing_images: string[];
  seo_title: string | null; seo_description: string | null; og_image: string | null;
};

async function uploadImage(file: File, folder = "about"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  const { data: signed } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (!signed?.signedUrl) throw new Error("Could not generate URL");
  return signed.signedUrl;
}

function ImageField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className="h-24 w-32 rounded object-cover border border-border" />
            <button type="button" onClick={() => onChange(null)} className="absolute -right-2 -top-2 rounded-full bg-background border border-border p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-24 w-32 rounded border border-dashed border-border bg-muted/40" />
        )}
        <div>
          <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true);
            try { onChange(await uploadImage(f)); } catch (err) { toast.error((err as Error).message); }
            finally { setBusy(false); if (ref.current) ref.current.value = ""; }
          }} />
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

function MultiImageField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="h-24 w-32 rounded object-cover border border-border" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 rounded-full bg-background border border-border p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input ref={ref} type="file" accept="image/*" multiple hidden onChange={async (e) => {
          const files = Array.from(e.target.files ?? []); if (!files.length) return;
          setBusy(true);
          try {
            const urls: string[] = [];
            for (const f of files) urls.push(await uploadImage(f));
            onChange([...value, ...urls]);
          } catch (err) { toast.error((err as Error).message); }
          finally { setBusy(false); if (ref.current) ref.current.value = ""; }
        }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="flex h-24 w-32 flex-col items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mb-1 h-4 w-4" />Add image</>}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Repeater<T extends Record<string, string>>({
  label, value, onChange, empty, fields,
}: {
  label: string; value: T[]; onChange: (v: T[]) => void; empty: T;
  fields: { name: keyof T; label: string; textarea?: boolean; className?: string }[];
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {value.map((row, i) => (
        <div key={i} className="rounded border border-border p-3 space-y-2 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">#{i + 1}</span>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {fields.map((f) => (
              <div key={String(f.name)} className={f.className ?? ""}>
                <Label className="text-xs">{f.label}</Label>
                {f.textarea ? (
                  <Textarea rows={2} value={row[f.name]} onChange={(e) => {
                    const next = [...value]; next[i] = { ...row, [f.name]: e.target.value }; onChange(next);
                  }} />
                ) : (
                  <Input value={row[f.name]} onChange={(e) => {
                    const next = [...value]; next[i] = { ...row, [f.name]: e.target.value }; onChange(next);
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...empty }])}>
        <Plus className="mr-2 h-3 w-3" /> Add item
      </Button>
    </div>
  );
}

function AdminAbout() {
  const [row, setRow] = useState<AboutRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any).from("about_page").select("*").limit(1).maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setRow({
          ...data,
          materials: data.materials ?? [], stats: data.stats ?? [],
          principles: data.principles ?? [], timeline: data.timeline ?? [],
          closing_images: data.closing_images ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof AboutRow>(k: K, v: AboutRow[K]) => setRow((r) => (r ? { ...r, [k]: v } : r));

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      // Server-side image validation (aspect ratio + minimum dimensions)
      const images: { role: "hero_image" | "craft_image" | "materials_image" | "closing_images" | "og_image"; url: string }[] = [];
      if (row.hero_image) images.push({ role: "hero_image", url: row.hero_image });
      if (row.craft_image) images.push({ role: "craft_image", url: row.craft_image });
      if (row.materials_image) images.push({ role: "materials_image", url: row.materials_image });
      if (row.og_image) images.push({ role: "og_image", url: row.og_image });
      for (const url of row.closing_images ?? []) images.push({ role: "closing_images", url });

      if (images.length > 0) {
        const { validateAboutImages } = await import("@/lib/about-image-validation.functions");
        const result = await validateAboutImages({ data: { images } });
        if (!result.ok) {
          result.errors.forEach((e) => toast.error(e.error));
          setSaving(false);
          return;
        }
      }

      const { id, ...patch } = row;
      const { error } = await (supabase as any).from("about_page").update(patch).eq("id", id);
      if (error) toast.error(error.message);
      else toast.success("About page saved — all images validated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!row) return <div className="p-8">No About page row found.</div>;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader title="About Page" description="Edit every section of /about. Changes go live on save." />

      <Section title="Hero">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.hero_eyebrow} onChange={(e) => set("hero_eyebrow", e.target.value)} /></div>
          <div><Label>Title</Label><Input value={row.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></div>
        </div>
        <div><Label>Subtitle</Label><Textarea rows={2} value={row.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
        <ImageField label="Hero background image (≈1800×1000)" value={row.hero_image} onChange={(v) => set("hero_image", v)} />
      </Section>

      <Section title="Intro (Our Story)">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.intro_eyebrow} onChange={(e) => set("intro_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.intro_heading} onChange={(e) => set("intro_heading", e.target.value)} /></div>
        </div>
        <div><Label>Body (blank line = new paragraph)</Label><Textarea rows={6} value={row.intro_body} onChange={(e) => set("intro_body", e.target.value)} /></div>
      </Section>

      <Section title="The Craft">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.craft_eyebrow} onChange={(e) => set("craft_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.craft_heading} onChange={(e) => set("craft_heading", e.target.value)} /></div>
        </div>
        <div><Label>Body</Label><Textarea rows={5} value={row.craft_body} onChange={(e) => set("craft_body", e.target.value)} /></div>
        <ImageField label="Craft image (≈1600×1100)" value={row.craft_image} onChange={(v) => set("craft_image", v)} />
      </Section>

      <Section title="The Materials">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.materials_eyebrow} onChange={(e) => set("materials_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.materials_heading} onChange={(e) => set("materials_heading", e.target.value)} /></div>
        </div>
        <ImageField label="Materials image (≈1600×1100)" value={row.materials_image} onChange={(v) => set("materials_image", v)} />
        <Repeater
          label="Material list"
          value={row.materials}
          onChange={(v) => set("materials", v)}
          empty={{ title: "", description: "" }}
          fields={[
            { name: "title", label: "Title" },
            { name: "description", label: "Description", textarea: true, className: "md:col-span-2" },
          ]}
        />
      </Section>

      <Section title="Stats Band">
        <Repeater
          label="Stats (shown on the dark band)"
          value={row.stats}
          onChange={(v) => set("stats", v)}
          empty={{ number: "", label: "" }}
          fields={[
            { name: "number", label: "Number (e.g. 500+)" },
            { name: "label", label: "Label" },
          ]}
        />
      </Section>

      <Section title="Principles">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.principles_eyebrow} onChange={(e) => set("principles_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.principles_heading} onChange={(e) => set("principles_heading", e.target.value)} /></div>
        </div>
        <Repeater
          label="Principle cards"
          value={row.principles}
          onChange={(v) => set("principles", v)}
          empty={{ title: "", description: "" }}
          fields={[
            { name: "title", label: "Title" },
            { name: "description", label: "Description", textarea: true, className: "md:col-span-2" },
          ]}
        />
      </Section>

      <Section title="Timeline">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.timeline_eyebrow} onChange={(e) => set("timeline_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.timeline_heading} onChange={(e) => set("timeline_heading", e.target.value)} /></div>
        </div>
        <Repeater
          label="Timeline events"
          value={row.timeline}
          onChange={(v) => set("timeline", v)}
          empty={{ year: "", title: "", description: "" }}
          fields={[
            { name: "year", label: "Year" },
            { name: "title", label: "Title" },
            { name: "description", label: "Description", textarea: true, className: "md:col-span-2" },
          ]}
        />
      </Section>

      <Section title="Closing CTA">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={row.closing_eyebrow} onChange={(e) => set("closing_eyebrow", e.target.value)} /></div>
          <div><Label>Heading</Label><Input value={row.closing_heading} onChange={(e) => set("closing_heading", e.target.value)} /></div>
          <div><Label>CTA label</Label><Input value={row.closing_cta_label} onChange={(e) => set("closing_cta_label", e.target.value)} /></div>
          <div><Label>CTA link (e.g. /contact)</Label><Input value={row.closing_cta_href} onChange={(e) => set("closing_cta_href", e.target.value)} /></div>
        </div>
        <div><Label>Body</Label><Textarea rows={3} value={row.closing_body} onChange={(e) => set("closing_body", e.target.value)} /></div>
        <MultiImageField label="Closing image strip (up to 4)" value={row.closing_images} onChange={(v) => set("closing_images", v)} />
      </Section>

      <Section title="SEO / Social">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>SEO title</Label><Input value={row.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} /></div>
          <div><Label>SEO description</Label><Input value={row.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} /></div>
        </div>
        <ImageField label="OG / social preview image (1200×630)" value={row.og_image} onChange={(v) => set("og_image", v)} />
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save About page
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/about")({
  component: AdminAbout,
});
