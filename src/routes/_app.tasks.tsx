import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDaysIcon, ListIcon, ListTodoIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArchiveTask } from "@/hooks/use-tasks";
import { tasksQuery } from "@/lib/queries";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/tasks")({
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery(false)),
  component: TasksPage,
});

type ViewMode = "list" | "calendar";

function TasksPage() {
  const { user } = Route.useRouteContext();
  const { data: tasks, isPending, isError, refetch } = useQuery(tasksQuery(false));
  const archiveTask = useArchiveTask();

  // View mode is pure presentation — switching never refetches.
  const [view, setView] = useState<ViewMode>("list");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Read the detail task back out of the live list so it stays fresh after mutations.
  const detailTask = tasks?.find((task) => task.id === detailTaskId) ?? null;

  const openCreate = () => {
    setEditingTask(undefined);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{m.nav_tasks()}</h1>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="list">
                <ListIcon aria-hidden="true" />
                {m.view_list()}
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDaysIcon aria-hidden="true" />
                {m.view_calendar()}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{m.task_new()}</span>
          </Button>
        </div>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={ListTodoIcon}
          title={m.empty_tasks_title()}
          body={m.empty_tasks_body()}
          action={
            <Button onClick={openCreate} className="mt-1">
              <PlusIcon aria-hidden="true" />
              {m.task_new()}
            </Button>
          }
        />
      )}

      {tasks && tasks.length > 0 && view === "list" && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canDelete={task.createdById === user.id}
              onOpen={() => setDetailTaskId(task.id)}
              onEdit={() => openEdit(task)}
              onArchive={() => archiveTask.mutate(task.id)}
              onDelete={() => setDeletingTaskId(task.id)}
            />
          ))}
        </div>
      )}

      {tasks && tasks.length > 0 && view === "calendar" && (
        <TaskCalendar tasks={tasks} onSelectTask={(task) => setDetailTaskId(task.id)} />
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editingTask} />

      <TaskDetailDialog
        task={detailTask}
        open={detailTaskId !== null}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
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
