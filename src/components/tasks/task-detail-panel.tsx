import { ExternalLinkIcon, LinkIcon, ListChecksIcon, MessageSquareIcon } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleSubtask } from "@/hooks/use-tasks";
import { formatDateTime } from "@/lib/format";
import type { Task } from "@/lib/types";
import { m } from "@/paraglide/messages";

/** Only the newest few comments are shown inline; the rest live in the dialog. */
const INLINE_COMMENT_LIMIT = 3;

export function hasExpandableDetails(task: Task): boolean {
  return task.subtasks.length > 0 || task.links.length > 0 || task.comments.length > 0;
}

/**
 * The read-only half of a task, revealed by the card's chevron.
 *
 * Deliberately carries no compose fields: reading a task and adding to it are
 * different modes, and the add forms live in the detail dialog. Ticking a
 * subtask is the one exception — it is a glance-and-go action, not authoring.
 */
export function TaskDetailPanel({ task }: { task: Task }) {
  const toggleSubtask = useToggleSubtask();

  const completed = task.subtasks.filter((s) => s.isCompleted).length;
  const visibleComments = task.comments.slice(-INLINE_COMMENT_LIMIT);
  const hiddenComments = task.comments.length - visibleComments.length;

  return (
    <div className="space-y-4 border-t border-border/60 py-3 ps-12 pe-4 sm:pe-5">
      {task.subtasks.length > 0 && (
        <section className="space-y-1">
          <SectionHeading icon={ListChecksIcon} label={m.subtasks_title()}>
            {m.subtasks_progress({ completed, total: task.subtasks.length })}
          </SectionHeading>

          <ul>
            {task.subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center gap-2.5 py-1">
                <Checkbox
                  id={`panel-subtask-${subtask.id}`}
                  checked={subtask.isCompleted}
                  onCheckedChange={(checked) =>
                    toggleSubtask.mutate({ id: subtask.id, isCompleted: checked === true })
                  }
                />
                <label
                  htmlFor={`panel-subtask-${subtask.id}`}
                  dir="auto"
                  className={`min-w-0 flex-1 cursor-pointer truncate text-sm ${
                    subtask.isCompleted ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {subtask.title}
                </label>
                {subtask.assignee && (
                  <span
                    dir="auto"
                    className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {subtask.assignee.displayName}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {task.links.length > 0 && (
        <section className="space-y-1">
          <SectionHeading icon={LinkIcon} label={m.links_title()} />

          <ul>
            {task.links.map((link) => (
              <li key={link.id} className="flex items-center gap-2 py-0.5">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="auto"
                  title={link.url}
                  className="min-w-0 max-w-full truncate text-sm text-primary hover:underline"
                >
                  {link.label || link.url}
                </a>
                <ExternalLinkIcon
                  className="size-3 shrink-0 text-muted-foreground rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {task.comments.length > 0 && (
        <section className="space-y-1.5">
          <SectionHeading icon={MessageSquareIcon} label={m.comments_title()}>
            {task.comments.length}
          </SectionHeading>

          <ul className="space-y-2">
            {visibleComments.map((comment) => (
              <li key={comment.id} className="flex gap-2">
                <UserAvatar
                  className="mt-0.5 size-6 shrink-0"
                  isCreator={comment.authorId === task.createdById}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span dir="auto" className="text-xs font-medium">
                      {comment.author.displayName}
                    </span>
                    <span dir="auto" className="text-[11px] text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p dir="auto" className="line-clamp-2 text-sm break-words text-muted-foreground">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {hiddenComments > 0 && (
            <p className="ps-8 text-xs text-muted-foreground">
              {m.comments_more({ count: hiddenComments })}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof LinkIcon;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <Icon className="size-3 shrink-0 translate-y-0.5 text-muted-foreground" aria-hidden="true" />
      <h4 className="text-xs font-semibold text-muted-foreground">{label}</h4>
      {children !== undefined && (
        <span className="text-[11px] text-muted-foreground/70">{children}</span>
      )}
    </div>
  );
}
