import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Search, Edit3, Trash2, Download, ChevronLeft, ChevronRight, Loader2,
  Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, TableSkeleton, PageHeader } from "./AdminUI";
import { logActivity, slugify } from "@/lib/admin-utils";
import { optimizeImage, optimizeImages } from "@/lib/image-optimizer";

export type FieldType =
  | "text" | "textarea" | "number" | "boolean" | "select" | "date" | "slug" | "tags"
  | "relation" | "images" | "image";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  slugFrom?: string;
  placeholder?: string;
  description?: string;
  colSpan?: 1 | 2;
  min?: number;
  step?: number;
  // relation
  relationTable?: string;
  relationLabel?: string; // column name for label, default 'name'
  // images
  minImages?: number;
  defaultValue?: unknown;
  maxImages?: number;
  bucket?: string;
  folder?: string;
};

type TableName = string;
type Row = Record<string, unknown> & { id: string };

export type ResourceConfig = {
  table: TableName;
  singular: string;
  plural: string;
  description?: string;
  select?: string;
  searchField?: string;
  orderBy?: { column: string; ascending?: boolean };
  defaultFilter?: Record<string, unknown>;
  fields: Field[];
  listColumns: { label: string; render: (row: Row) => React.ReactNode; sortBy?: string }[];
  statusField?: string;
  statusOptions?: string[];
};

