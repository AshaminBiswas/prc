import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";
import { PageHeader } from "@/components/admin/AdminUI";
import { FileText, ShieldCheck, Scale, Info } from "lucide-react";

const config: ResourceConfig = {
  table: "cms_pages",
  singular: "Page",
  plural: "Website CMS",
  description: "Manage Terms & Conditions, Privacy Policy, About Us, and other website pages.",
  searchField: "title",
  orderBy: { column: "updated_at", ascending: false },
  fields: [
    { name: "title", label: "Page Title", type: "text", required: true },
    { name: "slug", label: "URL Slug (e.g. terms-and-conditions, privacy-policy)", type: "slug", slugFrom: "title", required: true },
    { name: "meta_title", label: "SEO Meta Title", type: "text", colSpan: 2 },
    { name: "meta_description", label: "SEO Meta Description", type: "textarea" },
    { name: "content", label: "Page Content (Sections / Body)", type: "textarea", colSpan: 2 },
    {
      name: "status",
      label: "Publication Status",
      type: "select",
      options: [
        { label: "Published", value: "published font-semibold text-emerald-600" },
        { label: "Draft", value: "draft text-muted-foreground" },
      ],
    },
  ],
  listColumns: [
    { label: "Page Title", render: (r) => <div className="font-semibold text-foreground">{String(r.title)}</div> },
    { label: "URL Slug", render: (r) => <span className="font-mono text-xs text-amber-600 dark:text-amber-400">/{String(r.slug ?? "")}</span> },
    {
      label: "Status",
      render: (r) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            String(r.status) === "published"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {String(r.status)}
        </span>
      ),
    },
    {
      label: "Last Updated",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.updated_at ? new Date(String(r.updated_at)).toLocaleDateString("en-IN") : "—"}
        </span>
      ),
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/cms")({
  component: CmsAdminPage,
  head: () => ({
    meta: [{ title: "Website CMS & Pages — Admin Panel" }, { name: "robots", content: "noindex" }],
  }),
});

function CmsAdminPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
        <div className="flex items-center gap-2 font-semibold">
          <Info className="h-4 w-4 shrink-0" />
          CMS Page Management Tip:
        </div>
        <p className="mt-1 text-amber-600/90 dark:text-amber-300/90">
          Create or edit pages with slug <strong><code className="font-mono font-bold text-amber-800 dark:text-amber-200">terms-and-conditions</code></strong> or <strong><code className="font-mono font-bold text-amber-800 dark:text-amber-200">privacy-policy</code></strong>. Any content updated here will immediately reflect on the live website.
        </p>
      </div>

      <ResourceManager config={config} />
    </div>
  );
}
