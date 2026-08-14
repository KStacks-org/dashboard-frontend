import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Priority, Subtask, Task } from "@/lib/types";

export type TaskFormValues = {
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  serviceId: string | null;
  assigneeIds: string[];
};

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (values: TaskFormValues) =>
      apiRequest<{ task: Task }>("/tasks", {
        method: "POST",
        body: values,
      }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TaskFormValues> }) =>
      apiRequest<{ task: Task }>(`/tasks/${id}`, {
        method: "PATCH",
        body: values,
      }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useArchiveTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ task: Task }>(`/tasks/${id}/archive`, {
        method: "POST",
      }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useRestoreTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ task: Task }>(`/tasks/${id}/restore`, {
        method: "POST",
      }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useAddSubtask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      apiRequest<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: { title },
      }).then((r) => r.subtask),
    onSuccess: invalidate,
  });
}

/**
 * Ticking a subtask is the highest-frequency action in the app, so it updates
 * optimistically: the checkbox flips immediately and rolls back if the request
 * fails, instead of stalling on a server round-trip.
 */
export function useToggleSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      apiRequest<{ subtask: Subtask }>(`/subtasks/${id}`, {
        method: "PATCH",
        body: { isCompleted },
      }).then((r) => r.subtask),

    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (tasks) =>
        tasks?.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === id ? { ...subtask, isCompleted } : subtask,
          ),
        })),
      );

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteSubtask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/subtasks/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
