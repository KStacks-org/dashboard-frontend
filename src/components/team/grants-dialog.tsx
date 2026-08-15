import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ServiceLogo } from "@/components/services/service-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSetGrants } from "@/hooks/use-grants";
import { ApiError } from "@/lib/api";
import { adminScopesQuery } from "@/lib/queries";
import type { TeamMemberProfile } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function GrantsDialog({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberProfile;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {/* Radix unmounts this on close, so the checkboxes re-seed from the
            member on every open — no effect needed. */}
        {member && <GrantsBody member={member} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function GrantsBody({
  member,
  onOpenChange,
}: {
  member: TeamMemberProfile;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: scopes = [] } = useQuery(adminScopesQuery);
  const setGrants = useSetGrants();
  const [selected, setSelected] = useState<string[]>(() =>
    member.adminGrants.map((grant) => grant.scope),
  );

  const isSuperAdmin = member.role === "SUPER_ADMIN";

  const toggle = (scope: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, scope] : current.filter((value) => value !== scope),
    );

  const handleSave = async () => {
    const saved = await setGrants
      .mutateAsync({ userId: member.id, scopes: selected })
      .catch(() => null);
    if (!saved) return;
    toast.success(m.grants_saved());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{m.grants_title()}</DialogTitle>
        <DialogDescription dir="auto">
          {m.grants_description({ name: member.displayName })}
        </DialogDescription>
      </DialogHeader>

      {isSuperAdmin ? (
        <p className="py-4 text-sm text-muted-foreground">{m.grants_super_admin_note()}</p>
      ) : (
        <div className="space-y-1 py-4">
          {scopes.map((scope) => {
            const checked = selected.includes(scope.scope);
            return (
              <Label
                key={scope.scope}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 font-normal hover:bg-muted/50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(scope.scope, value === true)}
                />
                {scope.isDashboard ? (
                  <span className="flex size-5 items-center justify-center text-xs">🗂️</span>
                ) : (
                  <ServiceLogo codename={scope.scope} className="size-5" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{scope.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {scope.isDashboard ? m.grants_scope_dashboard() : m.grants_scope_service()}
                  </span>
                </span>
              </Label>
            );
          })}
        </div>
      )}

      {setGrants.error instanceof ApiError && (
        <p role="alert" className="text-sm text-destructive">
          {setGrants.error.message}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          {m.task_cancel()}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSuperAdmin || setGrants.isPending}>
          {setGrants.isPending && <Loader2Icon className="animate-spin" />}
          {m.task_save()}
        </Button>
      </DialogFooter>
    </>
  );
}
