import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";

const SECTORS = [
  { label: "Corporate", value: "Corporate" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Education", value: "Education" },
  { label: "Transit", value: "Transit" },
  { label: "Retail", value: "Retail" },
];

const config: ResourceConfig = {
  table: "projects",
  singular: "Project",
  plural: "Projects",
  description:
    "Installations shown on /projects. The first image in the gallery is the grid cover — upload it at the ratio for the tile size you pick: Normal 4:3 (≈1200×900), Wide 16:9 (≈1600×900, spans 2 cols), Tall 3:4 (≈900×1200, spans 2 rows).",
  searchField: "title",
  orderBy: { column: "sort_order", ascending: true },
  fields: [
    { name: "title", label: "Title", type: "text", required: true, colSpan: 2 },
    { name: "slug", label: "Slug", type: "slug", slugFrom: "title" },
    { name: "location", label: "Location", type: "text", required: true },
    { name: "sector", label: "Sector", type: "select", options: SECTORS, required: true },
    { name: "year", label: "Year", type: "text", required: true },
    { name: "scope", label: "Scope", type: "text", required: true, colSpan: 2 },
    { name: "description", label: "Full Description", type: "textarea", colSpan: 2 },
    {
      name: "grid_span",
      label: "Grid Tile Size",
      type: "select",
      required: true,
      options: [
        { label: "Normal — 4:3 (≈1200×900)", value: "normal" },
        { label: "Wide — 16:9 (≈1600×900, spans 2 cols)", value: "wide" },
        { label: "Tall — 3:4 (≈900×1200, spans 2 rows)", value: "tall" },
      ],
    },
    {
      name: "gallery",
      label: "Images (first image = grid cover; upload at the ratio above)",
      type: "images",
      minImages: 1,
      bucket: "media",
      folder: "projects",
      colSpan: 2,
    },
    { name: "related_sectors", label: "Related Sectors (tags)", type: "tags", colSpan: 2 },
    { name: "sort_order", label: "Sort Order", type: "number", min: 0 },
    { name: "is_published", label: "Published", type: "boolean" },
  ],
  listColumns: [
    {
      label: "Cover",
      render: (r) => {
        const gallery = (r.gallery as string[] | null) ?? [];
        return gallery[0] ? (
          <img src={gallery[0]} alt="" className="h-12 w-16 rounded object-cover" />
        ) : (
          <div className="h-12 w-16 rounded bg-muted" />
        );
      },
    },
    { label: "Title", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Sector", render: (r) => <span className="text-xs uppercase tracking-widest text-muted-foreground">{String(r.sector)}</span> },
    { label: "Location", render: (r) => <span className="text-sm">{String(r.location)}</span> },
    { label: "Year", render: (r) => <span className="text-sm">{String(r.year)}</span> },
    { label: "Tile", render: (r) => <span className="text-xs uppercase tracking-widest">{String(r.grid_span)}</span> },
    {
      label: "Status",
      render: (r) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
            r.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {r.is_published ? "Published" : "Draft"}
        </span>
      ),
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: () => <ResourceManager config={config} />,
});
