import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X, ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;

type Entry = {
  id: string;
  name: string;
  kind: "Product" | "Category" | "Material";
  meta?: string;
  image?: string;
  slug?: string | null;
};

const suggestions = ["Indicator Bolt", "Cam Lock", "Stainless Steel", "Cubicle Hardware", "Locker Hardware"];

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [dbResults, setDbResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  // Live database search query
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setDbResults([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [prods, cats, mats] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, slug, finish, short_description, images")
            .ilike("name", `%${term}%`)
            .neq("status", "archived")
            .limit(6),
          supabase
            .from("categories")
            .select("id, name, slug")
            .ilike("name", `%${term}%`)
            .eq("status", "active")
            .limit(3),
          supabase
            .from("materials")
            .select("id, name, slug")
            .ilike("name", `%${term}%`)
            .eq("status", "active")
            .limit(3),
        ]);

        if (!active) return;

        const out: Entry[] = [];
        (prods.data ?? []).forEach((p) => {
          out.push({
            id: p.id,
            name: p.name,
            kind: "Product",
            meta: p.finish ?? p.short_description ?? "Hardware Product",
            image: p.images?.[0],
            slug: p.slug,
          });
        });
        (cats.data ?? []).forEach((c) => {
          out.push({
            id: c.id,
            name: c.name,
            kind: "Category",
            meta: "Product Category",
            slug: c.slug,
          });
        });
        (mats.data ?? []).forEach((m) => {
          out.push({
            id: m.id,
            name: m.name,
            kind: "Material",
            meta: "Material Finish",
            slug: m.slug,
          });
        });

        setDbResults(out);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    dbResults.forEach((r) => {
      (g[r.kind] ||= []).push(r);
    });
    return g;
  }, [dbResults]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            key="search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="fixed inset-x-0 top-0 z-[300] max-h-[90vh] overflow-y-auto bg-background shadow-2xl border-b border-border"
          >
            <div className="mx-auto flex max-w-4xl items-center gap-4 border-b border-border px-5 py-5 md:px-8">
              {loading ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-5 w-5 shrink-0" strokeWidth={1.4} aria-hidden="true" />
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search hardware, categories, materials…"
                className="w-full bg-transparent font-serif text-xl outline-none placeholder:text-muted-foreground md:text-2xl"
                aria-label="Search PRC"
              />
              <button
                onClick={onClose}
                aria-label="Close search"
                className="text-foreground transition-opacity hover:opacity-60"
              >
                <motion.span whileTap={{ scale: 0.8, rotate: -90 }} transition={{ duration: 0.25, ease: EASE }}>
                  <X className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
                </motion.span>
              </button>
            </div>

            <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
              {q.trim() === "" && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Popular Searches
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQ(s)}
                        className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors hover:bg-foreground hover:text-background"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q.trim() !== "" && !loading && dbResults.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No results for “{q}”. Try searching for “hinge”, “lock”, or “stainless steel”.
                </p>
              )}

              {dbResults.length > 0 && (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([kind, items]) => (
                    <motion.div
                      key={kind}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {kind}
                      </p>
                      <ul className="divide-y divide-border border-y border-border">
                        {items.map((r, i) => {
                          const href =
                            r.kind === "Product" && r.slug
                              ? `/product/${r.slug}`
                              : r.kind === "Category" && r.slug
                              ? `/category/${r.slug}`
                              : r.kind === "Material" && r.slug
                              ? `/material/${r.slug}`
                              : "#";

                          return (
                            <motion.li
                              key={r.id + i}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.3, ease: EASE }}
                            >
                              <Link
                                to={href}
                                onClick={onClose}
                                className="group flex items-center gap-4 py-3 hover:bg-muted/30 px-2 transition-colors"
                              >
                                {r.image ? (
                                  <img
                                    src={r.image}
                                    alt=""
                                    className="h-14 w-14 flex-none object-cover rounded-sm border border-border"
                                  />
                                ) : (
                                  <span className="flex h-14 w-14 flex-none items-center justify-center border border-border font-serif text-lg bg-secondary/50">
                                    {r.name.charAt(0)}
                                  </span>
                                )}
                                <span className="flex-1">
                                  <span className="block font-serif text-base md:text-lg">
                                    {highlight(r.name, q)}
                                  </span>
                                  {r.meta && (
                                    <span className="mt-0.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                      {r.meta}
                                    </span>
                                  )}
                                </span>
                                <ArrowUpRight
                                  className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-100"
                                  strokeWidth={1.4}
                                />
                              </Link>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function highlight(text: string, q: string) {
  const term = q.trim();
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-medium text-foreground underline underline-offset-4">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}
