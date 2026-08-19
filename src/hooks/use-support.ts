import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest, apiUrl } from "@/lib/api";
import type { SupportConversation, SupportConversationStatus } from "@/lib/types";

function useInvalidateSupport() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["supportConversations"] });
}

export function useReplySupportConversation() {
  const invalidate = useInvalidateSupport();
  return useMutation({
    mutationFn: ({ id, body, asOrg }: { id: string; body: string; asOrg: boolean }) =>
      apiRequest<{ conversation: SupportConversation }>(`/support/${id}/reply`, {
        method: "POST",
        body: { body, asOrg },
      }).then((r) => r.conversation),
    onSuccess: invalidate,
  });
}

export function useSetSupportConversationStatus() {
  const invalidate = useInvalidateSupport();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportConversationStatus }) =>
      apiRequest<{ conversation: SupportConversation }>(`/support/${id}/status`, {
        method: "PATCH",
        body: { status },
      }).then((r) => r.conversation),
    onSuccess: invalidate,
  });
}

/**
 * The staff inbox's live-update stream. Like useNotificationStream, the
 * pushed payload is ignored on purpose — the server already persisted the
 * change, so refetching keeps one source of truth instead of trying to
 * splice a pushed object into two different cached shapes (the list and
 * whichever conversation's detail dialog might be open).
 */
export function useSupportStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(apiUrl("/support/stream"), { withCredentials: true });

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["supportConversations"] });
    };

    source.addEventListener("message", refresh);

    return () => {
      source.removeEventListener("message", refresh);
      source.close();
    };
  }, [queryClient]);
}
