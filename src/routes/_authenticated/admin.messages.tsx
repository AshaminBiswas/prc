import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/admin/AdminUI";
import { formatDate } from "@/lib/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, CheckCircle2, Circle, Building2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

type Msg = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  is_read: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

function MessagesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Msg | null>(null);

  const list = useQuery({
    queryKey: ["contact_messages", q],
    queryFn: async () => {
      let req = supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) req = req.or(`name.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%,company.ilike.%${q}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data as Msg[];
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Msg> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("contact_messages").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_messages"] });
      if (selected && selected.id === vars.id) setSelected({ ...selected, ...vars });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message deleted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["contact_messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unread = list.data?.filter((m) => !m.is_read).length ?? 0;

  function exportCsv() {
    const rows = list.data ?? [];
    if (!rows.length) return;
    const cols = ["name", "email", "company", "message", "status", "is_read", "created_at"];
    const csv = [
      cols.join(","),
      ...rows.map((r) =>
        cols
          .map((c) => JSON.stringify(String((r as Record<string, unknown>)[c] ?? "")))
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prch-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Messages exported");
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description={`Contact form submissions from /about${unread ? ` — ${unread} unread` : ""}`}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!list.data?.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 max-w-md">
        <Input placeholder="Search name, email, company or message…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.isLoading ? (
        <TableSkeleton />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No messages yet" description="Submissions from the /about contact form will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="max-h-[calc(100vh-16rem)] overflow-y-auto rounded-xl border border-border bg-card">
            {list.data!.map((m) => {
              const active = selected?.id === m.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      setSelected(m);
                      if (!m.is_read) update.mutate({ id: m.id, is_read: true });
                    }}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/60 ${
                      active ? "bg-accent" : ""
                    }`}
                  >
                    {m.is_read ? (
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Circle className="mt-1 h-4 w-4 shrink-0 fill-primary text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${m.is_read ? "" : "font-semibold"}`}>{m.name}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.message}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-border bg-card p-6">
            {selected ? (
              <MessageDetail
                msg={selected}
                onUpdate={(patch) => update.mutate({ id: selected.id, ...patch })}
                onDelete={() => {
                  if (confirm("Delete this message?")) del.mutate(selected.id);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a message to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageDetail({
  msg,
  onUpdate,
  onDelete,
}: {
  msg: Msg;
  onUpdate: (patch: Partial<Msg>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(msg.admin_notes ?? "");

  const statuses = ["new", "in_progress", "resolved", "archived"] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-serif text-xl">{msg.name}</div>
          <a href={`mailto:${msg.email}`} className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Mail className="h-3.5 w-3.5" /> {msg.email}
          </a>
          {msg.company && (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {msg.company}
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{formatDate(msg.created_at)}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onUpdate({ status: s })}
            className={`text-[10px] uppercase tracking-[0.2em] rounded-full border px-3 py-1 transition ${
              msg.status === s ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
        {!msg.is_read && (
          <Badge variant="secondary" className="ml-auto">Unread</Badge>
        )}
      </div>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Message</div>
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
          {msg.message}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Internal notes</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (msg.admin_notes ?? "")) onUpdate({ admin_notes: notes || null });
          }}
          rows={4}
          placeholder="Only admins can see these notes…"
          className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-foreground"
        />
      </div>

      <div className="flex gap-2">
        <Button asChild size="sm">
          <a href={`mailto:${msg.email}?subject=Re: your PRC enquiry`}>Reply by email</a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate({ is_read: !msg.is_read })}
        >
          Mark {msg.is_read ? "unread" : "read"}
        </Button>
      </div>
    </div>
  );
}
