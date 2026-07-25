import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResourceManager, type ResourceConfig } from "@/components/admin/ResourceManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, Megaphone, Compass, Image as ImageIcon, Info, Sparkles } from "lucide-react";

// Config 1: Hero Section Banners (Max 6 slides, device-specific dimensions)
const heroConfig: ResourceConfig = {
  table: "banners",
  singular: "Hero Slide",
  plural: "Hero Slides",
  description: "Homepage hero slider banners (Maximum 6 slides supported). Device-specific image uploads for Desktop, Tablet, and Mobile.",
  searchField: "title",
  orderBy: { column: "display_order", ascending: true },
  defaultFilter: { type: "homepage_hero" },
  fields: [
    { name: "title", label: "Hero Title", type: "text", required: true, colSpan: 2 },
    { name: "subtitle", label: "Eyebrow / Subtitle", type: "text" },
    { name: "type", label: "Type", type: "text", defaultValue: "homepage_hero", placeholder: "homepage_hero" },
    { name: "description", label: "Description", type: "textarea", colSpan: 2 },
    {
      name: "image_url",
      label: "Desktop Image File",
      type: "image",
      required: true,
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload desktop image or paste URL...",
      description: "Recommended Desktop size: 1920 × 800 px (21:9 ratio). Formats: JPG, PNG, WebP. Max 2MB.",
    },
    {
      name: "tablet_image_url",
      label: "Tablet Image File",
      type: "image",
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload tablet image or paste URL...",
      description: "Recommended Tablet size: 1200 × 800 px (3:2 ratio). Formats: JPG, PNG, WebP.",
    },
    {
      name: "mobile_image_url",
      label: "Mobile Image File",
      type: "image",
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload mobile image or paste URL...",
      description: "Recommended Mobile size: 800 × 1200 px (2:3 portrait ratio). Formats: JPG, PNG, WebP.",
    },
    { name: "button_text", label: "Button CTA Text", type: "text", placeholder: "e.g. Explore Range" },
    { name: "button_link", label: "Button CTA Link", type: "text", placeholder: "e.g. /category/cubicle-hardware" },
    { name: "display_order", label: "Display Order", type: "number", defaultValue: 1, min: 1, step: 1 },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active / Published", value: "active" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
  ],
  listColumns: [
    { label: "Title", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Subtitle", render: (r) => <span className="text-xs text-muted-foreground">{String(r.subtitle ?? "—")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.display_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs uppercase font-semibold">{String(r.status)}</span> },
  ],
};

// Config 2: Auto-Sliding Announcement Ticker Bar
const announcementConfig: ResourceConfig = {
  table: "banners",
  singular: "Announcement Text",
  plural: "Announcement Texts",
  description: "Auto-sliding announcement ticker bar text displayed above the main navigation bar.",
  searchField: "title",
  orderBy: { column: "display_order", ascending: true },
  defaultFilter: { type: "announcement" },
  fields: [
    {
      name: "title",
      label: "Announcement Text / Offer",
      type: "text",
      required: true,
      colSpan: 2,
      placeholder: "e.g. Free Pan-India Delivery on Bulk Orders over ₹10,000",
    },
    {
      name: "subtitle",
      label: "Badge / Eyebrow Text (Optional)",
      type: "text",
      placeholder: "e.g. LIMITED OFFER",
    },
    { name: "type", label: "Type", type: "text", defaultValue: "announcement", placeholder: "announcement" },
    {
      name: "button_link",
      label: "Target Link URL (Optional)",
      type: "text",
      placeholder: "e.g. /category/cubicle-hardware",
    },
    { name: "display_order", label: "Display Order", type: "number", defaultValue: 1, min: 1, step: 1 },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active / Published", value: "active" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
  ],
  listColumns: [
    { label: "Announcement Text", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Badge", render: (r) => <span className="text-xs text-muted-foreground">{String(r.subtitle ?? "—")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.display_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs uppercase font-semibold">{String(r.status)}</span> },
  ],
};

