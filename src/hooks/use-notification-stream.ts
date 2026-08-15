import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiUrl } from "@/lib/api";

/**
 * Keeps an EventSource open so notifications arrive without polling.
 *
 * The payload itself is ignored on purpose: the server has already persisted
 * the notification, so refetching the list keeps one source of truth rather
 * than trying to splice a pushed object into the cache. EventSource reconnects
 * on its own, and the server sends a `retry` hint, so a dropped connection
 * needs no handling here.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(apiUrl("/notifications/stream"), {
      withCredentials: true,
    });

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    source.addEventListener("message", refresh);

    return () => {
      source.removeEventListener("message", refresh);
      source.close();
    };
  }, [queryClient]);
}
