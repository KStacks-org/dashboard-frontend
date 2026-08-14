import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      apiRequest<{ user: CurrentUser }>("/auth/login", {
        method: "POST",
        body: credentials,
      }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) =>
      apiRequest<{ user: CurrentUser }>("/auth/change-password", {
        method: "POST",
        body: input,
      }).then((r) => r.user),
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => apiRequest<void>("/auth/logout", { method: "POST" }),
    onSettled: async () => {
      queryClient.clear();
      await navigate({ to: "/login" });
    },
  });
}
