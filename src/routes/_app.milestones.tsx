import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProgressBar } from "@/components/shared/progress-bar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type MilestoneValues,
  useCreateMilestone,
  useDeleteMilestone,
  useUpdateMilestone,
} from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api";
import { formatDate, fromDateTimeLocalValue, isOverdue, toDateTimeLocalValue } from "@/lib/format";
import { milestonesQuery } from "@/lib/queries";
import type { Milestone } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/milestones")({
  loader: ({ context }) => context.queryClient.ensureQueryData(milestonesQuery),
  component: MilestonesPage,
});

function MilestonesPage() {
  const { data: milestones, isPending, isError, refetch } = useQuery(milestonesQuery);
  const deleteMilestone = useDeleteMilestone();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.milestones_title()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.milestones_subtitle()}</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{m.milestones_new()}</span>
        </Button>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {milestones && milestones.length === 0 && (
        <EmptyState
          icon={TargetIcon}
          title={m.milestones_empty_title()}
          body={m.milestones_empty_body()}
          action={
            <Button onClick={openCreate} className="mt-1">
              <PlusIcon aria-hidden="true" />
              {m.milestones_new()}
            </Button>
          }
        />
      )}

      {milestones && milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const overdue =
              milestone.deadline !== null &&
              isOverdue(milestone.deadline) &&
              (milestone.progress.percent ?? 0) < 100;

            return (
              <article
                key={milestone.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 dir="auto" className="font-semibold break-words">
                      {milestone.title}
                    </h2>
                    {milestone.description && (
                      <p dir="auto" className="mt-1 text-sm break-words text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground"
                        aria-label={`${milestone.title} — actions`}
                      >
                        <MoreVerticalIcon aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(milestone);
                          setFormOpen(true);
                        }}
                      >
                        <PencilIcon aria-hidden="true" />
                        {m.milestones_edit()}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeletingId(milestone.id)}
                      >
                        <Trash2Icon aria-hidden="true" />
                        {m.action_delete()}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {m.milestones_progress({
                        completed: milestone.progress.completedTasks,
                        total: milestone.progress.totalTasks,
                      })}
                    </span>
                    <span dir="ltr" className="font-mono text-sm font-semibold">
                      {milestone.progress.percent === null ? "—" : `${milestone.progress.percent}%`}
                    </span>
                  </div>
                  <ProgressBar percent={milestone.progress.percent ?? 0} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {milestone.deadline ? (
                    <Badge
                      variant="outline"
                      className={
                        overdue
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      <CalendarIcon className="size-3" aria-hidden="true" />
                      <span dir="auto">{formatDate(milestone.deadline)}</span>
                      {overdue && <span className="font-semibold">· {m.task_overdue()}</span>}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {m.task_no_deadline()}
                    </Badge>
                  )}

                  {milestone.progress.totalTasks === 0 && (
                    <span className="text-xs text-muted-foreground">{m.milestones_no_tasks()}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <MilestoneFormDialog open={formOpen} onOpenChange={setFormOpen} milestone={editing} />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.milestones_delete_title()}</AlertDialogTitle>
            <AlertDialogDescription>{m.milestones_delete_body()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.action_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (deletingId) deleteMilestone.mutate(deletingId);
                setDeletingId(null);
              }}
              disabled={deleteMilestone.isPending}
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

function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-md">
        <MilestoneFormBody milestone={milestone} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function MilestoneFormBody({
  milestone,
  onOpenChange,
}: {
  milestone?: Milestone;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(milestone);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();

  const titleId = useId();
  const descriptionId = useId();
  const deadlineId = useId();

  const [form, setForm] = useState({
    title: milestone?.title ?? "",
    description: milestone?.description ?? "",
    deadline: toDateTimeLocalValue(milestone?.deadline ?? null),
  });
  const [touched, setTouched] = useState(false);

  const pending = createMilestone.isPending || updateMilestone.isPending;
  const titleInvalid = touched && form.title.trim().length === 0;
  const mutationError = createMilestone.error ?? updateMilestone.error;
  const serverMessage = mutationError instanceof ApiError ? mutationError.message : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (form.title.trim().length === 0) return;

    const values: MilestoneValues = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      deadline: fromDateTimeLocalValue(form.deadline),
    };

    const result = milestone
      ? await updateMilestone.mutateAsync({ id: milestone.id, values }).catch(() => null)
      : await createMilestone.mutateAsync(values).catch(() => null);

    if (!result) return;
    toast.success(isEdit ? m.action_save() : m.milestones_new());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? m.milestones_edit() : m.milestones_new()}</DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit ? m.milestones_edit() : m.milestones_new()}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={titleId}>{m.task_title_label()}</Label>
          <Input
            id={titleId}
            maxLength={150}
            placeholder="Portal MVP"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            aria-invalid={titleInvalid || undefined}
          />
          {titleInvalid && (
            <p className="text-sm text-destructive">{m.validation_title_required()}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>{m.task_description_label()}</Label>
          <Textarea
            id={descriptionId}
            rows={2}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={deadlineId}>{m.milestones_deadline()}</Label>
          <Input
            id={deadlineId}
            type="datetime-local"
            dir="ltr"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
        </div>

        {serverMessage && (
          <p role="alert" className="text-sm text-destructive">
            {serverMessage}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {m.action_cancel()}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {isEdit ? m.action_save() : m.milestones_new()}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
