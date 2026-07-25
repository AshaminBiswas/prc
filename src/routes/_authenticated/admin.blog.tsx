import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const config: ResourceConfig = {
  table: "blog_posts",
  singular: "Post",
  plural: "Blog",
  searchField: "title",
  orderBy: { column: "published_at", ascending: false },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "title" },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "textarea" },
    { name: "cover_image", label: "Cover Image URL", type: "text", colSpan: 2 },
    { name: "tags", label: "Tags", type: "tags" },
    { name: "meta_title", label: "Meta Title", type: "text", colSpan: 2 },
    { name: "meta_description", label: "Meta Description", type: "textarea" },
    { name: "published_at", label: "Publish At", type: "date" },
    { name: "status", label: "Status", type: "select", options: [
      { label: "Draft", value: "draft" }, { label: "Scheduled", value: "scheduled" }, { label: "Published", value: "published" },
    ] },
  ],
  listColumns: [
    { label: "Title", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug ?? "")}</span> },
    { label: "Status", render: (r) => <span className="text-xs">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: () => <ResourceManager config={config} />,
});
