import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, User, ShoppingBag, X, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SearchDialog } from "./SearchDialog";
import { getOrEnsureProfileHash } from "@/lib/profile-utils";
import { ProtectedLogo } from "./ProtectedLogo";
import { AnnouncementBar } from "./AnnouncementBar";

const categories = [
  { name: "Cubicle Hardware", slug: "cubicle-hardware" },
  { name: "Locker Hardware", slug: "locker-hardware" },
  { name: "Toilet Partition Hardware", slug: "toilet-partition-hardware" },
];

const materials = [
  { name: "Stainless Steel", slug: "stainless-steel" },
  { name: "Aluminium Hardware", slug: "aluminium-hardware" },
  { name: "Nylon Hardware", slug: "nylon-hardware" },
];

// Custom easing that feels smooth and slightly springy — "fire" motion
const EASE = [0.22, 1, 0.36, 1] as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

import { checkIsAdminUser } from "@/lib/auth-guard";
import { toast } from "sonner";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("Shop by Category");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    async function loadAcc(user: { id: string; user_metadata?: Record<string, unknown> }) {
      const adminCheck = await checkIsAdminUser(user.id);
      setIsAdmin(adminCheck);
      if (!adminCheck) {
        const hash = await getOrEnsureProfileHash(user);
        setAccountId(hash);
      }
      setUserId(user.id);
    }
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
      if (data.session) void loadAcc(data.session.user);
      else {
        setUserId(null);
        setIsAdmin(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
      if (session) void loadAcc(session.user);
      else {
        setAccountId(null);
        setUserId(null);
        setIsAdmin(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Live cart count query
  const { data: cartCount = 0 } = useQuery({
    queryKey: ["prc-cart-count", userId],
    queryFn: async () => {
      if (!userId || isAdmin) return 0;
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", userId);
      if (error) return 0;
      return (data ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    },
    enabled: !!userId && !isAdmin,
    refetchInterval: 3000,
  });

  const drawerRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  // Lock scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus management + keyboard handling (Escape + Tab trap)
  useEffect(() => {
    if (!open) return;

    // Move focus to the close button once the drawer mounts
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !drawer.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const wasOpenRef = useRef(false);

  // Restore focus to the opener ONLY when closing an open drawer (not on initial mount/reload)
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      openerRef.current?.focus({ preventScroll: true });
      wasOpenRef.current = false;
    }
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-border bg-background/95 backdrop-blur backdrop-saturate-150">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 md:px-8">
          
          {/* Left: Menu Drawer Opener */}
          <div className="flex w-1/4 items-center justify-start">
            <button
              ref={openerRef}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="prch-menu-drawer"
              onClick={() => setOpen(true)}
              suppressHydrationWarning
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <motion.span
                whileTap={{ scale: 0.8, rotate: 90 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex items-center justify-center"
              >
                <Menu className="h-6 w-6" strokeWidth={1.4} aria-hidden="true" />
              </motion.span>
            </button>
          </div>

          {/* Center: Brand Logo (Strictly align-items: center & justify-content: center) */}
          <div className="flex flex-1 items-center justify-center text-center">
            <a
              href="/"
              aria-label="PRC Hardware — Home"
              className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <ProtectedLogo className="h-12 sm:h-14 md:h-16 w-auto max-h-16 object-contain transition-transform hover:scale-105" />
            </a>
          </div>

          {/* Right: Search, Account, Cart Icons */}
          <div className="flex w-1/4 items-center justify-end gap-1 sm:gap-2">
            <button
              ref={searchBtnRef}
              aria-label="Search"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              suppressHydrationWarning
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <motion.span
                whileTap={{ scale: 0.85, rotate: -10 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex items-center justify-center"
              >
                <Search className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
              </motion.span>
            </button>
            <button
              aria-label={isAdmin ? "Admin Dashboard" : isAuthed ? "My account" : "Sign in"}
              onClick={() => {
                if (isAdmin) navigate({ to: "/admin" });
                else navigate({ to: isAuthed ? "/account" : "/login" });
              }}
              suppressHydrationWarning
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              title={isAdmin ? "Go to Admin Dashboard" : isAuthed ? "My account" : "Sign in"}
            >
              <User className={`h-5 w-5 ${isAdmin ? "text-amber-500 font-bold" : ""}`} strokeWidth={1.4} aria-hidden="true" />
            </button>
            {!isAdmin && (
              <button
                aria-label={`Cart with ${cartCount} items`}
                onClick={() => {
                  if (!isAuthed) return navigate({ to: "/login" });
                  if (accountId) navigate({ to: `/account/${accountId}/cart` as never });
                  else navigate({ to: "/account" });
                }}
                suppressHydrationWarning
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-none text-background shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Admin Active Mode Top Notification */}
        {isAdmin && (
          <div className="bg-amber-500/10 border-t border-amber-500/30 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
            <span className="font-semibold uppercase tracking-wider">Admin Session Active:</span>
            <span>You are viewing the site as an Administrator.</span>
            <button
              onClick={() => navigate({ to: "/admin" })}
              className="ml-2 font-bold underline hover:text-amber-800 dark:hover:text-amber-100"
            >
              Open Admin Dashboard &rarr;
            </button>
          </div>
        )}
      </header>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              id="prch-menu-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.55, ease: EASE }}
              className="fixed inset-y-0 left-0 z-[200] flex w-[92%] max-w-[420px] flex-col bg-background shadow-2xl focus:outline-none"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <motion.span
                  id={titleId}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
                  className="font-serif text-lg tracking-[0.3em]"
                >
                  MENU
                </motion.span>
                <button
                  ref={closeBtnRef}
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <motion.span
                    whileTap={{ scale: 0.8, rotate: -90 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <X className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
                  </motion.span>
                </button>
              </div>

              <motion.nav
                aria-label="Primary"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                }}
                className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar"
              >
                <MenuGroup
                  title="Shop by Category"
                  groups={categories}
                  linkTo="category"
                  onNavigate={() => setOpen(false)}
                  expanded={expanded === "Shop by Category"}
                  onToggle={() =>
                    setExpanded(expanded === "Shop by Category" ? null : "Shop by Category")
                  }
                />
                <MenuGroup
                  title="Crafted by Material"
                  groups={materials}
                  linkTo="material"
                  onNavigate={() => setOpen(false)}
                  expanded={expanded === "Crafted by Material"}
                  onToggle={() =>
                    setExpanded(expanded === "Crafted by Material" ? null : "Crafted by Material")
                  }
                />



                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
                  }}
                  className="mt-6 border-t border-border pt-6"
                >
                  {[
                    { label: "About", href: "/about" },
                    { label: "Projects", href: "/projects" },
                    { label: "Contact", href: "/contact" },
                    { label: "Book Appointment", href: "/book-appointment" },
                  ].map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="block py-3 text-[13px] uppercase tracking-[0.28em] transition-opacity hover:opacity-60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {l.label}
                    </a>
                  ))}
                </motion.div>
              </motion.nav>

              <div className="border-t border-border px-5 py-5 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                PRC — Precision Hardware
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchDialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          window.setTimeout(() => searchBtnRef.current?.focus({ preventScroll: true }), 0);
        }}
      />
    </>
  );
}

function MenuGroup({
  title,
  groups,
  expanded,
  onToggle,
  linkTo,
  onNavigate,
}: {
  title: string;
  groups: { name: string; slug?: string }[];
  expanded: boolean;
  onToggle: () => void;
  linkTo?: "category" | "material";
  onNavigate?: () => void;
}) {
  const panelId = useId();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
      className="border-b border-border"
    >
      <h2 className="m-0">
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center justify-between py-4 text-[12px] uppercase tracking-[0.3em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {title}
          <motion.span
            aria-hidden="true"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ChevronDown className="h-4 w-4" strokeWidth={1.4} />
          </motion.span>
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            key="group"
            id={panelId}
            role="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden pb-2"
          >
            {groups.map((g, idx) => {
              const linkClass =
                "block py-3 pl-3 font-serif text-lg transition-opacity hover:opacity-60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";
              return (
                <motion.li
                  key={g.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + idx * 0.05, duration: 0.4, ease: EASE }}
                  className="border-t border-border/60"
                >
                  {linkTo === "category" && g.slug ? (
                    <Link
                      to="/category/$slug"
                      params={{ slug: g.slug }}
                      onClick={onNavigate}
                      className={linkClass}
                    >
                      {g.name}
                    </Link>
                  ) : linkTo === "material" && g.slug ? (
                    <Link
                      to="/material/$slug"
                      params={{ slug: g.slug }}
                      onClick={onNavigate}
                      className={linkClass}
                    >
                      {g.name}
                    </Link>
                  ) : (
                    <a href="#" className={linkClass}>
                      {g.name}
                    </a>
                  )}
                </motion.li>
              );
            })}

          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

