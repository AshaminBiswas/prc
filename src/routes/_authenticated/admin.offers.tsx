import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "offers",
  singular: "Offer",
  plural: "Offers & Discounts",
  searchField: "name",
  orderBy: { column: "priority", ascending: false },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "discount_type", label: "Discount Type", type: "select", options: [
      { label: "Percentage", value: "percentage" }, { label: "Fixed Amount", value: "fixed" },
    ] },
    { name: "discount_value", label: "Discount Value", type: "number", min: 0 },
    { name: "applies_to", label: "Applies To", type: "select", options: [
      { label: "Product", value: "product" },
      { label: "Category", value: "category" },
      { label: "Brand", value: "brand" },
      { label: "Cart", value: "cart" },
    ] },
    { name: "priority", label: "Priority", type: "number" },
    { name: "featured", label: "Featured", type: "boolean" },
    { name: "banner_url", label: "Banner URL", type: "text", colSpan: 2 },
    { name: "start_date", label: "Start Date", type: "date" },
    { name: "end_date", label: "End Date", type: "date" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Scheduled", value: "scheduled" }, { label: "Inactive", value: "inactive" },
    ] },
  ],
  listColumns: [
    { label: "Name", render: (r) => <div className="font-medium">{String(r.name)}</div> },
    { label: "Type", render: (r) => <span className="text-xs">{String(r.discount_type)} {Number(r.discount_value ?? 0)}</span> },
    { label: "Applies", render: (r) => <span className="text-xs">{String(r.applies_to)}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/offers")({
  component: () => <ResourceManager config={config} />,
});
