import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDaysIcon,
  ColumnsIcon,
  FilterXIcon,
  ListIcon,
  ListTodoIcon,
  PlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import {
  EMPTY_FILTERS,
  filterTasks,
  hasActiveFilters,
  type TaskFilters,
  TaskFiltersBar,
} from "@/components/tasks/task-filters";
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

type ViewMode = "list" | "board" | "calendar";

function TasksPage() {
  const { user } = Route.useRouteContext();
  const { data: tasks, isPending, isError, refetch } = useQuery(tasksQuery(false));
  const archiveTask = useArchiveTask();

  // View mode and filters are pure presentation — neither refetches.
  const [view, setView] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const visibleTasks = useMemo(
    () => filterTasks(tasks ?? [], filters, user.id),
    [tasks, filters, user.id],
  );

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

  const hasTasks = (tasks?.length ?? 0) > 0;
  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{m.nav_tasks()}</h1>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="list" aria-label={m.view_list()}>
                <ListIcon aria-hidden="true" />
                <span className="hidden sm:inline">{m.view_list()}</span>
              </TabsTrigger>
              <TabsTrigger value="board" aria-label={m.view_board()}>
                <ColumnsIcon aria-hidden="true" />
                <span className="hidden sm:inline">{m.view_board()}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" aria-label={m.view_calendar()}>
                <CalendarDaysIcon aria-hidden="true" />
                <span className="hidden sm:inline">{m.view_calendar()}</span>
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

      {tasks && (
        <>
          <QuickAddTask currentUserId={user.id} />

          {hasTasks && (
            <TaskFiltersBar
              filters={filters}
              onChange={setFilters}
              shown={visibleTasks.length}
              total={tasks.length}
            />
          )}

          {!hasTasks && (
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

          {hasTasks && visibleTasks.length === 0 && (
            <EmptyState
              icon={FilterXIcon}
              title={m.empty_filtered_title()}
              body={m.empty_filtered_body()}
              action={
                <Button
                  variant="outline"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-1"
                >
                  {m.filters_clear()}
                </Button>
              }
            />
          )}

          {visibleTasks.length > 0 && view === "list" && (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
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

          {visibleTasks.length > 0 && view === "board" && (
            <TaskBoard tasks={visibleTasks} onSelectTask={(task) => setDetailTaskId(task.id)} />
          )}

          {visibleTasks.length > 0 && view === "calendar" && (
            <TaskCalendar
              tasks={visibleTasks}
              onSelectTask={(task) => setDetailTaskId(task.id)}
              emptyHint={filtersActive ? m.empty_filtered_body() : undefined}
            />
          )}
        </>
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
