import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Loader2Icon, PlusIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddSubtask,
  useAssignSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
  useToggleSubtask,
} from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api";
import type { Subtask, TeamMember } from "@/lib/types";
import { m } from "@/paraglide/messages";

const UNASSIGNED = "__unassigned__";

export function SubtaskList({
  taskId,
  subtasks,
  taskAssignees,
}: {
  taskId: string;
  subtasks: Subtask[];
  /** A subtask can only be owned by someone already on the parent task. */
  taskAssignees: TeamMember[];
}) {
  const [draft, setDraft] = useState("");
  const addSubtask = useAddSubtask();
  const deleteSubtask = useDeleteSubtask();
  const reorderSubtasks = useReorderSubtasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const completed = subtasks.filter((s) => s.isCompleted).length;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    const created = await addSubtask.mutateAsync({ taskId, title }).catch(() => null);
    if (created) setDraft("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...subtasks];
    const [moved] = reordered.splice(oldIndex, 1);
    if (!moved) return;
    reordered.splice(newIndex, 0, moved);

    reorderSubtasks.mutate({ taskId, orderedIds: reordered.map((s) => s.id) });
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1">
              {subtasks.map((subtask) => (
                <SortableSubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  taskAssignees={taskAssignees}
                  onDelete={() => deleteSubtask.mutate(subtask.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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

function SortableSubtaskRow({
  subtask,
  taskAssignees,
  onDelete,
}: {
  subtask: Subtask;
  taskAssignees: TeamMember[];
  onDelete: () => void;
}) {
  const toggleSubtask = useToggleSubtask();
  const assignSubtask = useAssignSubtask();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const handleAssign = (value: string) => {
    assignSubtask.mutate(
      { id: subtask.id, assigneeId: value === UNASSIGNED ? null : value },
      {
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : m.error_generic_body());
        },
      },
    );
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-md py-1 ${
        isDragging ? "bg-muted/60 shadow-sm" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        aria-label={`${m.subtask_reorder_handle()}: ${subtask.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" aria-hidden="true" />
      </button>

      <Checkbox
        id={`subtask-${subtask.id}`}
        checked={subtask.isCompleted}
        onCheckedChange={(checked) =>
          toggleSubtask.mutate({ id: subtask.id, isCompleted: checked === true })
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

      <Select value={subtask.assigneeId ?? UNASSIGNED} onValueChange={handleAssign}>
        <SelectTrigger
          size="sm"
          className="h-7 w-auto max-w-[9rem] border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-muted"
          aria-label={`${m.subtask_assignee_label()}: ${subtask.title}`}
        >
          <SelectValue>
            <span className="flex items-center gap-1 text-xs">
              <UserIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span dir="auto" className="truncate">
                {subtask.assignee?.displayName ?? m.subtask_unassigned()}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>{m.subtask_unassigned()}</SelectItem>
          {taskAssignees.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={onDelete}
        aria-label={`${m.task_delete()}: ${subtask.title}`}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </li>
  );
}
