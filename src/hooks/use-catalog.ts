import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { HealthCheck, Service, SponsoredProject, SponsoredProjectStatus } from "@/lib/types";

export type ServiceDetailsValues = {
  overview: string | null;
  repoUrl: string | null;
  healthCheckUrl: string | null;
  ownerId: string | null;
};

export function useUpdateService(codename: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<ServiceDetailsValues>) =>
      apiRequest<{ service: Service }>(`/services/${codename}`, {
        method: "PATCH",
        body: values,
      }).then((r) => r.service),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["services"] }),
        queryClient.invalidateQueries({ queryKey: ["serviceHealth"] }),
      ]);
    },
  });
}

export function useCheckServiceNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      apiRequest<{ check: HealthCheck | null }>(`/services/${serviceId}/check`, {
        method: "POST",
      }).then((r) => r.check),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["serviceHealth"] }),
  });
}

export type SponsoredProjectValues = {
  name: string;
  description: string;
  ownerName: string;
  contact: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  status: SponsoredProjectStatus;
  resources: string | null;
  notes: string | null;
};

function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["sponsoredProjects"] });
}

export function useCreateSponsoredProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (values: SponsoredProjectValues) =>
      apiRequest<{ project: SponsoredProject }>("/sponsored-projects", {
        method: "POST",
        body: values,
      }).then((r) => r.project),
    onSuccess: invalidate,
  });
}

export function useUpdateSponsoredProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<SponsoredProjectValues> }) =>
      apiRequest<{ project: SponsoredProject }>(`/sponsored-projects/${id}`, {
        method: "PATCH",
        body: values,
      }).then((r) => r.project),
    onSuccess: invalidate,
  });
}

export function useDeleteSponsoredProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/sponsored-projects/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
