import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
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
import {
  type SponsoredProjectValues,
  useCreateSponsoredProject,
  useUpdateSponsoredProject,
} from "@/hooks/use-catalog";
import { ApiError } from "@/lib/api";
import type { SponsoredProject, SponsoredProjectStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const PROJECT_STATUSES: SponsoredProjectStatus[] = [
  "PROPOSED",
  "IN_REVIEW",
  "ACTIVE",
  "LAUNCHED",
  "ARCHIVED",
];

export function projectStatusLabel(status: SponsoredProjectStatus): string {
  return {
    PROPOSED: m.projects_status_proposed(),
    IN_REVIEW: m.projects_status_in_review(),
    ACTIVE: m.projects_status_active(),
    LAUNCHED: m.projects_status_launched(),
    ARCHIVED: m.projects_status_archived(),
  }[status];
}

function initialState(project?: SponsoredProject) {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    ownerName: project?.ownerName ?? "",
    contact: project?.contact ?? "",
    projectUrl: project?.projectUrl ?? "",
    repoUrl: project?.repoUrl ?? "",
    status: project?.status ?? ("PROPOSED" as SponsoredProjectStatus),
    resources: project?.resources ?? "",
    notes: project?.notes ?? "",
  };
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: SponsoredProject;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto sm:max-w-lg">
        {/* Remounts on every open, so the form always reflects the chosen project. */}
        <ProjectFormBody project={project} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectFormBody({
  project,
  onOpenChange,
}: {
  project?: SponsoredProject;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(project);
  const createProject = useCreateSponsoredProject();
  const updateProject = useUpdateSponsoredProject();
  const [form, setForm] = useState(() => initialState(project));
  const [touched, setTouched] = useState(false);

  const nameId = useId();
  const descriptionId = useId();
  const ownerId = useId();
  const contactId = useId();
  const urlId = useId();
  const repoId = useId();
  const statusId = useId();
  const resourcesId = useId();
  const notesId = useId();

  const pending = createProject.isPending || updateProject.isPending;
  const nameInvalid = touched && form.name.trim().length === 0;
  const descriptionInvalid = touched && form.description.trim().length === 0;
  const ownerInvalid = touched && form.ownerName.trim().length === 0;

  const mutationError = createProject.error ?? updateProject.error;
  const serverMessage = mutationError instanceof ApiError ? mutationError.message : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!form.name.trim() || !form.description.trim() || !form.ownerName.trim()) return;

    const values: SponsoredProjectValues = {
      name: form.name.trim(),
      description: form.description.trim(),
      ownerName: form.ownerName.trim(),
      contact: form.contact.trim() || null,
      projectUrl: form.projectUrl.trim() || null,
      repoUrl: form.repoUrl.trim() || null,
      status: form.status,
      resources: form.resources.trim() || null,
      notes: form.notes.trim() || null,
    };

    const result = project
      ? await updateProject.mutateAsync({ id: project.id, values }).catch(() => null)
      : await createProject.mutateAsync(values).catch(() => null);

    if (!result) return;
    toast.success(isEdit ? m.projects_save() : m.projects_create());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? m.projects_edit() : m.projects_new()}</DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit ? m.projects_edit() : m.projects_new()}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={nameId}>{m.projects_name()}</Label>
          <Input
            id={nameId}
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            aria-invalid={nameInvalid || undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionId}>{m.projects_description()}</Label>
          <Textarea
            id={descriptionId}
            value={form.description}
            rows={3}
            maxLength={5000}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            aria-invalid={descriptionInvalid || undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={ownerId}>{m.projects_owner()}</Label>
            <Input
              id={ownerId}
              value={form.ownerName}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              aria-invalid={ownerInvalid || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={contactId}>{m.projects_contact()}</Label>
            <Input
              id={contactId}
              value={form.contact}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={urlId}>{m.projects_url()}</Label>
            <Input
              id={urlId}
              value={form.projectUrl}
              type="url"
              dir="ltr"
              maxLength={300}
              placeholder="https://..."
              onChange={(e) => setForm((f) => ({ ...f, projectUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={repoId}>{m.projects_repo()}</Label>
            <Input
              id={repoId}
              value={form.repoUrl}
              type="url"
              dir="ltr"
              maxLength={300}
              placeholder="https://github.com/..."
              onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={statusId}>{m.projects_status()}</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, status: value as SponsoredProjectStatus }))
            }
          >
            <SelectTrigger id={statusId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {projectStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={resourcesId}>{m.projects_resources()}</Label>
          <Textarea
            id={resourcesId}
            value={form.resources}
            rows={2}
            maxLength={5000}
            placeholder={m.projects_resources_placeholder()}
            onChange={(e) => setForm((f) => ({ ...f, resources: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={notesId}>{m.projects_notes()}</Label>
          <Textarea
            id={notesId}
            value={form.notes}
            rows={2}
            maxLength={20000}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
            {isEdit ? m.projects_save() : m.projects_create()}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
