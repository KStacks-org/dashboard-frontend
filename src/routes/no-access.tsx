import { createFileRoute } from "@tanstack/react-router";
import { Loader2Icon, ShieldAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import { ApiError, apiRequest } from "@/lib/api";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/no-access")({
  component: NoAccessPage,
});

function NoAccessPage() {
  const logout = useLogout();
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);

  useEffect(() => {
    // Re-derive who auth-service says this is, purely to display it — this
    // page exists *because* /auth/me just failed the same way for the
    // router guard, so there is nothing to gain from routing this through
    // react-query's cache.
    apiRequest("/auth/me").catch((error: unknown) => {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_ALLOWED") {
        const email = (error.details as { email?: string } | undefined)?.email;
        if (email) setDeniedEmail(email);
      }
    });
  }, []);

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-12">
      {/* Faint green grid, echoing the brand deck's dark cover slide. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(21,187,129,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,187,129,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]"
      />

      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="mb-8 flex flex-col items-center gap-6">
          <KStackLogo markClassName="size-12" wordmarkClassName="text-2xl" />
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlertIcon className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{m.no_access_title()}</h1>
            <p className="text-sm text-muted-foreground">{m.no_access_subtitle()}</p>
            {deniedEmail && (
              <p dir="ltr" className="font-mono text-sm text-foreground">
                {deniedEmail}
              </p>
            )}
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">{m.no_access_ask_team()}</p>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending && <Loader2Icon className="animate-spin" />}
          {m.no_access_sign_out()}
        </Button>
      </div>
    </main>
  );
}
