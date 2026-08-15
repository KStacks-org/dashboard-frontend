import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  BugIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import {
  ISSUE_STATUSES,
  IssueFormDialog,
  issueStatusLabel,
} from "@/components/issues/issue-form-dialog";
import { ServiceLogo } from "@/components/services/service-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConvertIssue, useDeleteIssue } from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { issuesQuery } from "@/lib/queries";
import type { Issue, IssueStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

const ALL = "__all__";

const STATUS_CLASSES: Record<IssueStatus, string> = {
  OPEN: "border-destructive/40 bg-destructive/10 text-destructive",
  IN_PROGRESS: "border-primary/40 bg-primary/10 text-primary",
  RESOLVED: "border-primary/60 bg-primary/20 text-primary",
  CLOSED: "border-border bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/_app/issues")({
  loader: ({ context }) => context.queryClient.ensureQueryData(issuesQuery),
  component: IssuesPage,
});

function IssuesPage() {
  const { user } = Route.useRouteContext();
  const { data: issues, isPending, isError, refetch } = useQuery(issuesQuery);
  const convertIssue = useConvertIssue();
  const deleteIssue = useDeleteIssue();

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Issue | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visible = (issues ?? []).filter(
    (issue) => statusFilter === ALL || issue.status === statusFilter,
  );

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleConvert = (issue: Issue) => {
    convertIssue.mutate(issue.id, {
      onSuccess: () => toast.success(m.issues_converted()),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : m.error_generic_body()),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.issues_title()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.issues_subtitle()}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              size="sm"
              className="w-auto min-w-[9rem]"
              aria-label={m.task_status_label()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{m.issues_filter_all()}</SelectItem>
              {ISSUE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {issueStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{m.issues_new()}</span>
          </Button>
        </div>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {issues && visible.length === 0 && (
        <EmptyState
          icon={BugIcon}
          title={m.issues_empty_title()}
          body={m.issues_empty_body()}
          action={
            <Button onClick={openCreate} className="mt-1">
              <PlusIcon aria-hidden="true" />
              {m.issues_new()}
            </Button>
          }
        />
      )}

      {visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((issue) => (
            <article
              key={issue.id}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-destructive/10 font-mono text-destructive"
                    >
                      <BugIcon className="size-3" aria-hidden="true" />
                      <span dir="ltr">IS-{issue.reference}</span>
                    </Badge>
                    <h2 dir="auto" className="font-semibold break-words">
                      {issue.title}
                    </h2>
                  </div>
                  {issue.description && (
                    <p
                      dir="auto"
                      className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground"
                    >
                      {issue.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label={`${issue.title} — actions`}
                    >
                      <MoreVerticalIcon aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(issue);
                        setFormOpen(true);
                      }}
                    >
                      <PencilIcon aria-hidden="true" />
                      {m.issues_edit()}
                    </DropdownMenuItem>
                    {!issue.convertedTaskId && (
                      <DropdownMenuItem onSelect={() => handleConvert(issue)}>
                        <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
                        {m.issues_convert()}
                      </DropdownMenuItem>
                    )}
                    {issue.reportedById === user.id && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingId(issue.id)}
                        >
                          <Trash2Icon aria-hidden="true" />
                          {m.action_delete()}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={STATUS_CLASSES[issue.status]}>
                  {issueStatusLabel(issue.status)}
                </Badge>
                <PriorityBadge priority={issue.priority} />

                {issue.service && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <ServiceLogo codename={issue.service.codename} className="size-3.5" />
                    {issue.service.name}
                  </Badge>
                )}

                <Badge variant="outline" className="text-muted-foreground">
                  <span dir="auto">
                    {issue.assignee ? issue.assignee.displayName : m.issues_unassigned()}
                  </span>
                </Badge>

                {issue.convertedTask && (
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    <span dir="ltr">KS-{issue.convertedTask.reference}</span>
                  </Badge>
                )}
              </div>

              <p
                dir="auto"
                className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground"
              >
                {m.issues_reported_by({ name: issue.reportedBy.displayName })} ·{" "}
                {formatDate(issue.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}

      <IssueFormDialog open={formOpen} onOpenChange={setFormOpen} issue={editing} />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.issues_delete_title()}</AlertDialogTitle>
            <AlertDialogDescription>{m.issues_delete_body()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.action_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (!deletingId) return;
                deleteIssue.mutate(deletingId, {
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : m.error_generic_body()),
                });
                setDeletingId(null);
              }}
              disabled={deleteIssue.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {m.action_delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
