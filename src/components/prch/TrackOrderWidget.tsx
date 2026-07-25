import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Package, CheckCircle2, AlertCircle, Truck } from "lucide-react";
import { trackOrder, type TrackingResult } from "@/lib/tracking.functions";

const EASE = [0.22, 1, 0.36, 1] as const;

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; data: TrackingResult }
  | { kind: "error"; message: string };

export function TrackOrderWidget() {
  const track = useServerFn(trackOrder);
  const [form, setForm] = useState({ order_number: "", email: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const disabled = status.kind === "loading";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "loading" });
    try {
      const data = await track({ data: form });
      setStatus({ kind: "result", data });
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Unable to track order. Please try again.";
      setStatus({ kind: "error", message });
    }
  };

  return (
    <section id="track" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid gap-10 rounded-tr-3xl rounded-bl-3xl border border-border bg-background p-8 md:grid-cols-12 md:p-12"
        >
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5" strokeWidth={1.4} />
              <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Live Tracking
              </p>
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl">Track Your Order</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Enter the order number from your confirmation email along with the
              email address used at checkout to see the latest dispatch and
              delivery status.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5 md:col-span-7" noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Order number" required>
                <input
                  type="text"
                  required
                  maxLength={64}
                  value={form.order_number}
                  onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
                  disabled={disabled}
                  placeholder="e.g. PRC-2026-00123"
                  className={inputCls}
                />
              </Field>
              <Field label="Email used at checkout" required>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={disabled}
                  className={inputCls}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="group inline-flex items-center justify-center gap-3 border border-foreground bg-foreground px-8 py-3 text-[11px] uppercase tracking-[0.3em] text-background transition-colors hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.4} />
                  Checking
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" strokeWidth={1.5} />
                  Track order
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {status.kind === "error" && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                  {status.message}
                </motion.p>
              )}

              {status.kind === "result" && !status.data.found && (
                <motion.div
                  key="notfound"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-tr-2xl rounded-bl-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground"
                  role="status"
                >
                  We couldn&apos;t find an order matching those details. Double-check
                  the order number and email, or contact <a className="underline" href="mailto:support@prch.in">support@prch.in</a>.
                </motion.div>
              )}

              {status.kind === "result" && status.data.found && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-tr-2xl rounded-bl-2xl border border-border bg-card p-6"
                  role="status"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                        Order
                      </p>
                      <p className="mt-1 font-serif text-xl">{status.data.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                        Current status
                      </p>
                      <p className="mt-1 font-serif text-xl capitalize">
                        {(status.data.delivery_status || status.data.status || "pending").replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>

                  {status.data.tracking_number && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" strokeWidth={1.5} />
                      Tracking number: <span className="text-foreground">{status.data.tracking_number}</span>
                    </p>
                  )}

                  <ol className="mt-6 space-y-3">
                    {status.data.timeline?.map((step) => (
                      <li key={step.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            step.completed
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              step.completed ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(step.date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full border-b border-border bg-transparent py-3 text-sm outline-none transition-colors focus:border-foreground disabled:opacity-60";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-foreground">*</span>}
      </span>
      {children}
    </label>
  );
}
