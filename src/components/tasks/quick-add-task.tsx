import { Loader2Icon, PlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/hooks/use-tasks";
import { m } from "@/paraglide/messages";

/**
 * One-line capture for the common case: jot a title now, fill in the details
 * later. The task is assigned to whoever typed it, since the API requires at
 * least one assignee and self-assignment is the sane default here.
 */
export function QuickAddTask({ currentUserId }: { currentUserId: string }) {
  const [title, setTitle] = useState("");
  const hintId = useId();
  const createTask = useCreateTask();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const created = await createTask
      .mutateAsync({ title: trimmed, assigneeIds: [currentUserId] })
      .catch(() => null);
    if (created) setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        maxLength={200}
        placeholder={m.quick_add_placeholder()}
        onChange={(e) => setTitle(e.target.value)}
        aria-label={m.quick_add_placeholder()}
        aria-describedby={hintId}
      />
      <Button type="submit" variant="secondary" disabled={createTask.isPending || !title.trim()}>
        {createTask.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon aria-hidden="true" />
        )}
        <span className="sr-only">{m.quick_add_placeholder()}</span>
      </Button>
      <span id={hintId} className="sr-only">
        {m.quick_add_hint()}
      </span>
    </form>
  );
}
