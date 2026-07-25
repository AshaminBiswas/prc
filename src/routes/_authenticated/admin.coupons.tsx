import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "coupons",
  singular: "Coupon",
  plural: "Coupons",
  searchField: "code",
  orderBy: { column: "created_at", ascending: false },
  fields: [
    { name: "code", label: "Code", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "discount_type", label: "Type", type: "select", options: [
      { label: "Percentage", value: "percentage" }, { label: "Fixed", value: "fixed" },
    ] },
    { name: "discount_value", label: "Discount Value", type: "number", min: 0 },
    { name: "usage_limit", label: "Usage Limit", type: "number" },
    { name: "min_purchase", label: "Min Purchase (₹)", type: "number" },
    { name: "max_discount", label: "Max Discount (₹)", type: "number" },
    { name: "expiry_date", label: "Expiry", type: "date" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" },
    ] },
  ],
  listColumns: [
    { label: "Code", render: (r) => <span className="font-mono">{String(r.code)}</span> },
    { label: "Value", render: (r) => <span>{String(r.discount_type)} {Number(r.discount_value ?? 0)}</span> },
    { label: "Used", render: (r) => <span>{Number(r.times_used ?? 0)} / {r.usage_limit ? Number(r.usage_limit) : "∞"}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: () => <ResourceManager config={config} />,
});
