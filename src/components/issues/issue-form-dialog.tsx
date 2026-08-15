import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ServiceLogo } from "@/components/services/service-logo";
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
import { type IssueValues, useCreateIssue, useUpdateIssue } from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api";
import { servicesQuery, teamMembersQuery } from "@/lib/queries";
import type { Issue, IssueStatus, Priority } from "@/lib/types";
import { m } from "@/paraglide/messages";

const NONE = "__none__";

export const ISSUE_STATUSES: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function issueStatusLabel(status: IssueStatus): string {
  return {
    OPEN: m.issues_status_open(),
    IN_PROGRESS: m.issues_status_in_progress(),
    RESOLVED: m.issues_status_resolved(),
    CLOSED: m.issues_status_closed(),
  }[status];
}

export function IssueFormDialog({
  open,
  onOpenChange,
  issue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: Issue;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto sm:max-w-lg">
        <IssueFormBody issue={issue} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function IssueFormBody({
  issue,
  onOpenChange,
}: {
  issue?: Issue;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(issue);
  const { data: services = [] } = useQuery(servicesQuery);
  const { data: members = [] } = useQuery(teamMembersQuery);
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();

  const titleId = useId();
  const descriptionId = useId();
  const priorityId = useId();
  const statusId = useId();
  const serviceId = useId();
  const assigneeId = useId();

  const [form, setForm] = useState({
    title: issue?.title ?? "",
    description: issue?.description ?? "",
    priority: (issue?.priority ?? "MEDIUM") as Priority,
    status: (issue?.status ?? "OPEN") as IssueStatus,
    serviceId: issue?.serviceId ?? NONE,
    assigneeId: issue?.assigneeId ?? NONE,
  });
  const [touched, setTouched] = useState(false);

  const pending = createIssue.isPending || updateIssue.isPending;
  const titleInvalid = touched && form.title.trim().length === 0;
  const mutationError = createIssue.error ?? updateIssue.error;
  const serverMessage = mutationError instanceof ApiError ? mutationError.message : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (form.title.trim().length === 0) return;

    const values: IssueValues = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      serviceId: form.serviceId === NONE ? null : form.serviceId,
      assigneeId: form.assigneeId === NONE ? null : form.assigneeId,
    };

    const result = issue
      ? await updateIssue.mutateAsync({ id: issue.id, values }).catch(() => null)
      : await createIssue.mutateAsync(values).catch(() => null);

    if (!result) return;
    toast.success(isEdit ? m.action_save() : m.issues_new());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? m.issues_edit() : m.issues_new()}</DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit ? m.issues_edit() : m.issues_new()}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={titleId}>{m.task_title_label()}</Label>
          <Input
            id={titleId}
            maxLength={200}
            placeholder="Login occasionally returns 401"
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
            rows={3}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor={statusId}>{m.task_status_label()}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((f) => ({ ...f, status: value as IssueStatus }))}
            >
              <SelectTrigger id={statusId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {issueStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={serviceId}>{m.task_service_label()}</Label>
            <Select
              value={form.serviceId}
              onValueChange={(value) => setForm((f) => ({ ...f, serviceId: value }))}
            >
              <SelectTrigger id={serviceId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{m.task_no_service()}</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <span className="flex items-center gap-2">
                      <ServiceLogo
                        codename={service.codename}
                        logoUrl={service.logoUrl}
                        className="size-4"
                      />
                      {service.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={assigneeId}>{m.issues_assignee()}</Label>
            <Select
              value={form.assigneeId}
              onValueChange={(value) => setForm((f) => ({ ...f, assigneeId: value }))}
            >
              <SelectTrigger id={assigneeId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{m.issues_unassigned()}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            {isEdit ? m.action_save() : m.issues_new()}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
