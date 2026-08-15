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
import { useCreateMember, useUpdateMember } from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api";
import type { TeamMemberProfile, UserRole } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberProfile;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto sm:max-w-lg">
        {/* Remounted on every open, so the form always reflects the chosen member. */}
        <MemberFormBody member={member} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function MemberFormBody({
  member,
  onOpenChange,
}: {
  member?: TeamMemberProfile;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(member);
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const emailId = useId();
  const nameId = useId();
  const jobId = useId();
  const roleId = useId();
  const respId = useId();

  const [form, setForm] = useState({
    email: member?.email ?? "",
    displayName: member?.displayName ?? "",
    jobTitle: member?.jobTitle ?? "",
    role: (member?.role ?? "MEMBER") as UserRole,
    // One responsibility per line is the least fiddly editor for a short list.
    responsibilities: (member?.responsibilities ?? []).join("\n"),
  });
  const [touched, setTouched] = useState(false);

  const pending = createMember.isPending || updateMember.isPending;
  const emailInvalid = touched && !isEdit && form.email.trim().length === 0;
  const nameInvalid = touched && form.displayName.trim().length === 0;

  const mutationError = createMember.error ?? updateMember.error;
  const serverMessage = mutationError instanceof ApiError ? mutationError.message : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (form.displayName.trim().length === 0) return;
    if (!isEdit && form.email.trim().length === 0) return;

    const responsibilities = form.responsibilities
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const result = member
      ? await updateMember
          .mutateAsync({
            id: member.id,
            values: {
              displayName: form.displayName.trim(),
              jobTitle: form.jobTitle.trim() || null,
              role: form.role,
              responsibilities,
            },
          })
          .catch(() => null)
      : await createMember
          .mutateAsync({
            email: form.email.trim(),
            displayName: form.displayName.trim(),
            jobTitle: form.jobTitle.trim() || null,
            role: form.role,
            responsibilities,
          })
          .catch(() => null);

    if (!result) return;
    toast.success(isEdit ? m.action_save() : m.team_created());
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? m.team_edit() : m.team_add()}</DialogTitle>
        <DialogDescription className="sr-only">
          {isEdit ? m.team_edit() : m.team_add()}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={emailId}>{m.team_email()}</Label>
          <Input
            id={emailId}
            type="email"
            dir="ltr"
            maxLength={200}
            placeholder={m.login_email_placeholder()}
            value={form.email}
            // The address is the account's identity; changing it is a separate,
            // deliberate operation rather than an incidental profile edit.
            disabled={isEdit}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            aria-invalid={emailInvalid || undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={nameId}>{m.team_name()}</Label>
          <Input
            id={nameId}
            maxLength={100}
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            aria-invalid={nameInvalid || undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={jobId}>{m.team_job_title()}</Label>
            <Input
              id={jobId}
              maxLength={120}
              placeholder="Lead Developer"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={roleId}>{m.team_role()}</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((f) => ({ ...f, role: value as UserRole }))}
            >
              <SelectTrigger id={roleId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">{m.team_role_member()}</SelectItem>
                <SelectItem value="ADMIN">{m.team_role_admin()}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={respId}>{m.team_responsibilities()}</Label>
          <Textarea
            id={respId}
            rows={4}
            placeholder={"Infrastructure\nAuth Service\nGroups Service"}
            value={form.responsibilities}
            onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))}
            aria-describedby={`${respId}-hint`}
          />
          <p id={`${respId}-hint`} className="text-xs text-muted-foreground">
            {m.team_responsibilities_hint()}
          </p>
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
            {isEdit ? m.action_save() : m.team_add()}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
