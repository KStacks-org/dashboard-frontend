import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { CurrentUser, Service, Task, TeamMember } from "@/lib/types";

export const currentUserQuery = queryOptions({
  queryKey: ["currentUser"],
  queryFn: () => apiRequest<{ user: CurrentUser }>("/auth/me").then((r) => r.user),
  retry: false,
  staleTime: 60_000,
});

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => apiRequest<{ services: Service[] }>("/services").then((r) => r.services),
  staleTime: 30 * 60_000,
});

export const teamMembersQuery = queryOptions({
  queryKey: ["teamMembers"],
  queryFn: () => apiRequest<{ users: TeamMember[] }>("/users/search").then((r) => r.users),
  staleTime: 10 * 60_000,
});

export function tasksQuery(archived: boolean) {
  return queryOptions({
    queryKey: ["tasks", { archived }],
    queryFn: () =>
      apiRequest<{ tasks: Task[] }>(`/tasks?archived=${archived}`).then((r) => r.tasks),
  });
}
