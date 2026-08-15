import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  Issue,
  IssueStatus,
  Milestone,
  Priority,
  TeamMemberProfile,
  UserRole,
} from "@/lib/types";

/* ------------------------------- team -------------------------------- */

export type MemberValues = {
  email: string;
  displayName: string;
  jobTitle: string | null;
  role: UserRole;
  responsibilities: string[];
};

function useInvalidateTeam() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["team"] }),
      // A new or deactivated member changes who can be assigned work.
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] }),
    ]);
  };
}

export function useCreateMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (values: MemberValues) =>
      apiRequest<{ member: TeamMemberProfile }>("/team", { method: "POST", body: values }).then(
        (r) => r.member,
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Partial<MemberValues> & { isActive?: boolean };
    }) =>
      apiRequest<{ member: TeamMemberProfile }>(`/team/${id}`, {
        method: "PATCH",
        body: values,
      }).then((r) => r.member),
    onSuccess: invalidate,
  });
}

/* ------------------------------ issues ------------------------------- */

export type IssueValues = {
  title: string;
  description: string | null;
  priority: Priority;
  status: IssueStatus;
  serviceId: string | null;
  assigneeId: string | null;
};

function useInvalidateIssues() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["issues"] }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
      queryClient.invalidateQueries({ queryKey: ["team"] }),
    ]);
  };
}

export function useCreateIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: (values: IssueValues) =>
      apiRequest<{ issue: Issue }>("/issues", { method: "POST", body: values }).then(
        (r) => r.issue,
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<IssueValues> }) =>
      apiRequest<{ issue: Issue }>(`/issues/${id}`, { method: "PATCH", body: values }).then(
        (r) => r.issue,
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteIssue() {
  const invalidate = useInvalidateIssues();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/issues/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Promotes a bug report into work; the issue is kept and linked to the task. */
export function useConvertIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ issue: Issue }>(`/issues/${id}/convert`, { method: "POST" }).then(
        (r) => r.issue,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["issues"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]);
    },
  });
}

/* ---------------------------- milestones ----------------------------- */

export type MilestoneValues = {
  title: string;
  description: string | null;
  deadline: string | null;
};

function useInvalidateMilestones() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["milestones"] }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  };
}

export function useCreateMilestone() {
  const invalidate = useInvalidateMilestones();
  return useMutation({
    mutationFn: (values: MilestoneValues) =>
      apiRequest<{ milestone: Milestone }>("/milestones", { method: "POST", body: values }).then(
        (r) => r.milestone,
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateMilestone() {
  const invalidate = useInvalidateMilestones();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MilestoneValues> }) =>
      apiRequest<{ milestone: Milestone }>(`/milestones/${id}`, {
        method: "PATCH",
        body: values,
      }).then((r) => r.milestone),
    onSuccess: invalidate,
  });
}

export function useDeleteMilestone() {
  const invalidate = useInvalidateMilestones();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/milestones/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/* --------------------------- notifications --------------------------- */

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
