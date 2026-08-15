import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Priority, Subtask, Task, TaskComment, TaskLink, TaskStatus } from "@/lib/types";

export type TaskFormValues = {
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  status: TaskStatus;
  serviceId: string | null;
  milestoneId: string | null;
  assigneeIds: string[];
};

/** Task edits ripple into the service pages too, so both caches are refreshed. */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["services"] }),
    ]);
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (values: Partial<TaskFormValues> & { title: string; assigneeIds: string[] }) =>
      apiRequest<{ task: Task }>("/tasks", { method: "POST", body: values }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TaskFormValues> }) =>
      apiRequest<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: values }).then(
        (r) => r.task,
      ),
    onSuccess: invalidate,
  });
}

/**
 * Moving a card between board columns updates optimistically so the drop lands
 * instantly, then rolls back if the server refuses.
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiRequest<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: { status } }).then(
        (r) => r.task,
      ),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (tasks) =>
        tasks?.map((task) => (task.id === id ? { ...task, status } : task)),
      );

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useArchiveTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ task: Task }>(`/tasks/${id}/archive`, { method: "POST" }).then((r) => r.task),
    onSuccess: invalidate,
  });
}

export function useRestoreTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ task: Task }>(`/tasks/${id}/restore`, { method: "POST" }).then((r) => r.task),
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
    mutationFn: ({
      taskId,
      title,
      assigneeId,
    }: {
      taskId: string;
      title: string;
      assigneeId?: string | null;
    }) =>
      apiRequest<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: { title, assigneeId: assigneeId ?? null },
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
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAssignSubtask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null }) =>
      apiRequest<{ subtask: Subtask }>(`/subtasks/${id}`, {
        method: "PATCH",
        body: { assigneeId },
      }).then((r) => r.subtask),
    onSuccess: invalidate,
  });
}

export function useDeleteSubtask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/subtasks/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Persists a drag-and-drop reorder; the caller already reordered locally. */
export function useReorderSubtasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, orderedIds }: { taskId: string; orderedIds: string[] }) =>
      apiRequest<{ subtasks: Subtask[] }>(`/tasks/${taskId}/subtasks/reorder`, {
        method: "PATCH",
        body: { orderedIds },
      }).then((r) => r.subtasks),

    onMutate: async ({ taskId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] });

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (tasks) =>
        tasks?.map((task) => {
          if (task.id !== taskId) return task;
          const byId = new Map(task.subtasks.map((s) => [s.id, s]));
          const reordered = orderedIds
            .map((id, index) => {
              const subtask = byId.get(id);
              return subtask ? { ...subtask, sortOrder: index } : null;
            })
            .filter((s): s is Subtask => s !== null);
          return { ...task, subtasks: reordered };
        }),
      );

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAddComment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) =>
      apiRequest<{ comment: TaskComment }>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: { body },
      }).then((r) => r.comment),
    onSuccess: invalidate,
  });
}

export function useUpdateComment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiRequest<{ comment: TaskComment }>(`/comments/${id}`, {
        method: "PATCH",
        body: { body },
      }).then((r) => r.comment),
    onSuccess: invalidate,
  });
}

export function useDeleteComment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/comments/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useAddLink() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, url, label }: { taskId: string; url: string; label: string | null }) =>
      apiRequest<{ link: TaskLink }>(`/tasks/${taskId}/links`, {
        method: "POST",
        body: { url, label },
      }).then((r) => r.link),
    onSuccess: invalidate,
  });
}

export function useDeleteLink() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/links/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
