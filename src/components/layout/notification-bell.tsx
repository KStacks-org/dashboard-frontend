import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AtSignIcon, BellIcon, BugIcon, CalendarClockIcon, ListTodoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/use-workspace";
import { formatDateTime } from "@/lib/format";
import { notificationsQuery } from "@/lib/queries";
import type { AppNotification, NotificationType } from "@/lib/types";
import { m } from "@/paraglide/messages";

const ICONS: Record<NotificationType, typeof BellIcon> = {
  TASK_ASSIGNED: ListTodoIcon,
  SUBTASK_ASSIGNED: ListTodoIcon,
  COMMENT_MENTION: AtSignIcon,
  ISSUE_ASSIGNED: BugIcon,
  DEADLINE_SOON: CalendarClockIcon,
};

function actionLabel(type: NotificationType): string {
  return {
    TASK_ASSIGNED: m.notif_task_assigned(),
    SUBTASK_ASSIGNED: m.notif_subtask_assigned(),
    COMMENT_MENTION: m.notif_comment_mention(),
    ISSUE_ASSIGNED: m.notif_issue_assigned(),
    DEADLINE_SOON: m.notif_deadline_soon(),
  }[type];
}

export function NotificationBell() {
  const { data } = useQuery(notificationsQuery);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const unread = data?.unread ?? 0;
  const notifications = data?.notifications ?? [];

  const open = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (notification.issue) void navigate({ to: "/issues" });
    else if (notification.task) void navigate({ to: "/tasks" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground"
          aria-label={
            unread > 0
              ? `${m.notifications_open()} — ${m.notifications_unread({ count: unread })}`
              : m.notifications_open()
          }
        >
          <BellIcon aria-hidden="true" />
          {unread > 0 && (
            <span
              dir="ltr"
              className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">{m.notifications_title()}</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              {m.notifications_mark_all()}
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {m.notifications_empty()}
          </p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = ICONS[notification.type];
              const subject =
                notification.task?.title ?? notification.issue?.title ?? notification.body;

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => open(notification)}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-start transition-colors hover:bg-muted/60 ${
                      notification.isRead ? "" : "bg-primary/5"
                    }`}
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Icon className="size-3" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block text-sm">
                        <span className="font-medium">
                          {notification.actor?.displayName ?? m.notif_system()}
                        </span>{" "}
                        {actionLabel(notification.type)}
                      </span>
                      <span dir="auto" className="block truncate text-xs text-muted-foreground">
                        {subject}
                      </span>
                      <span dir="auto" className="block text-[11px] text-muted-foreground/70">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </span>

                    {!notification.isRead && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
