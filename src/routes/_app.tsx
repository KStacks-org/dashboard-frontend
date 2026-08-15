import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-nav";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { currentUserQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(currentUserQuery).catch(() => null);
    if (!user) throw redirect({ to: "/login" });
    // A user on a temporary password cannot reach any dashboard route.
    if (user.mustChangePassword) throw redirect({ to: "/change-password" });
    return { user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  // One EventSource for the whole authenticated session.
  useNotificationStream();

  return (
    <div className="flex min-h-dvh">
      <AppSidebar user={user} />
      {/* The content takes the whole remaining width — no centred column — so a
          wide screen is actually used. `min-w-0` keeps long content scrolling
          inside its own panels instead of stretching the layout. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
