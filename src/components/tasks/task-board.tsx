import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarIcon, GripVerticalIcon, ListChecksIcon } from "lucide-react";
import { useState } from "react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { STATUS_CONFIG, TASK_STATUSES } from "@/components/tasks/status-badge";
import { TaskReference } from "@/components/tasks/task-reference";
import { Badge } from "@/components/ui/badge";
import { useUpdateTaskStatus } from "@/hooks/use-tasks";
import { formatDate, isOverdue } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

/**
 * Kanban over the same task array the list and calendar use. Dropping a card in
 * another column changes its status; finishing a task still archives it from the
 * card menu, so "done" never sits here as a permanently empty column.
 */
export function TaskBoard({
  tasks,
  onSelectTask,
}: {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}) {
  const updateStatus = useUpdateTaskStatus();
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingTask(tasks.find((task) => task.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over) return;

    const nextStatus = over.id as TaskStatus;
    if (!TASK_STATUSES.includes(nextStatus)) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === nextStatus) return;

    updateStatus.mutate({ id: task.id, status: nextStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingTask(null)}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks.filter((task) => task.status === status)}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>

      <DragOverlay>
        {draggingTask ? <BoardCardBody task={draggingTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({
  status,
  tasks,
  onSelectTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[12rem] flex-col rounded-xl border bg-card/40 p-2 transition-colors ${
        isOver ? "border-primary/60 bg-primary/5" : "border-border"
      }`}
    >
      <header className="flex items-center gap-2 px-1.5 py-2">
        <span className={`size-2 rounded-full ${config.dotClassName}`} aria-hidden="true" />
        <h2 className="text-sm font-semibold">{config.label()}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </header>

      {tasks.length === 0 ? (
        <p className="px-1.5 py-6 text-center text-xs text-muted-foreground">
          {m.board_empty_column()}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <DraggableBoardCard task={task} onSelect={() => onSelectTask(task)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DraggableBoardCard({ task, onSelect }: { task: Task; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-40" : undefined}>
      <BoardCardBody
        task={task}
        onSelect={onSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function BoardCardBody({
  task,
  onSelect,
  dragHandleProps,
  dragging,
}: {
  task: Task;
  onSelect?: () => void;
  dragHandleProps?: Record<string, unknown>;
  dragging?: boolean;
}) {
  const overdue = isOverdue(task.deadline);
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <article
      className={`rounded-lg border border-border bg-card p-3 ${
        dragging ? "shadow-lg" : "hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
          aria-label={`Move ${task.title}`}
          {...dragHandleProps}
        >
          <GripVerticalIcon className="size-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-start focus-visible:outline-none"
        >
          <TaskReference reference={task.reference} className="mb-1 inline-block" />
          <h3 dir="auto" className="text-sm font-medium break-words hover:text-primary">
            {task.title}
          </h3>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <PriorityBadge priority={task.priority} />
        {task.deadline && (
          <Badge
            variant="outline"
            className={
              overdue
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "text-muted-foreground"
            }
          >
            <CalendarIcon className="size-3" aria-hidden="true" />
            <span dir="auto">{formatDate(task.deadline)}</span>
          </Badge>
        )}
        {task.subtasks.length > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            <ListChecksIcon className="size-3" aria-hidden="true" />
            {completedSubtasks}/{task.subtasks.length}
          </Badge>
        )}
      </div>

      {task.assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.assignees.map(({ user }) => (
            <span
              key={user.id}
              dir="auto"
              className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {user.displayName}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
