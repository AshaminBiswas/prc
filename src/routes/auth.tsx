import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/admin/login",
      search: location.search,
      replace: true,
    });
  },
  component: () => null,
});
