import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ServiceLogo } from "@/components/services/service-logo";
import { AssigneeCombobox } from "@/components/tasks/assignee-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type TaskFormValues, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/format";
import { milestonesQuery, servicesQuery } from "@/lib/queries";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

const NO_SERVICE = "__none__";
const NO_MILESTONE = "__none__";

type FormState = {
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  serviceId: string;
  milestoneId: string;
  assigneeIds: string[];
};

function initialState(task?: Task): FormState {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    deadline: toDateTimeLocalValue(task?.deadline ?? null),
    priority: task?.priority ?? "MEDIUM",
    status: task?.status ?? "TODO",
    serviceId: task?.serviceId ?? NO_SERVICE,
    milestoneId: task?.milestoneId ?? NO_MILESTONE,
    assigneeIds: task?.assignees.map((a) => a.userId) ?? [],
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto sm:max-w-lg">
        {/* Radix unmounts this subtree when the dialog closes, so the form state
            below is seeded afresh from `task` on every open — no effect needed. */}
        <TaskFormBody task={task} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function TaskFormBody({
  task,
  onOpenChange,
}: {
  task?: Task;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(task);
  const { data: services = [] } = useQuery(servicesQuery);
  const { data: milestones = [] } = useQuery(milestonesQuery);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [form, setForm] = useState<FormState>(() => initialState(task));
  const [touched, setTouched] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const deadlineId = useId();
  const priorityId = useId();
  const serviceFieldId = useId();
  const statusFieldId = useId();
  const milestoneFieldId = useId();
  const assigneesLabelId = useId();
  const assigneesTriggerId = useId();

  const pending = createTask.isPending || updateTask.isPending;
  const titleInvalid = touched && form.title.trim().length === 0;
  const assigneesInvalid = touched && form.assigneeIds.length === 0;

  const mutationError = createTask.error ?? updateTask.error;

  // A 409 from the assignee guard carries the people who still own subtasks.
  const blockedBy =
    mutationError instanceof ApiError && mutationError.status === 409
      ? ((mutationError.details as { blockedBy?: Array<{ displayName: string }> } | undefined)
          ?.blockedBy ?? [])
      : [];

  const serverMessage =
    blockedBy.length > 0
      ? m.assignee_remove_blocked({
          names: blockedBy.map((person) => person.displayName).join("، "),
        })
      : mutationError instanceof ApiError
        ? mutationError.message
        : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (form.title.trim().length === 0 || form.assigneeIds.length === 0) return;

    const values: TaskFormValues = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      deadline: fromDateTimeLocalValue(form.deadline),
      priority: form.priority,
      status: form.status,
      serviceId: form.serviceId === NO_SERVICE ? null : form.serviceId,
      milestoneId: form.milestoneId === NO_MILESTONE ? null : form.milestoneId,
      assigneeIds: form.assigneeIds,
    };

    const result = task
      ? await updateTask.mutateAsync({ id: task.id, values }).catch(() => null)
      : await createTask.mutateAsync(values).catch(() => null);

    if (!result) return;
    toast.success(isEdit ? m.task_save() : m.task_create_submit());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? m.task_edit() : m.task_new()}</DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit ? m.task_edit() : m.task_new()}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={titleId}>{m.task_title_label()}</Label>
          <Input
            id={titleId}
            value={form.title}
            maxLength={200}
            placeholder={m.task_title_placeholder()}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            aria-invalid={titleInvalid || undefined}
            aria-describedby={titleInvalid ? `${titleId}-error` : undefined}
          />
          {titleInvalid && (
            <p id={`${titleId}-error`} className="text-sm text-destructive">
              {m.validation_title_required()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>{m.task_description_label()}</Label>
          <Textarea
            id={descriptionId}
            value={form.description}
            maxLength={5000}
            rows={3}
            placeholder={m.task_description_placeholder()}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={deadlineId}>{m.task_deadline_label()}</Label>
            <Input
              id={deadlineId}
              type="datetime-local"
              value={form.deadline}
              dir="ltr"
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={priorityId}>{m.task_priority_label()}</Label>
            <Select
              value={form.priority}
              onValueChange={(value) => setForm((f) => ({ ...f, priority: value as Priority }))}
            >
              <SelectTrigger id={priorityId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{m.priority_low()}</SelectItem>
                <SelectItem value="MEDIUM">{m.priority_medium()}</SelectItem>
                <SelectItem value="HIGH">{m.priority_high()}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={statusFieldId}>{m.task_status_label()}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value as TaskStatus }))}
            >
              <SelectTrigger id={statusFieldId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">{m.status_todo()}</SelectItem>
                <SelectItem value="IN_PROGRESS">{m.status_in_progress()}</SelectItem>
                <SelectItem value="BLOCKED">{m.status_blocked()}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={milestoneFieldId}>{m.task_milestone_label()}</Label>
            <Select
              value={form.milestoneId}
              onValueChange={(value) => setForm((f) => ({ ...f, milestoneId: value }))}
            >
              <SelectTrigger id={milestoneFieldId} className="w-full">
                <SelectValue placeholder={m.task_no_milestone()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MILESTONE}>{m.task_no_milestone()}</SelectItem>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={serviceFieldId}>{m.task_service_label()}</Label>
          <Select
            value={form.serviceId}
            onValueChange={(value) => setForm((f) => ({ ...f, serviceId: value }))}
          >
            <SelectTrigger id={serviceFieldId} className="w-full">
              <SelectValue placeholder={m.task_service_placeholder()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SERVICE}>{m.task_no_service()}</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <span className="flex items-center gap-2">
                    <ServiceLogo codename={service.codename} className="size-4" />
                    {service.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label id={assigneesLabelId} htmlFor={assigneesTriggerId}>
            {m.task_assignees_label()}
          </Label>
          <AssigneeCombobox
            id={assigneesTriggerId}
            labelledBy={assigneesLabelId}
            selectedIds={form.assigneeIds}
            onChange={(ids) => setForm((f) => ({ ...f, assigneeIds: ids }))}
            invalid={assigneesInvalid}
          />
          {assigneesInvalid && (
            <p className="text-sm text-destructive">{m.validation_assignees_required()}</p>
          )}
        </div>

        {serverMessage && (
          <p role="alert" className="text-sm text-destructive">
            {serverMessage}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {m.task_cancel()}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {isEdit ? m.task_save() : m.task_create_submit()}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
