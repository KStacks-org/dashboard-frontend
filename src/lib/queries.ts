import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  CurrentUser,
  ServiceDetail,
  ServiceHealth,
  ServiceListItem,
  SponsoredProject,
  Task,
  TeamMember,
} from "@/lib/types";

export const currentUserQuery = queryOptions({
  queryKey: ["currentUser"],
  queryFn: () => apiRequest<{ user: CurrentUser }>("/auth/me").then((r) => r.user),
  retry: false,
  staleTime: 60_000,
});

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => apiRequest<{ services: ServiceListItem[] }>("/services").then((r) => r.services),
  staleTime: 5 * 60_000,
});

export function serviceQuery(codename: string) {
  return queryOptions({
    queryKey: ["services", codename],
    queryFn: () =>
      apiRequest<{ service: ServiceDetail }>(`/services/${codename}`).then((r) => r.service),
  });
}

export const serviceHealthQuery = queryOptions({
  queryKey: ["serviceHealth"],
  queryFn: () =>
    apiRequest<{ services: ServiceHealth[] }>("/services/health").then((r) => r.services),
  // The scheduler probes every few minutes; refresh in the same ballpark.
  refetchInterval: 60_000,
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

export const sponsoredProjectsQuery = queryOptions({
  queryKey: ["sponsoredProjects"],
  queryFn: () =>
    apiRequest<{ projects: SponsoredProject[] }>("/sponsored-projects").then((r) => r.projects),
});
