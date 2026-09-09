import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { AdminScope } from "@/lib/types";

/**
 * Replaces someone's scopes with exactly the set given. A whole-set write, so
 * revoking is not a separate call that can be forgotten.
 */
export function useSetGrants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      scopes,
      hasDashboardAccess,
    }: {
      userId: string;
      scopes: string[];
      hasDashboardAccess: boolean;
    }) =>
      apiRequest<{ scopes: string[]; hasDashboardAccess: boolean }>(`/team/${userId}/grants`, {
        method: "PUT",
        body: { scopes, hasDashboardAccess },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
}

/** Adds one reusable role to a service. The API enforces super-admin authority. */
export function useCreateServiceRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, name }: { serviceId: string; name: string }) =>
      apiRequest<{ scope: AdminScope }>(`/team/scopes/${serviceId}/roles`, {
        method: "POST",
        body: { name },
      }).then((response) => response.scope),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminScopes"] }),
  });
}

/** Deletes one custom role. The API also revokes its scope from every user. */
export function useDeleteServiceRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      roleId,
      confirmation,
    }: {
      serviceId: string;
      roleId: string;
      confirmation: string;
    }) =>
      apiRequest<void>(`/team/scopes/${serviceId}/roles/${roleId}`, {
        method: "DELETE",
        body: { confirmation },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminScopes"] }),
        queryClient.invalidateQueries({ queryKey: ["team"] }),
      ]);
    },
  });
}
