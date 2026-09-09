import type { AdminScope } from "@/lib/types";

export type ServiceScopeGroup = {
  admin: AdminScope;
  roles: AdminScope[];
  scopes: string[];
};

export function groupServiceScopes(scopes: AdminScope[]): ServiceScopeGroup[] {
  return scopes
    .filter((scope) => !scope.isDashboard && scope.role === "ADMIN" && scope.serviceId)
    .map((admin) => {
      const roles = scopes.filter(
        (scope) => scope.serviceId === admin.serviceId && scope.role !== "ADMIN",
      );
      return { admin, roles, scopes: [admin.scope, ...roles.map((role) => role.scope)] };
    });
}

export function serviceAdminScopesForUser(
  grantableScopes: AdminScope[],
  userScopes: string[],
): string[] {
  return grantableScopes
    .filter(
      (scope) => !scope.isDashboard && scope.role === "ADMIN" && userScopes.includes(scope.scope),
    )
    .map((scope) => scope.scope);
}

export function selectServiceAdmin(
  selected: string[],
  group: ServiceScopeGroup,
  checked: boolean,
): string[] {
  const withoutService = selected.filter((scope) => !group.scopes.includes(scope));
  return checked ? [...withoutService, group.admin.scope] : withoutService;
}

export function selectServiceRole(
  selected: string[],
  adminScope: string,
  roleScope: string,
  checked: boolean,
): string[] {
  const withoutAdmin = selected.filter((scope) => scope !== adminScope);
  if (!checked) return withoutAdmin.filter((scope) => scope !== roleScope);
  return withoutAdmin.includes(roleScope) ? withoutAdmin : [...withoutAdmin, roleScope];
}
