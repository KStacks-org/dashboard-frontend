import { useQuery } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  LayoutDashboardIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ServiceLogo } from "@/components/services/service-logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { useCreateServiceRole, useDeleteServiceRole, useSetGrants } from "@/hooks/use-grants";
import { ApiError } from "@/lib/api";
import {
  groupServiceScopes,
  selectServiceAdmin,
  selectServiceRole,
  type ServiceScopeGroup,
} from "@/lib/grant-selection";
import { adminScopesQuery } from "@/lib/queries";
import type { AdminScope, TeamMemberProfile } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function GrantsDialog({
  open,
  onOpenChange,
  member,
  managedServiceAdminScopes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberProfile;
  /** Null means super-admin authority; otherwise only these services' child roles are editable. */
  managedServiceAdminScopes: string[] | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {/* Radix unmounts this on close, so the checkboxes re-seed from the
            member on every open — no effect needed. */}
        {member && (
          <GrantsBody
            member={member}
            onOpenChange={onOpenChange}
            managedServiceAdminScopes={managedServiceAdminScopes}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GrantsBody({
  member,
  onOpenChange,
  managedServiceAdminScopes,
}: {
  member: TeamMemberProfile;
  onOpenChange: (open: boolean) => void;
  managedServiceAdminScopes: string[] | null;
}) {
  const { data: scopes = [] } = useQuery(adminScopesQuery);
  const setGrants = useSetGrants();
  const [selected, setSelected] = useState<string[]>(() =>
    member.adminGrants.map((grant) => grant.scope),
  );
  const [hasDashboardAccess, setHasDashboardAccess] = useState(member.hasDashboardAccess);
  const [roleToDelete, setRoleToDelete] = useState<AdminScope | null>(null);

  const isSuperAdmin = member.role === "SUPER_ADMIN";
  const canManageAll = managedServiceAdminScopes === null;
  const dashboardScope = scopes.find((scope) => scope.isDashboard);
  const serviceGroups = groupServiceScopes(scopes).filter(
    (group) => canManageAll || managedServiceAdminScopes.includes(group.admin.scope),
  );

  const toggle = (scope: string, checked: boolean) => {
    setSelected((current) =>
      checked
        ? current.includes(scope)
          ? current
          : [...current, scope]
        : current.filter((value) => value !== scope),
    );
    if (scope === "dashboard-admin" && checked) setHasDashboardAccess(true);
  };

  const toggleDashboardAccess = (checked: boolean) => {
    setHasDashboardAccess(checked);
    if (!checked) setSelected((current) => current.filter((scope) => scope !== "dashboard-admin"));
  };

  const handleSave = async () => {
    const saved = await setGrants
      .mutateAsync({ userId: member.id, scopes: selected, hasDashboardAccess })
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
          {canManageAll
            ? m.grants_description({ name: member.displayName })
            : m.grants_delegated_description({ name: member.displayName })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {isSuperAdmin && (
          <p className="text-sm text-muted-foreground">{m.grants_super_admin_note()}</p>
        )}
        {canManageAll && !isSuperAdmin && (
          <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal hover:bg-muted/50">
            <Checkbox
              checked={hasDashboardAccess}
              onCheckedChange={(value) => toggleDashboardAccess(value === true)}
            />
            <LayoutDashboardIcon className="size-5 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{m.grants_dashboard_access()}</span>
              <span className="block text-xs text-muted-foreground">
                {m.grants_dashboard_access_description()}
              </span>
            </span>
          </Label>
        )}

        <div>
          <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
            {m.grants_admin_scopes_heading()}
          </p>
          <div className="space-y-2">
            {canManageAll && !isSuperAdmin && dashboardScope && (
              <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 font-normal hover:bg-muted/50">
                <Checkbox
                  checked={selected.includes(dashboardScope.scope)}
                  onCheckedChange={(value) => toggle(dashboardScope.scope, value === true)}
                />
                <LayoutDashboardIcon className="size-5" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{scopeLabel(dashboardScope)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.grants_scope_dashboard()}
                  </span>
                </span>
              </Label>
            )}

            {serviceGroups.map((group) => (
              <ServiceAccessPanel
                key={group.admin.serviceId}
                group={group}
                selected={selected}
                adminDisabled={isSuperAdmin || !canManageAll}
                targetHasAllAccess={isSuperAdmin}
                rolesDisabled={
                  isSuperAdmin || (!canManageAll && selected.includes(group.admin.scope))
                }
                canManageRoleDefinitions={canManageAll}
                onAdminChange={(checked) => {
                  setSelected((current) => selectServiceAdmin(current, group, checked));
                }}
                onRoleChange={(scope, checked) => {
                  setSelected((current) =>
                    selectServiceRole(current, group.admin.scope, scope, checked),
                  );
                }}
                onCreated={(scope) => {
                  if (isSuperAdmin) return;
                  setSelected((current) =>
                    selectServiceRole(current, group.admin.scope, scope.scope, true),
                  );
                }}
                onDelete={setRoleToDelete}
              />
            ))}
          </div>
        </div>
      </div>

      {isCustomServiceRole(roleToDelete) && (
        <DeleteServiceRoleDialog
          key={roleToDelete.id}
          role={roleToDelete}
          open
          onOpenChange={(open) => {
            if (!open) setRoleToDelete(null);
          }}
          onDeleted={() => {
            setSelected((current) => current.filter((scope) => scope !== roleToDelete.scope));
            setRoleToDelete(null);
          }}
        />
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

function scopeLabel(scope: AdminScope): string {
  return scope.scope;
}

function isCustomServiceRole(
  scope: AdminScope | null,
): scope is AdminScope & { id: string; serviceId: string } {
  return Boolean(scope?.id && scope.serviceId);
}

function ServiceAccessPanel({
  group,
  selected,
  adminDisabled,
  targetHasAllAccess,
  rolesDisabled,
  canManageRoleDefinitions,
  onAdminChange,
  onRoleChange,
  onCreated,
  onDelete,
}: {
  group: ServiceScopeGroup;
  selected: string[];
  adminDisabled: boolean;
  targetHasAllAccess: boolean;
  rolesDisabled: boolean;
  canManageRoleDefinitions: boolean;
  onAdminChange: (checked: boolean) => void;
  onRoleChange: (scope: string, checked: boolean) => void;
  onCreated: (scope: AdminScope) => void;
  onDelete: (scope: AdminScope) => void;
}) {
  const [expanded, setExpanded] = useState(() =>
    group.roles.some((role) => selected.includes(role.scope)),
  );
  const adminChecked = targetHasAllAccess || selected.includes(group.admin.scope);

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-1 p-2">
        <Label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-1 py-1 font-normal hover:bg-muted/50">
          <Checkbox
            checked={adminChecked}
            disabled={adminDisabled}
            onCheckedChange={(value) => onAdminChange(value === true)}
          />
          <ServiceLogo
            codename={group.admin.serviceCodename ?? group.admin.scope}
            className="size-5"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{scopeLabel(group.admin)}</span>
            <span className="block text-xs text-muted-foreground">{m.grants_scope_service()}</span>
          </span>
        </Label>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={scopeLabel(group.admin)}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDownIcon
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border bg-muted/20 p-3">
          {group.roles.length > 0 && (
            <div className="space-y-1">
              {group.roles.map((role) => (
                <div key={role.scope} className="flex items-center gap-1">
                  <Label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-2 py-2 font-normal hover:bg-muted/50">
                    <Checkbox
                      checked={selected.includes(role.scope)}
                      disabled={rolesDisabled}
                      onCheckedChange={(value) => onRoleChange(role.scope, value === true)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-medium">
                        {scopeLabel(role)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {m.grants_scope_custom_role()}
                      </span>
                    </span>
                  </Label>
                  {canManageRoleDefinitions && role.id && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={m.grants_delete_role({ role: scopeLabel(role) })}
                      onClick={() => onDelete(role)}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {group.roles.length === 0 && !canManageRoleDefinitions && (
            <p className="px-2 py-1 text-sm text-muted-foreground">{m.grants_no_child_roles()}</p>
          )}
          {canManageRoleDefinitions && (
            <ServiceRoleCreator service={group.admin} onCreated={onCreated} />
          )}
        </div>
      )}
    </section>
  );
}

function ServiceRoleCreator({
  service,
  onCreated,
}: {
  service: AdminScope;
  onCreated: (scope: AdminScope) => void;
}) {
  const createRole = useCreateServiceRole();
  const [name, setName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!service.serviceId || !name) return;

    const created = await createRole
      .mutateAsync({ serviceId: service.serviceId, name })
      .catch(() => null);
    if (!created) return;

    onCreated(created);
    setName("");
    toast.success(m.grants_role_created({ role: scopeLabel(created) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-3">
      <div>
        <p className="text-sm font-semibold">{m.grants_add_role_title()}</p>
        <p className="text-xs text-muted-foreground">{m.grants_add_role_description()}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
                .toUpperCase()
                .replace(/\s+/g, "_")
                .replace(/[^A-Z0-9_]/g, ""),
            )
          }
          maxLength={40}
          placeholder={m.grants_role_placeholder()}
          aria-label={m.grants_role_name()}
          className="font-mono uppercase"
        />
        <Button type="submit" size="icon" disabled={!name || createRole.isPending}>
          {createRole.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PlusIcon aria-hidden="true" />
          )}
          <span className="sr-only">{m.grants_add_role()}</span>
        </Button>
      </div>
      {createRole.error instanceof ApiError && (
        <p role="alert" className="text-sm text-destructive">
          {createRole.error.message}
        </p>
      )}
    </form>
  );
}

function DeleteServiceRoleDialog({
  role,
  open,
  onOpenChange,
  onDeleted,
}: {
  role: AdminScope & { id: string; serviceId: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const deleteRole = useDeleteServiceRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmation, setConfirmation] = useState("");

  const handleDelete = async () => {
    const deleted = await deleteRole
      .mutateAsync({
        serviceId: role.serviceId,
        roleId: role.id,
        confirmation,
      })
      .then(() => true)
      .catch(() => false);
    if (!deleted) return;

    toast.success(m.grants_role_deleted({ role: scopeLabel(role) }));
    onDeleted();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.grants_delete_role_title({ role: scopeLabel(role) })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === 1
              ? m.grants_delete_role_first_confirmation()
              : m.grants_delete_role_type_confirmation({ role: scopeLabel(role) })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor={`delete-role-${role.id}`} className="font-mono text-sm">
              {scopeLabel(role)}
            </Label>
            <Input
              id={`delete-role-${role.id}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={scopeLabel(role)}
              autoComplete="off"
              className="font-mono"
              autoFocus
            />
          </div>
        )}

        {deleteRole.error instanceof ApiError && (
          <p role="alert" className="text-sm text-destructive">
            {deleteRole.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{m.task_cancel()}</AlertDialogCancel>
          {step === 1 ? (
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                setStep(2);
              }}
            >
              {m.grants_delete_role_continue()}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              variant="destructive"
              disabled={confirmation !== scopeLabel(role) || deleteRole.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleteRole.isPending && <Loader2Icon className="animate-spin" />}
              {m.grants_delete_role_final()}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
