import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/AdminUI";
import { ShieldCheck } from "lucide-react";

const ROLES = [
  { name: "Super Admin", desc: "Full access across every module.", perms: ["view", "create", "edit", "delete", "approve", "export"] },
  { name: "Manager", desc: "Everyday operations.", perms: ["view", "create", "edit", "export"] },
  { name: "Sales Manager", desc: "Orders, customers, coupons.", perms: ["view", "edit", "export"] },
  { name: "Inventory Manager", desc: "Products and stock.", perms: ["view", "edit"] },
  { name: "Content Manager", desc: "CMS, blog, banners.", perms: ["view", "create", "edit"] },
  { name: "Customer Support", desc: "Orders and reviews (read + reply).", perms: ["view"] },
  { name: "Marketing Manager", desc: "Offers, coupons, banners.", perms: ["view", "create", "edit"] },
];

export const Route = createFileRoute("/_authenticated/admin/roles")({
  component: RolesPage,
});

function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Predefined access tiers for the admin team." />
      <div className="grid gap-3 md:grid-cols-2">
        {ROLES.map((r) => (
          <div key={r.name} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 font-serif text-lg"><ShieldCheck className="h-4 w-4" />{r.name}</div>
            <p className="mb-4 text-sm text-muted-foreground">{r.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {r.perms.map((p) => (
                <span key={p} className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest">{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
