import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import { logActivity } from "@/lib/admin-utils";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const q = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_files").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const { data: user } = await supabase.auth.getUser();
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
        const { error: dbErr } = await supabase.from("media_files").insert({
          url: pub.publicUrl, path, filename: file.name, size: file.size, mime_type: file.type, uploaded_by: user.user?.id ?? null,
        });
        if (dbErr) throw dbErr;
      }
      void logActivity("media_upload", "media_files", undefined, { count: files.length });
    },
    onSuccess: () => { toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["media"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (m: { id: string; path: string }) => {
      await supabase.storage.from("media").remove([m.path]);
      const { error } = await supabase.from("media_files").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["media"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Images, videos, PDFs and drawings."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && upload.mutate(e.target.files)}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </Button>
          </>
        }
      />
      {q.isLoading ? <TableSkeleton /> : (q.data?.length ?? 0) === 0 ? (
        <EmptyState title="Empty library" description="Upload files to reuse across products, banners and CMS." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {q.data!.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              {m.mime_type?.startsWith("image") ? (
                <img src={m.url} alt={m.filename} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">{m.mime_type ?? "file"}</div>
              )}
              <div className="flex items-center justify-between px-2 py-1.5 text-[10px]">
                <span className="truncate">{m.filename}</span>
                <button onClick={() => remove.mutate({ id: m.id, path: m.path })} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
