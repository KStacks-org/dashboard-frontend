import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { redirectToAuthServiceLogin } from "@/lib/authService";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/auth/logout", { method: "POST" }),
    onSettled: async () => {
      queryClient.clear();
      // A full page load, same as signing in — there is no in-app "signed
      // out" screen, just a way back to auth-service's login.
      redirectToAuthServiceLogin();
    },
  });
}
