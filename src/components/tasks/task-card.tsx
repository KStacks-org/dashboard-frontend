import {
  ArchiveRestoreIcon,
  CalendarIcon,
  CheckCircle2Icon,
  LayersIcon,
  ListChecksIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, isOverdue } from "@/lib/format";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function TaskCard({
  task,
  canDelete,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  task: Task;
  canDelete: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  const overdue = !task.isArchived && isOverdue(task.deadline);
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <article className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-start focus-visible:outline-none"
        >
          {/* dir="auto" so an Arabic title inside the English UI (and vice versa)
              lays out from its own first strong character instead of inheriting
              the page direction, which reorders mixed Arabic/Latin strings. */}
          <h3 dir="auto" className="font-semibold break-words hover:text-primary">
            {task.title}
          </h3>
          {task.description && (
            <p dir="auto" className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground">
              {task.description}
            </p>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              aria-label={`${task.title} — actions`}
            >
              <MoreVerticalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>
              <ListChecksIcon aria-hidden="true" />
              {m.task_view_details()}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon aria-hidden="true" />
              {m.task_edit()}
            </DropdownMenuItem>
            {onArchive && (
              <DropdownMenuItem onSelect={onArchive}>
                <CheckCircle2Icon aria-hidden="true" />
                {m.task_mark_done()}
              </DropdownMenuItem>
            )}
            {onRestore && (
              <DropdownMenuItem onSelect={onRestore}>
                <ArchiveRestoreIcon aria-hidden="true" />
                {m.task_restore()}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2Icon aria-hidden="true" />
                  {m.task_delete()}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />

        {task.service && (
          <Badge variant="outline" className="text-muted-foreground">
            <LayersIcon className="size-3" aria-hidden="true" />
            {task.service.name}
          </Badge>
        )}

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
            <span dir="auto">{formatDateTime(task.deadline)}</span>
            {overdue && <span className="font-semibold">· {m.task_overdue()}</span>}
          </Badge>
        )}

        {task.subtasks.length > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            <ListChecksIcon className="size-3" aria-hidden="true" />
            {m.subtasks_progress({
              completed: completedSubtasks,
              total: task.subtasks.length,
            })}
          </Badge>
        )}
      </div>

      {task.assignees.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">{m.task_assigned_to()}</span>
          {task.assignees.map(({ user }) => (
            <span
              key={user.id}
              dir="auto"
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {user.displayName}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
