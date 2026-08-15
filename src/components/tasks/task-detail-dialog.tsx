import { CalendarIcon, LayersIcon, UserIcon } from "lucide-react";
import { ServiceLogo } from "@/components/services/service-logo";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import { SubtaskList } from "@/components/tasks/subtask-list";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskLinks } from "@/components/tasks/task-links";
import { TaskReference } from "@/components/tasks/task-reference";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, isOverdue } from "@/lib/format";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  currentUserId,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}) {
  if (!task) return null;

  const overdue = !task.isArchived && isOverdue(task.deadline);
  const taskAssignees = task.assignees.map((a) => a.user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <TaskReference reference={task.reference} />
            <DialogTitle dir="auto" className="break-words">
              {task.title}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">{m.task_view_details()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && (
            <p dir="auto" className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {!task.isArchived && <StatusBadge status={task.status} />}
            <PriorityBadge priority={task.priority} />
            <Badge variant="outline" className="text-muted-foreground">
              {task.service ? (
                <ServiceLogo
                  codename={task.service.codename}
                  logoUrl={task.service.logoUrl}
                  className="size-3.5"
                />
              ) : (
                <LayersIcon className="size-3" aria-hidden="true" />
              )}
              {task.service?.name ?? m.task_no_service()}
            </Badge>
            <Badge
              variant="outline"
              className={
                overdue
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "text-muted-foreground"
              }
            >
              <CalendarIcon className="size-3" aria-hidden="true" />
              {task.deadline ? (
                <span dir="auto">{formatDateTime(task.deadline)}</span>
              ) : (
                m.task_no_deadline()
              )}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              <UserIcon className="size-3" aria-hidden="true" />
              <span dir="auto">{m.task_created_by({ name: task.createdBy.displayName })}</span>
            </Badge>
          </div>

          {taskAssignees.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">{m.task_assigned_to()}</h3>
              <ul className="flex flex-wrap gap-1.5">
                {taskAssignees.map((user) => (
                  <li
                    key={user.id}
                    dir="auto"
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {user.displayName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />
          <SubtaskList taskId={task.id} subtasks={task.subtasks} taskAssignees={taskAssignees} />

          <Separator />
          <TaskLinks taskId={task.id} links={task.links} />

          <Separator />
          <TaskComments taskId={task.id} comments={task.comments} currentUserId={currentUserId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
