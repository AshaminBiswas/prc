import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";
import { Filter, Sparkles, Flame, TrendingUp, Tag, Layers, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const baseConfig: ResourceConfig = {
  table: "products",
  singular: "Product",
  plural: "Products",
  description: "Manage, filter, and edit all products in the PRC catalog.",
  searchField: "name",
  orderBy: { column: "updated_at", ascending: false },
  fields: [
    // ─── 1. PRODUCT SPECIFICATIONS ───
    { name: "name", label: "1. Product Name", type: "text", required: true, description: "Full commercial title of the hardware item." },
    { name: "slug", label: "Auto SEO Name (Slug)", type: "slug", slugFrom: "name", description: "URL slug used for routing." },
    { name: "sku", label: "Product Code (SKU)", type: "text", placeholder: "e.g. PRC-AL-TR-001" },
    { name: "finish", label: "Finish / Color", type: "text", placeholder: "e.g. Matte Anodized, Brushed Satin, Natural Aluminium" },

    // ─── 7. CATEGORY AND MATERIAL SELECTION ───
    { name: "category_id", label: "7. Category (CUBICLE / LOCKER / URINAL PARTITION)", type: "relation", relationTable: "categories", required: true },
    { name: "material_id", label: "7. Material (SS / AL / NL)", type: "relation", relationTable: "materials", required: true },

    // ─── PRODUCT IMAGES ───
    {
      name: "images",
      label: "Product Images (1:1 Aspect Ratio Recommended)",
      type: "images",
      minImages: 1,
      bucket: "media",
      folder: "products",
      colSpan: 2,
      description: "Minimum 1 image required. 1:1 square aspect ratio recommended for clean catalog rendering.",
    },

    // ─── 2. DIMENSIONS & WEIGHT ───
    { name: "weight", label: "2. Weight (kg)", type: "number", min: 0, placeholder: "e.g. 1.45" },
    { name: "hsn", label: "HSN Code", type: "text", placeholder: "e.g. 8302" },

    // ─── 3. DESCRIPTION ───
    { name: "short_description", label: "3. Short Overview Description", type: "textarea", colSpan: 2 },
    { name: "description", label: "3. Detailed Product Description", type: "textarea", colSpan: 2 },

    // ─── 4. WARRANTY ───
    { name: "warranty", label: "4. Warranty Policy", type: "text", placeholder: "e.g. 2 Year Universal PRC Guarantee" },

    // ─── 5. MANUFACTURER INFO & DOWNLOADS ───
    { name: "brochure_url", label: "5. Product Catalogue / Brochure URL", type: "text", placeholder: "https://... catalogue.pdf" },
    { name: "install_guide_url", label: "5. Installation Guide PDF URL", type: "text", placeholder: "https://... install-guide.pdf" },

    // ─── 6. PRICING DETAILS & COUPONS ───
    { name: "mrp", label: "6. Product MRP (₹)", type: "number", min: 0, placeholder: "e.g. 2000" },
    { name: "price", label: "6. Base Selling Price (₹)", type: "number", min: 0, placeholder: "e.g. 1700" },
    { name: "offer_price", label: "6. Discounted Offer Price (₹)", type: "number", min: 0, placeholder: "e.g. 1700" },
    { name: "gst", label: "6. GST %", type: "number", min: 0, placeholder: "18" },

    // ─── STOCK & BADGES ───
    { name: "stock", label: "Stock Quantity", type: "number", min: 0 },
    { name: "min_stock", label: "Min Stock Level", type: "number", min: 0 },
    { name: "featured", label: "Featured Product", type: "boolean" },
    { name: "trending", label: "Trending Product", type: "boolean" },
    { name: "best_seller", label: "Best Seller Product", type: "boolean" },

    // ─── VISIBILITY & STATUS ───
    {
      name: "visibility",
      label: "Visibility",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
    },
    { name: "tags", label: "Tags", type: "tags", placeholder: "cubicle, aluminium, top-rail, 2-year-warranty" },
    { name: "seo_title", label: "SEO Title", type: "text", colSpan: 2 },
    { name: "seo_description", label: "SEO Description", type: "textarea", colSpan: 2 },
  ],
  listColumns: [
    {
      label: "Image",
      render: (r) => {
        const imgs = (r.images as string[] | null) ?? [];
        return imgs[0] ? (
          <img src={imgs[0]} alt="" className="h-10 w-10 rounded object-cover border border-border" />
        ) : (
          <div className="h-10 w-10 rounded bg-muted" />
        );
      },
    },
    {
      label: "Name",
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{String(r.name)}</div>
          <div className="text-xs text-muted-foreground">{String(r.finish ?? r.slug ?? "")}</div>
        </div>
      ),
    },
    { label: "SKU", render: (r) => <span className="font-mono text-xs">{String(r.sku ?? "—")}</span> },
    { label: "Price", render: (r) => <span className="font-medium">₹{Number(r.offer_price ?? r.price ?? 0).toLocaleString("en-IN")}</span> },
    { label: "Stock", render: (r) => <span>{Number(r.stock ?? 0)}</span> },
    { label: "Status", render: (r) => <StatusPill status={String(r.status)} /> },
  ],
};

