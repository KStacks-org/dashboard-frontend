import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-nav";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { ApiError } from "@/lib/api";
import { redirectToAuthServiceLogin } from "@/lib/authService";
import { currentUserQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.fetchQuery(currentUserQuery);
      return { user };
    } catch (error) {
      // auth-service knows this person, but they're not on this app's
      // roster — a real "no" the login redirect can't help with (auth-service
      // would just recognise them again and bounce them straight back here).
      if (error instanceof ApiError && error.code === "EMAIL_NOT_ALLOWED") {
        throw redirect({ to: "/no-access" });
      }
      // No/expired identity: only a full page load can hand off to Google's
      // login screen, so this leaves the router rather than navigating within it.
      redirectToAuthServiceLogin();
      return new Promise<never>(() => {});
    }
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
