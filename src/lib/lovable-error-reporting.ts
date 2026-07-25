/**
 * Error reporting helper — previously forwarded to Lovable Cloud's error tracker.
 * Now logs to the browser console so the error boundary in __root.tsx still
 * compiles and works without any code changes there.
 *
 * To integrate a third-party error tracker (e.g. Sentry, Datadog) in the future,
 * replace the console.error call here with the appropriate SDK call.
 */
export function reportLovableError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  console.error("[PRC Error Boundary]", error, context);
}
