import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

/**
 * Replaces someone's scopes with exactly the set given. A whole-set write, so
 * revoking is not a separate call that can be forgotten.
 */
export function useSetGrants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, scopes }: { userId: string; scopes: string[] }) =>
      apiRequest<{ scopes: string[] }>(`/team/${userId}/grants`, {
        method: "PUT",
        body: { scopes },
      }).then((r) => r.scopes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
}
