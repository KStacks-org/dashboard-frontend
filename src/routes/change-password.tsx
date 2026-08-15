import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { currentUserQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/change-password")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(currentUserQuery).catch(() => null);
    if (!user) throw redirect({ to: "/login" });
    // Users who already rotated their password have no business here.
    if (!user.mustChangePassword) throw redirect({ to: "/overview" });
  },
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const fieldErrors =
    changePassword.error instanceof ApiError && Array.isArray(changePassword.error.details)
      ? (changePassword.error.details as Array<{
          path: string;
          message: string;
        }>)
      : [];

  const errorFor = (field: string) => fieldErrors.find((d) => d.path === field)?.message;
  const generalError =
    changePassword.error instanceof ApiError && fieldErrors.length === 0
      ? changePassword.error.message
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const user = await changePassword
      .mutateAsync({ currentPassword, newPassword, confirmNewPassword })
      .catch(() => null);
    if (!user) return;
    toast.success(m.change_password_success());
    await navigate({ to: "/overview" });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-6 text-center">
          <KStackLogo markClassName="size-12" wordmarkClassName="text-2xl" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{m.change_password_title()}</h1>
            <p className="text-sm text-muted-foreground">{m.change_password_subtitle()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={currentPasswordId}>{m.change_password_current()}</Label>
            <Input
              id={currentPasswordId}
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              aria-invalid={Boolean(errorFor("currentPassword")) || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={newPasswordId}>{m.change_password_new()}</Label>
            <Input
              id={newPasswordId}
              type="password"
              autoComplete="new-password"
              required
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={Boolean(errorFor("newPassword")) || undefined}
              aria-describedby={`${newPasswordId}-error`}
            />
            {errorFor("newPassword") && (
              <p id={`${newPasswordId}-error`} className="text-sm text-destructive">
                {errorFor("newPassword")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>{m.change_password_confirm()}</Label>
            <Input
              id={confirmPasswordId}
              type="password"
              autoComplete="new-password"
              required
              dir="ltr"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              aria-invalid={Boolean(errorFor("confirmNewPassword")) || undefined}
              aria-describedby={`${confirmPasswordId}-error`}
            />
            {errorFor("confirmNewPassword") && (
              <p id={`${confirmPasswordId}-error`} className="text-sm text-destructive">
                {errorFor("confirmNewPassword")}
              </p>
            )}
          </div>

          {generalError && (
            <p role="alert" className="text-sm text-destructive">
              {generalError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={changePassword.isPending}>
            {changePassword.isPending && <Loader2Icon className="animate-spin" />}
            {m.change_password_submit()}
          </Button>
        </form>
      </div>
    </main>
  );
}