export function ResourceManager({ config }: { config: ResourceConfig }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const key = ["resource", config.table, config.defaultFilter, q, page];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      let req = (supabase as unknown as { from: (t: string) => any })
        .from(config.table)
        .select(config.select ?? "*", { count: "exact" })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (config.defaultFilter) {
        for (const [k, v] of Object.entries(config.defaultFilter)) {
          req = req.eq(k, v);
        }
      }
      if (config.orderBy) req = req.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? false });
      if (q && config.searchField) req = req.ilike(config.searchField, `%${q}%`);
      const { data, error, count } = await req;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as Row[], count: count ?? 0 };
    },
  });

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = normalizePayload(config.fields, values, config.defaultFilter);
      const sb = supabase as unknown as { from: (t: string) => any };
      if (editing?.id) {
        const { error } = await sb.from(config.table).update(payload).eq("id", editing.id);
        if (error) throw error;
        void logActivity("update", config.table, editing.id);
      } else {
        const { error } = await sb.from(config.table).insert(payload);
        if (error) throw error;
        void logActivity("create", config.table);
      }
    },
    onSuccess: () => {
      toast.success(`${config.singular} saved`);
      setEditing(null); setCreating(false);
      qc.invalidateQueries({ queryKey: ["resource", config.table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      const sb = supabase as unknown as { from: (t: string) => any };
      const { error } = await sb.from(config.table).delete().eq("id", row.id);
      if (error) throw error;
      void logActivity("delete", config.table, row.id);
    },
    onSuccess: () => {
      toast.success(`${config.singular} deleted`);
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["resource", config.table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function exportCsv() {
    const rows = query.data?.rows ?? [];
    if (rows.length === 0) { toast.error("Nothing to export"); return; }
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => JSON.stringify((r as Row)[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${config.table}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / pageSize));

  return (
    <div>
      <PageHeader
        title={config.plural}
        description={config.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => { setCreating(true); setEditing({ id: "" } as Row); }}>
              <Plus className="mr-2 h-4 w-4" />New {config.singular}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={`Search ${config.plural.toLowerCase()}…`}
            className="pl-9"
          />
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : (query.data?.rows.length ?? 0) === 0 ? (
        <EmptyState
          title={`No ${config.plural.toLowerCase()} yet`}
          description={`Create your first ${config.singular.toLowerCase()} to get started.`}
          action={<Button onClick={() => { setCreating(true); setEditing({ id: "" } as Row); }}><Plus className="mr-2 h-4 w-4" />New {config.singular}</Button>}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <tr>
                  {config.listColumns.map((c) => (
                    <th key={c.label} className="px-4 py-3 font-medium">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {query.data!.rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-border last:border-0 hover:bg-accent/40"
                    >
                      {config.listColumns.map((c) => (
                        <td key={c.label} className="px-4 py-3 align-middle">{c.render(row)}</td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(row)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(row)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>{query.data!.count} total</div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Page {page + 1} / {totalPages}</span>
              <Button size="icon" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      <ResourceForm
        open={!!editing || creating}
        onClose={() => { setEditing(null); setCreating(false); }}
        config={config}
        initial={editing?.id ? editing : null}
        onSubmit={(vals) => save.mutate(vals)}
        loading={save.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete)}>
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function normalizePayload(fields: Field[], values: Record<string, unknown>, defaultFilter?: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...(defaultFilter ?? {}) };
  for (const f of fields) {
    const v = values[f.name];
    if (v === "" || v === undefined) {
      if (f.name === "display_order") out[f.name] = f.defaultValue ?? 1;
      else out[f.name] = f.defaultValue ?? null;
      continue;
    }
    if (f.type === "number") out[f.name] = (v === null || v === "") ? (f.defaultValue ?? (f.name === "display_order" ? 1 : null)) : Number(v);
    else if (f.type === "tags") out[f.name] = typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v;
    else if (f.type === "images") out[f.name] = Array.isArray(v) ? v : [];
    else out[f.name] = v;
  }
  // Hard safeguard for display_order constraint
  if (fields.some((f) => f.name === "display_order") && (out["display_order"] === null || out["display_order"] === undefined)) {
    out["display_order"] = 1;
  }
  return out;
}

function ResourceForm({ open, onClose, config, initial, onSubmit, loading }: {
  open: boolean; onClose: () => void; config: ResourceConfig;
  initial: Row | null; onSubmit: (v: Record<string, unknown>) => void; loading: boolean;
}) {
  const initialValues = useMemo(() => {
    const v: Record<string, unknown> = {};
    for (const f of config.fields) {
      const raw = initial?.[f.name];
      if (f.type === "tags" && Array.isArray(raw)) v[f.name] = raw.join(", ");
      else if (f.type === "images") v[f.name] = Array.isArray(raw) ? raw : [];
      else v[f.name] = raw ?? f.defaultValue ?? (f.type === "boolean" ? false : "");
    }
    return v;
  }, [initial, config.fields]);

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  useEffect(() => { setValues(initialValues); }, [initialValues]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isCreate = !initial?.id;
    // Validate min images only on create; edits may keep existing images.
    for (const f of config.fields) {
      if (f.type === "images" && f.minImages && isCreate) {
        const arr = (values[f.name] as string[]) ?? [];
        if (arr.length < f.minImages) {
          toast.error(`${f.label}: at least ${f.minImages} images are required (${arr.length} uploaded).`);
          return;
        }
      }
      if (f.required && !values[f.name]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
          {config.description && <DialogDescription>{config.description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {config.fields.map((f) => (
            <div key={f.name} className={f.colSpan === 2 || f.type === "textarea" || f.type === "images" ? "md:col-span-2" : ""}>
              <FieldInput
                field={f}
                value={values[f.name]}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
                allValues={values}
              />
            </div>
          ))}

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ field, value, onChange, allValues }: {
  field: Field; value: unknown; onChange: (v: unknown) => void;
  allValues: Record<string, unknown>;
}) {
  const id = `f-${field.name}`;
  const label = (
    <div>
      <Label htmlFor={id} className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
        {field.label}{field.required && " *"}{field.type === "images" && field.minImages ? ` (min ${field.minImages})` : ""}
      </Label>
      {field.description && (
        <p className="mb-2 text-xs text-muted-foreground/80">{field.description}</p>
      )}
    </div>
  );

  if (field.type === "textarea") {
    return <>{label}<Textarea id={id} rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required} /></>;
  }
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <div>
          <Label htmlFor={id} className="text-sm font-medium">{field.label}</Label>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
        <Switch id={id} checked={!!value} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }
  if (field.type === "number") {
    return <>{label}<Input id={id} type="number" step={field.step ?? "any"} min={field.min} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required} /></>;
  }
  if (field.type === "date") {
    const v = value ? new Date(value as string).toISOString().slice(0, 16) : "";
    return <>{label}<Input id={id} type="datetime-local" value={v} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} /></>;
  }
  if (field.type === "select") {
    return (
      <>{label}
        <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </>
    );
  }
  if (field.type === "relation") {
    return <>{label}<RelationSelect field={field} value={value} onChange={onChange} /></>;
  }
  if (field.type === "image") {
    return <>{label}<SingleImageUploader field={field} value={String(value ?? "")} onChange={(v) => onChange(v as string)} /></>;
  }
  if (field.type === "images") {
    return <>{label}<ImagesUploader field={field} value={(value as string[]) ?? []} onChange={(v) => onChange(v)} /></>;
  }
  if (field.type === "tags") {
    return <>{label}<Input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="comma, separated, tags" /></>;
  }
  if (field.type === "slug") {
    return (
      <>
        {label}
        <div className="flex gap-2">
          <Input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
          {field.slugFrom && (
            <Button type="button" variant="outline" size="sm" onClick={() => {
              const src = allValues[field.slugFrom!];
              if (typeof src === "string" && src) onChange(slugify(src));
            }}>
              Auto
            </Button>
          )}
        </div>
      </>
    );
  }
  return <>{label}<Input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} required={field.required} /></>;
}

function RelationSelect({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const labelCol = field.relationLabel ?? "name";
  const q = useQuery({
    queryKey: ["relation", field.relationTable, labelCol],
    queryFn: async () => {
      const sb = supabase as unknown as { from: (t: string) => any };
      const { data, error } = await sb.from(field.relationTable!).select(`id, ${labelCol}`).order(labelCol, { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; [k: string]: unknown }[];
    },
    enabled: !!field.relationTable,
  });
  return (
    <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
      <SelectTrigger><SelectValue placeholder={q.isLoading ? "Loading…" : "Select…"} /></SelectTrigger>
      <SelectContent>
        {q.data?.map((r) => (
          <SelectItem key={r.id} value={r.id}>{String(r[labelCol] ?? r.id)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SingleImageUploader({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const bucket = field.bucket ?? "media";
  const folder = field.folder ?? "banners";
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const optimized = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1200,
        quality: 0.85,
        mimeType: "image/webp",
      });

      const ext = optimized.name.split(".").pop() || "webp";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, optimized, {
        cacheControl: "31536000",
        upsert: false,
        contentType: optimized.type,
      });
      if (error) throw error;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      let url = pub.publicUrl;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed?.signedUrl) url = signed.signedUrl;

      onChange(url);
      toast.success("Image uploaded successfully");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id={`f-${field.name}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "Paste image URL or choose file below..."}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload File"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {value && (
        <div className="group relative mt-2 max-w-xs overflow-hidden rounded-md border border-border bg-muted p-1">
          <img src={value} alt="Preview" className="h-28 w-full object-cover rounded-sm" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function ImagesUploader({ field, value, onChange }: { field: Field; value: string[]; onChange: (v: string[]) => void }) {
  const bucket = field.bucket ?? "media";
  const folder = field.folder ?? "products";
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    try {
      const rawFiles = Array.from(files);
      // Optimize & compress images client-side before storage upload
      const optimizedFiles = await optimizeImages(rawFiles, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: "image/webp",
      });

      for (const file of optimizedFiles) {
        const ext = file.name.split(".").pop() || "webp";
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "31536000", upsert: false, contentType: file.type,
        });
        if (error) throw error;
        // Try public URL; if bucket is private, fall back to a long-lived signed URL.
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        let url = pub.publicUrl;
        // Probe: if bucket isn't public, sign it.
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signed?.signedUrl) url = signed.signedUrl;
        uploaded.push(url);
      }
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const min = field.minImages ?? 0;
  const shortfall = Math.max(0, min - value.length);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-[3/4] overflow-hidden rounded-md border border-border bg-muted">
            <img src={url} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="mt-1">{uploading ? "Uploading…" : "Add"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      <p className={`text-xs ${shortfall > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {value.length} uploaded{min ? ` · minimum ${min} required` : ""}
        {shortfall > 0 ? ` · add ${shortfall} more` : ""}
      </p>
    </div>
  );
}
