import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ActivityIcon,
  BugIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ListChecksIcon,
  ListTodoIcon,
  TargetIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskReference } from "@/components/tasks/task-reference";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { overviewQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/overview")({
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewQuery),
  component: OverviewPage,
});

function OverviewPage() {
  const { data, isPending, isError, refetch } = useQuery(overviewQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.overview_title()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.overview_subtitle()}</p>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ListTodoIcon}
              label={m.stat_active_tasks()}
              value={data.stats.activeTasks}
              footnote={
                data.stats.overdueTasks > 0 ? (
                  <span className="text-destructive">
                    {m.stat_overdue({ count: data.stats.overdueTasks })}
                  </span>
                ) : data.stats.dueSoonTasks > 0 ? (
                  <span>{m.stat_due_soon({ count: data.stats.dueSoonTasks })}</span>
                ) : null
              }
            />
            <StatCard
              icon={CheckCircle2Icon}
              label={m.stat_completed_week()}
              value={data.stats.completedThisWeek}
            />
            <StatCard
              icon={BugIcon}
              label={m.stat_open_issues()}
              value={data.stats.openIssues}
              to="/issues"
            />
            <StatCard
              icon={ActivityIcon}
              label={m.stat_active_services()}
              // "7 / 8" reads as up-out-of-monitored, so it stays LTR.
              value={
                <span dir="ltr">
                  {data.stats.servicesUp} / {data.stats.servicesMonitored}
                </span>
              }
              to="/health"
            />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{m.overview_your_tasks()}</h2>
              <Link
                to="/tasks"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {m.overview_view_all()}
                <ChevronRightIcon className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>

            {data.myTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2Icon}
                title={m.overview_your_tasks_empty()}
                body={m.empty_tasks_body()}
              />
            ) : (
              <ul className="space-y-2">
                {data.myTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to="/tasks"
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 sm:p-4"
                    >
                      <TaskReference reference={task.reference} />
                      <span dir="auto" className="min-w-0 flex-1 font-medium break-words">
                        {task.title}
                      </span>

                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />

                      {task.service && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {task.service.name}
                        </Badge>
                      )}

                      {task.subtaskTotal > 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          <ListChecksIcon className="size-3" aria-hidden="true" />
                          {task.subtaskCompleted}/{task.subtaskTotal}
                        </Badge>
                      )}

                      {task.deadline && (
                        <Badge
                          variant="outline"
                          className={
                            isOverdue(task.deadline)
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          <CalendarIcon className="size-3" aria-hidden="true" />
                          <span dir="auto">{formatDateTime(task.deadline)}</span>
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.milestones.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{m.overview_milestones()}</h2>
                <Link
                  to="/milestones"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {m.overview_view_all()}
                  <ChevronRightIcon className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {data.milestones.map((milestone) => {
                  const percent =
                    milestone.totalTasks === 0
                      ? 0
                      : Math.round((milestone.completedTasks / milestone.totalTasks) * 100);
                  return (
                    <li key={milestone.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span dir="auto" className="font-medium break-words">
                          {milestone.title}
                        </span>
                        <TargetIcon
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <ProgressBar percent={percent} />
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {m.milestones_progress({
                            completed: milestone.completedTasks,
                            total: milestone.totalTasks,
                          })}
                        </span>
                        {milestone.deadline && (
                          <span dir="auto">{formatDate(milestone.deadline)}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  footnote,
  to,
}: {
  icon: typeof ListTodoIcon;
  label: string;
  value: ReactNode;
  footnote?: ReactNode;
  to?: "/issues" | "/health";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {footnote && <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>}
    </>
  );

  const className =
    "block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5";

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
