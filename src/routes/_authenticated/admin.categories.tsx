import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "categories",
  singular: "Category",
  plural: "Categories",
  description: "Nested product categories shown across PRC.",
  searchField: "name",
  orderBy: { column: "sort_order", ascending: true },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "name" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image_url", label: "Image URL", type: "text", colSpan: 2 },
    { name: "icon_url", label: "Icon URL", type: "text", colSpan: 2 },
    { name: "sort_order", label: "Sort Order", type: "number" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" },
    ] },
    { name: "seo_title", label: "SEO Title", type: "text", colSpan: 2 },
    { name: "seo_description", label: "SEO Description", type: "textarea" },
  ],
  listColumns: [
    { label: "Name", render: (r) => <div className="font-medium">{String(r.name)}</div> },
    { label: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug ?? "")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.sort_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: () => <ResourceManager config={config} />,
});
