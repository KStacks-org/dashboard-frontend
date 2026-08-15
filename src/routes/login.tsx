import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { currentUserQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    // Already signed in? Skip the login screen.
    const user = await context.queryClient.fetchQuery(currentUserQuery).catch(() => null);
    if (user) {
      throw redirect({
        to: user.mustChangePassword ? "/change-password" : "/tasks",
      });
    }
  },
  component: LoginPage,
});

function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    // The address is fine but nobody on the roster owns it — say so plainly
    // rather than sending the person hunting for a password typo.
    if (error.code === "EMAIL_NOT_ALLOWED") return m.login_error_not_allowed();
    // Zod rejected the domain before the lookup.
    if (error.code === "VALIDATION_ERROR") return m.login_error_domain();
    if (error.status === 401) return m.login_error_invalid();
    if (error.status === 429) return m.login_error_rate_limited();
  }
  return m.login_error_generic();
}

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const user = await login.mutateAsync({ email, password }).catch(() => null);
    if (!user) return;
    await navigate({
      to: user.mustChangePassword ? "/change-password" : "/tasks",
    });
  };

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

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-6 text-center">
          <KStackLogo markClassName="size-12" wordmarkClassName="text-2xl" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{m.login_title()}</h1>
            <p className="text-sm text-muted-foreground">{m.login_subtitle()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={emailId}>{m.login_email_label()}</Label>
            <Input
              id={emailId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder={m.login_email_placeholder()}
              autoFocus
              required
              // Addresses are Latin, so keep the field LTR even in the Arabic UI.
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={login.isError || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>{m.login_password_label()}</Label>
            <Input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={login.isError || undefined}
            />
          </div>

          {login.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageForError(login.error)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending && <Loader2Icon className="animate-spin" />}
            {m.login_submit()}
          </Button>
        </form>
      </div>
    </main>
  );
}