// Config 3: Explore Section Banners
const exploreConfig: ResourceConfig = {
  table: "banners",
  singular: "Explore Banner",
  plural: "Explore Banners",
  description: "Category highlights, offer promotions, and secondary homepage banners.",
  searchField: "title",
  orderBy: { column: "display_order", ascending: true },
  defaultFilter: { type: "homepage_secondary" },
  fields: [
    { name: "title", label: "Banner Title", type: "text", required: true },
    { name: "subtitle", label: "Subtitle", type: "text" },
    {
      name: "type",
      label: "Banner Category",
      type: "select",
      defaultValue: "homepage_secondary",
      options: [
        { label: "Homepage Secondary", value: "homepage_secondary" },
        { label: "Category Highlight", value: "category" },
        { label: "Offer Promotion", value: "offer" },
        { label: "Brand Showcase", value: "brand" },
        { label: "Popup Banner", value: "popup" },
      ],
    },
    {
      name: "image_url",
      label: "Desktop Image File",
      type: "image",
      required: true,
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload image or paste URL...",
      description: "Recommended Desktop size: 1200 × 600 px (2:1 ratio). Formats: JPG, PNG, WebP.",
    },
    {
      name: "mobile_image_url",
      label: "Mobile Image File",
      type: "image",
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload mobile image or paste URL...",
      description: "Recommended Mobile size: 600 × 600 px (1:1 ratio) or 3:4 portrait.",
    },
    { name: "button_text", label: "Button Text", type: "text" },
    { name: "button_link", label: "Button Link", type: "text" },
    { name: "display_order", label: "Display Order", type: "number", defaultValue: 1, min: 1, step: 1 },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active / Published", value: "active" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
  ],
  listColumns: [
    { label: "Title", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Category", render: (r) => <span className="text-xs uppercase">{String(r.type)}</span> },
    { label: "Order", render: (r) => <span>{Number(r.display_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs uppercase font-semibold">{String(r.status)}</span> },
  ],
};

// Config 4: Gallery Section (Manual Uploads ONLY)
const galleryConfig: ResourceConfig = {
  table: "banners",
  singular: "Gallery Photo",
  plural: "Gallery Photos",
  description: "Manual gallery installation showcase photos. (Product images are NOT auto-imported).",
  searchField: "title",
  orderBy: { column: "display_order", ascending: true },
  defaultFilter: { type: "gallery" },
  fields: [
    { name: "title", label: "Photo Title / Caption", type: "text", required: true },
    { name: "subtitle", label: "Location / Subtitle", type: "text", placeholder: "e.g. Office Complex Installation" },
    { name: "type", label: "Type", type: "text", defaultValue: "gallery", placeholder: "gallery" },
    {
      name: "image_url",
      label: "High-Res Gallery Photo File",
      type: "image",
      required: true,
      colSpan: 2,
      folder: "gallery",
      placeholder: "Upload gallery photo or paste URL...",
      description: "High-resolution installation photo. Recommended size: 1200 × 1200 px square or 4:3 ratio.",
    },
    { name: "button_link", label: "Optional Page / Project Link", type: "text", placeholder: "e.g. /projects" },
    { name: "display_order", label: "Display Order", type: "number", defaultValue: 1, min: 1, step: 1 },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active / Published", value: "active" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
  ],
  listColumns: [
    { label: "Caption", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Location", render: (r) => <span className="text-xs text-muted-foreground">{String(r.subtitle ?? "—")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.display_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs uppercase font-semibold">{String(r.status)}</span> },
  ],
};

// Config 5: New Arrivals Hero Banners
const newArrivalsConfig: ResourceConfig = {
  table: "banners",
  singular: "New Arrival Banner",
  plural: "New Arrival Banners",
  description: "Auto-sliding hero carousel banners for the New Arrivals page (/new-arrivals). Supports device-responsive images with text overlays.",
  searchField: "title",
  orderBy: { column: "display_order", ascending: true },
  defaultFilter: { type: "new_arrivals" },
  fields: [
    { name: "title", label: "Main Banner Heading", type: "text", required: true, colSpan: 2, placeholder: "e.g. Next-Gen Brass Architectural Releases" },
    { name: "subtitle", label: "Eyebrow Badge", type: "text", placeholder: "e.g. NEW ARRIVALS 2026" },
    { name: "type", label: "Type", type: "text", defaultValue: "new_arrivals", placeholder: "new_arrivals" },
    { name: "description", label: "Subtitle Tagline", type: "textarea", colSpan: 2, placeholder: "e.g. Discover our latest architectural hardware innovations engineered for modern luxury spaces." },
    {
      name: "image_url",
      label: "Desktop Banner Image File",
      type: "image",
      required: true,
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload desktop banner image...",
      description: "📐 Desktop Specs: 1920 × 720 px (16:6 ratio) or 1920 × 800 px. Formats: WebP, PNG, JPG. Max size 2MB.",
    },
    {
      name: "tablet_image_url",
      label: "Tablet Banner Image File (Optional)",
      type: "image",
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload tablet image...",
      description: "📐 Tablet Specs: 1200 × 700 px (16:9 ratio).",
    },
    {
      name: "mobile_image_url",
      label: "Mobile Banner Image File (Optional)",
      type: "image",
      colSpan: 2,
      folder: "banners",
      placeholder: "Upload mobile image...",
      description: "📐 Mobile Specs: 1080 × 1080 px (1:1 square ratio) or 1080 × 1350 px (4:5 portrait ratio).",
    },
    { name: "button_text", label: "Button CTA Text", type: "text", placeholder: "e.g. Explore Collection" },
    { name: "button_link", label: "Button CTA Link", type: "text", placeholder: "e.g. #new-arrivals-grid" },
    { name: "display_order", label: "Display Order", type: "number", defaultValue: 1, min: 1, step: 1 },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active / Published", value: "active" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
  ],
  listColumns: [
    { label: "Banner Title", render: (r) => <div className="font-medium">{String(r.title)}</div> },
    { label: "Eyebrow", render: (r) => <span className="text-xs text-muted-foreground">{String(r.subtitle ?? "—")}</span> },
    { label: "Order", render: (r) => <span>{Number(r.display_order ?? 0)}</span> },
    { label: "Status", render: (r) => <span className="text-xs uppercase font-semibold">{String(r.status)}</span> },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: BannersMediaAdminPage,
});

function BannersMediaAdminPage() {
  const [activeTab, setActiveTab] = useState("hero");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border bg-card px-6 pt-4 pb-0">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="hero" className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Layout className="h-4 w-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="new_arrivals" className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              New Arrivals
            </TabsTrigger>
            <TabsTrigger value="announcement" className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Megaphone className="h-4 w-4" />
              Ticker
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Compass className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-2">
          <TabsContent value="hero" className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                Hero Section Image Upload Guidelines:
              </div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-600/90 dark:text-blue-300/90">
                <li><strong>Maximum 6 Slides:</strong> You can upload up to 6 hero slides.</li>
                <li><strong>Desktop Image:</strong> Recommended size <strong>1920 × 800 px</strong> (21:9 ratio).</li>
                <li><strong>Tablet Image:</strong> Recommended size <strong>1200 × 800 px</strong> (3:2 ratio).</li>
                <li><strong>Mobile Image:</strong> Recommended size <strong>800 × 1200 px</strong> (2:3 portrait ratio).</li>
              </ul>
            </div>
            <ResourceManager config={heroConfig} key="hero-manager" />
          </TabsContent>

          <TabsContent value="new_arrivals" className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                New Arrivals Hero Banner Upload Guidelines:
              </div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-emerald-600/90 dark:text-emerald-300/90">
                <li><strong>Desktop Size:</strong> <strong>1920 × 720 px</strong> (16:6 aspect ratio) or 1920 × 800 px.</li>
                <li><strong>Tablet Size:</strong> <strong>1200 × 700 px</strong> (16:9 aspect ratio).</li>
                <li><strong>Mobile Size:</strong> <strong>1080 × 1080 px</strong> (1:1 square ratio) or 1080 × 1350 px (4:5 portrait ratio).</li>
                <li><strong>Format & Max File Size:</strong> WebP, PNG, or JPG formats. Recommended file size under <strong>2MB</strong>.</li>
              </ul>
            </div>
            <ResourceManager config={newArrivalsConfig} key="new-arrivals-banner-manager" />
          </TabsContent>

          <TabsContent value="announcement" className="space-y-4">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-purple-700 dark:text-purple-300">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                Top Sliding Navbar Announcement Ticker:
              </div>
              <p className="mt-1 text-purple-600/90 dark:text-purple-300/90">
                Add announcement texts here. Active enabled items will automatically slide right above the navigation bar on the storefront every 4.5 seconds.
              </p>
            </div>
            <ResourceManager config={announcementConfig} key="announcement-manager" />
          </TabsContent>

          <TabsContent value="explore" className="space-y-4">
            <ResourceManager config={exploreConfig} key="explore-manager" />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                Manual Gallery Uploads Only:
              </div>
              <p className="mt-1 text-amber-600/90 dark:text-amber-300/90">
                The storefront gallery displays only photos manually uploaded here in this tab. Product catalog images are not automatically pulled.
              </p>
            </div>
            <ResourceManager config={galleryConfig} key="gallery-manager" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
