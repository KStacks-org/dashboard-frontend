import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArchiveIcon } from "lucide-react";
import { useState } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { useRestoreTask } from "@/hooks/use-tasks";
import { tasksQuery } from "@/lib/queries";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/archive")({
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery(true)),
  component: ArchivePage,
});

function ArchivePage() {
  const { user } = Route.useRouteContext();
  const { data: tasks, isPending, isError, refetch } = useQuery(tasksQuery(true));
  const restoreTask = useRestoreTask();

  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const detailTask = tasks?.find((task) => task.id === detailTaskId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.nav_archive()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.empty_archive_body()}</p>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={ArchiveIcon}
          title={m.empty_archive_title()}
          body={m.empty_archive_body()}
        />
      )}

      {tasks && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canDelete={task.createdById === user.id}
              onOpen={() => setDetailTaskId(task.id)}
              onEdit={() => {
                setEditingTask(task);
                setFormOpen(true);
              }}
              onRestore={() => restoreTask.mutate(task.id)}
              onDelete={() => setDeletingTaskId(task.id)}
            />
          ))}
        </div>
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editingTask} />

      <TaskDetailDialog
        task={detailTask}
        open={detailTaskId !== null}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
        currentUserId={user.id}
      />

      {deletingTaskId && (
        <DeleteTaskDialog
          taskId={deletingTaskId}
          open
          onOpenChange={(open) => !open && setDeletingTaskId(null)}
          onDeleted={() => setDetailTaskId(null)}
        />
      )}
    </div>
  );
}
