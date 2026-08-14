import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAddSubtask, useDeleteSubtask, useToggleSubtask } from "@/hooks/use-tasks";
import type { Subtask } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function SubtaskList({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const [draft, setDraft] = useState("");
  const addSubtask = useAddSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();

  const completed = subtasks.filter((s) => s.isCompleted).length;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    const created = await addSubtask.mutateAsync({ taskId, title }).catch(() => null);
    if (created) setDraft("");
  };

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{m.subtasks_title()}</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {m.subtasks_progress({ completed, total: subtasks.length })}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="space-y-1">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="group flex items-center gap-2.5 rounded-md py-1">
              <Checkbox
                id={`subtask-${subtask.id}`}
                checked={subtask.isCompleted}
                onCheckedChange={(checked) =>
                  toggleSubtask.mutate({
                    id: subtask.id,
                    isCompleted: checked === true,
                  })
                }
              />
              <label
                htmlFor={`subtask-${subtask.id}`}
                dir="auto"
                className={`flex-1 cursor-pointer text-sm break-words ${
                  subtask.isCompleted ? "text-muted-foreground line-through" : ""
                }`}
              >
                {subtask.title}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => deleteSubtask.mutate(subtask.id)}
                disabled={deleteSubtask.isPending}
                aria-label={`${m.task_delete()}: ${subtask.title}`}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={draft}
          maxLength={200}
          placeholder={m.subtasks_add_placeholder()}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={m.subtasks_add_placeholder()}
        />
        <Button type="submit" variant="secondary" disabled={addSubtask.isPending || !draft.trim()}>
          {addSubtask.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PlusIcon aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">{m.subtasks_add_action()}</span>
        </Button>
      </form>
    </section>
  );
}
