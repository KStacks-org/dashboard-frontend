import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  AdminScope,
  AppNotification,
  CurrentUser,
  GitHubActivity,
  Issue,
  Milestone,
  MilestoneDetail,
  OverviewData,
  ServiceDetail,
  ServiceHealth,
  ServiceListItem,
  SponsoredProject,
  SupportConversation,
  SupportConversationStatus,
  Task,
  TeamMember,
  TeamMemberProfile,
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

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => apiRequest<OverviewData>("/overview"),
  staleTime: 30_000,
});

export const teamQuery = queryOptions({
  queryKey: ["team"],
  queryFn: () => apiRequest<{ members: TeamMemberProfile[] }>("/team").then((r) => r.members),
});

export const issuesQuery = queryOptions({
  queryKey: ["issues"],
  queryFn: () => apiRequest<{ issues: Issue[] }>("/issues").then((r) => r.issues),
});

export const adminScopesQuery = queryOptions({
  queryKey: ["adminScopes"],
  queryFn: () => apiRequest<{ scopes: AdminScope[] }>("/team/scopes").then((r) => r.scopes),
});

export const milestonesQuery = queryOptions({
  queryKey: ["milestones"],
  queryFn: () => apiRequest<{ milestones: Milestone[] }>("/milestones").then((r) => r.milestones),
});

export function milestoneQuery(id: string) {
  return queryOptions({
    queryKey: ["milestones", id],
    queryFn: () =>
      apiRequest<{ milestone: MilestoneDetail }>(`/milestones/${id}`).then((r) => r.milestone),
  });
}

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => apiRequest<{ notifications: AppNotification[]; unread: number }>("/notifications"),
});

export function supportConversationsQuery(status: SupportConversationStatus) {
  return queryOptions({
    queryKey: ["supportConversations", "list", status],
    queryFn: () =>
      apiRequest<{ conversations: SupportConversation[] }>(`/support?status=${status}`).then(
        (r) => r.conversations,
      ),
  });
}

export function supportConversationQuery(id: string) {
  return queryOptions({
    queryKey: ["supportConversations", "detail", id],
    queryFn: () =>
      apiRequest<{ conversation: SupportConversation }>(`/support/${id}`).then(
        (r) => r.conversation,
      ),
  });
}

export const githubActivityQuery = queryOptions({
  queryKey: ["githubActivity"],
  queryFn: () =>
    apiRequest<{ activity: GitHubActivity }>("/github/activity").then((r) => r.activity),
  // The server caches for 20 minutes; there is nothing to gain from asking sooner.
  staleTime: 10 * 60_000,
});
