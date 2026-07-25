import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "materials",
  singular: "Material",
  plural: "Materials",
  description: "PRC material families — Stainless Steel, Aluminium, Nylon.",
  searchField: "name",
  orderBy: { column: "sort_order", ascending: true },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "name" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image_url", label: "Image URL", type: "text", colSpan: 2 },
    { name: "sort_order", label: "Sort Order", type: "number" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" },
    ] },
  ],
  listColumns: [
    { label: "Name", render: (r) => <div className="font-medium">{String(r.name)}</div> },
    { label: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug ?? "")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.sort_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/materials")({
  component: () => <ResourceManager config={config} />,
});
