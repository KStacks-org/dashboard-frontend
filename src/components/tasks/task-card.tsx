import {
  ArchiveRestoreIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FlagIcon,
  LinkIcon,
  ListChecksIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { ServiceLogo } from "@/components/services/service-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import { hasExpandableDetails, TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskReference } from "@/components/tasks/task-reference";
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
  // Collapsed by default so a long list stays scannable; the chevron reveals
  // everything attached to the task — subtasks, links and comments — for
  // reading, while adding to any of them stays in the detail dialog.
  const [expanded, setExpanded] = useState(false);

  const overdue = !task.isArchived && isOverdue(task.deadline);
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const hasSubtasks = task.subtasks.length > 0;
  const expandable = hasExpandableDetails(task);

  return (
    <article className="group rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex items-start gap-2 p-4 sm:p-5">
        {expandable ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="mt-0.5 shrink-0 text-muted-foreground"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={expanded ? m.details_collapse() : m.details_expand()}
          >
            <ChevronRightIcon
              className={`transition-transform rtl:-scale-x-100 ${
                expanded ? "rotate-90 rtl:-rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </Button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onOpen}
              className="min-w-0 flex-1 text-start focus-visible:outline-none"
            >
              <span className="flex flex-wrap items-center gap-2">
                <TaskReference reference={task.reference} />
                <h3 dir="auto" className="font-semibold break-words hover:text-primary">
                  {task.title}
                </h3>
              </span>
              {task.description && (
                <p
                  dir="auto"
                  className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground"
                >
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
            {!task.isArchived && <StatusBadge status={task.status} />}
            <PriorityBadge priority={task.priority} />

            {task.service && (
              <Badge variant="outline" className="text-muted-foreground">
                <ServiceLogo
                  codename={task.service.codename}
                  logoUrl={task.service.logoUrl}
                  className="size-3.5"
                />
                {task.service.name}
              </Badge>
            )}

            {task.milestone && (
              <Badge variant="outline" className="text-muted-foreground">
                <FlagIcon className="size-3" aria-hidden="true" />
                <span dir="auto">{task.milestone.title}</span>
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

            {hasSubtasks && (
              <Badge variant="outline" className="text-muted-foreground">
                <ListChecksIcon className="size-3" aria-hidden="true" />
                {m.subtasks_progress({
                  completed: completedSubtasks,
                  total: task.subtasks.length,
                })}
              </Badge>
            )}

            {task.comments.length > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                <MessageSquareIcon className="size-3" aria-hidden="true" />
                {task.comments.length}
              </Badge>
            )}

            {task.links.length > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                <LinkIcon className="size-3" aria-hidden="true" />
                {task.links.length}
              </Badge>
            )}
          </div>

          {task.assignees.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
              <span className="text-xs text-muted-foreground">{m.task_assigned_to()}</span>
              {task.assignees.map(({ user }) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 rounded-md bg-primary/10 py-0.5 ps-0.5 pe-2 text-xs font-medium text-primary"
                >
                  <UserAvatar className="size-4" isCreator={user.id === task.createdById} />
                  <span dir="auto">{user.displayName}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {expanded && <TaskDetailPanel task={task} />}
    </article>
  );
}
