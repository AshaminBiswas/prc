import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "collections",
  singular: "Collection",
  plural: "Collections",
  searchField: "name",
  orderBy: { column: "sort_order", ascending: true },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "name" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image_url", label: "Image URL", type: "text", colSpan: 2 },
    { name: "featured", label: "Featured", type: "boolean" },
    { name: "is_automatic", label: "Automatic Collection", type: "boolean" },
    { name: "sort_order", label: "Sort Order", type: "number" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" },
    ] },
  ],
  listColumns: [
    { label: "Name", render: (r) => <div className="font-medium">{String(r.name)}</div> },
    { label: "Featured", render: (r) => <span className="text-xs">{r.featured ? "Yes" : "No"}</span> },
    { label: "Auto", render: (r) => <span className="text-xs">{r.is_automatic ? "Yes" : "No"}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/collections")({
  component: () => <ResourceManager config={config} />,
});
