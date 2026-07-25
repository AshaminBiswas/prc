import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/appointment")({
  beforeLoad: () => {
    throw redirect({ to: "/book-appointment", replace: true });
  },
  component: () => null,
});
