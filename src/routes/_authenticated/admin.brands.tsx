import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "brands",
  singular: "Brand",
  plural: "Brands",
  searchField: "name",
  orderBy: { column: "updated_at", ascending: false },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "name" },
    { name: "logo_url", label: "Logo URL", type: "text", colSpan: 2 },
    { name: "banner_url", label: "Banner URL", type: "text", colSpan: 2 },
    { name: "description", label: "Description", type: "textarea" },
    { name: "website_url", label: "Website URL", type: "text", colSpan: 2 },
    { name: "seo_title", label: "SEO Title", type: "text", colSpan: 2 },
    { name: "seo_description", label: "SEO Description", type: "textarea" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" },
    ] },
  ],
  listColumns: [
    { label: "Name", render: (r) => <div className="font-medium">{String(r.name)}</div> },
    { label: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug ?? "")}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/brands")({
  component: () => <ResourceManager config={config} />,
});
