import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, FolderTree, Tag, Layers, Image as ImageIcon,
  Percent, Ticket, ShoppingCart, Users, Star, Boxes, FileText, PenSquare,
  Search, Bell, ShieldCheck, Activity, Settings, BarChart3, LineChart, LogOut,
  ChevronDown, Sparkles, Inbox, CalendarClock, Building2, Webhook, UserPlus, Award,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProtectedLogo } from "@/components/prch/ProtectedLogo";

export type NavGroup = {
  label: string;
  items: { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[];
};

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "Analytics", to: "/admin/analytics", icon: LineChart },
      { label: "Sales Reports", to: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", to: "/admin/products", icon: Package },
      { label: "Categories", to: "/admin/categories", icon: FolderTree },
      { label: "Materials", to: "/admin/materials", icon: Sparkles },
      { label: "Brands", to: "/admin/brands", icon: Tag },
      { label: "Collections", to: "/admin/collections", icon: Layers },
      { label: "Inventory", to: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Banners", to: "/admin/banners", icon: ImageIcon },
      { label: "Offers", to: "/admin/offers", icon: Percent },
      { label: "Coupons", to: "/admin/coupons", icon: Ticket },
      { label: "Reviews", to: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", to: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", to: "/admin/customers", icon: Users },
      { label: "Messages", to: "/admin/messages", icon: Inbox },
      { label: "Appointments", to: "/admin/appointments", icon: CalendarClock },
      { label: "Warranty Claims", to: "/admin/warranty-claims", icon: ShieldCheck },
      { label: "Warranty Certs", to: "/admin/warranty-certificate", icon: Award },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Media Library", to: "/admin/media", icon: ImageIcon },
      { label: "Projects", to: "/admin/projects", icon: Building2 },
      { label: "About Page", to: "/admin/about", icon: FileText },
      { label: "Website CMS", to: "/admin/cms", icon: FileText },
      { label: "Blog", to: "/admin/blog", icon: PenSquare },
      { label: "SEO", to: "/admin/seo", icon: Search },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Admin Users", to: "/admin/admins", icon: Users },
      { label: "Create Admin", to: "/admin/create-admin", icon: UserPlus },
      { label: "Roles", to: "/admin/roles", icon: ShieldCheck },
      { label: "Activity Logs", to: "/admin/activity", icon: Activity },
      { label: "Webhooks", to: "/admin/webhooks", icon: Webhook },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({ onSignOut, collapsed }: { onSignOut: () => void; collapsed?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-card", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <ProtectedLogo className="h-8 w-auto object-contain" />
        {!collapsed && <span className="ml-auto text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Admin</span>}
      </div>
      <nav className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 py-4">
        {NAV.map((group) => (
          <NavSection key={group.label} group={group} activePath={path} collapsed={collapsed} />
        ))}
      </nav>
      <button
        onClick={onSignOut}
        className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>Sign out</span>}
      </button>
    </aside>
  );
}

function NavSection({ group, activePath, collapsed }: { group: NavGroup; activePath: string; collapsed?: boolean }) {
  const [open, setOpen] = useState(true);
  const hasActive = group.items.some((i) => activePath === i.to || (i.to !== "/admin" && activePath.startsWith(i.to)));
  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
        >
          {group.label}
          <ChevronDown className={cn("h-3 w-3 transition-transform", open ? "" : "-rotate-90")} />
        </button>
      )}
      {(open || collapsed) && (
        <ul className="space-y-0.5">
          {group.items.map((item) => {
            const active = activePath === item.to || (item.to !== "/admin" && activePath.startsWith(item.to));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    collapsed && "justify-center",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {!hasActive && null}
    </div>
  );
}