function StatusPill({ status }: { status: string }) {
  const color =
    status === "published"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "archived"
      ? "bg-muted text-muted-foreground"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold ${color}`}>{status}</span>;
}

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [activeFilterKey, setActiveFilterKey] = useState<string>("all");
  const [activeFilterObj, setActiveFilterObj] = useState<Record<string, unknown> | undefined>(undefined);
  const [activeLabel, setActiveLabel] = useState<string>("All Products");

  // Fetch real categories and materials from Supabase for dynamic filter pills
  const { data: categories } = useQuery({
    queryKey: ["admin-product-cats-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").order("name");
      return data ?? [];
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["admin-product-mats-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("materials").select("id, name, slug").order("name");
      return data ?? [];
    },
  });

  const configWithFilter: ResourceConfig = {
    ...baseConfig,
    defaultFilter: activeFilterObj,
    description: `Filter: ${activeLabel} — Manage, filter, and edit catalog items.`,
  };

  function setFilter(key: string, label: string, filterObj?: Record<string, unknown>) {
    setActiveFilterKey(key);
    setActiveLabel(label);
    setActiveFilterObj(filterObj);
  }

  return (
    <div className="space-y-6">
      {/* Quick Filter Navigation Bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-4 w-4 text-foreground" />
            Product Quick Filters:
          </div>
          {activeFilterKey !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter("all", "All Products")}
              className="h-7 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" /> Clear Filter ({activeLabel})
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* All Filter */}
          <button
            onClick={() => setFilter("all", "All Products")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilterKey === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Products
          </button>

          {/* Flags */}
          <button
            onClick={() => setFilter("flag-featured", "Featured", { featured: true })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilterKey === "flag-featured"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Featured
          </button>

          <button
            onClick={() => setFilter("flag-best_seller", "Best Seller", { best_seller: true })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilterKey === "flag-best_seller"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Flame className="h-3.5 w-3.5" /> Bestsellers
          </button>

          <button
            onClick={() => setFilter("flag-trending", "Trending", { trending: true })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilterKey === "flag-trending"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Trending
          </button>

          {/* Dynamic Categories */}
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(`cat-${cat.id}`, cat.name, { category_id: cat.id })}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilterKey === `cat-${cat.id}`
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> {cat.name}
            </button>
          ))}

          {/* Dynamic Materials */}
          {materials?.map((mat) => (
            <button
              key={mat.id}
              onClick={() => setFilter(`mat-${mat.id}`, mat.name, { material_id: mat.id })}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilterKey === `mat-${mat.id}`
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Tag className="h-3.5 w-3.5" /> {mat.name}
            </button>
          ))}

          {/* Finishes / Colors */}
          <button
            onClick={() => setFilter("has-finish", "Colors / Custom Finishes", { status: "published" })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilterKey === "has-finish"
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Palette className="h-3.5 w-3.5" /> Colors & Finishes
          </button>
        </div>
      </div>

      <ResourceManager config={configWithFilter} key={activeFilterKey} />
    </div>
  );
}
