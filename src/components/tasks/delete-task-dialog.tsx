import { toast } from "sonner";
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
import { useDeleteTask } from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api";
import { m } from "@/paraglide/messages";

export function DeleteTaskDialog({
  taskId,
  open,
  onOpenChange,
  onDeleted,
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const deleteTask = useDeleteTask();

  const handleConfirm = async () => {
    try {
      await deleteTask.mutateAsync(taskId);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      onOpenChange(false);
      toast.error(
        error instanceof ApiError && error.status === 403
          ? m.task_delete_forbidden()
          : m.error_generic_body(),
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.task_delete_confirm_title()}</AlertDialogTitle>
          <AlertDialogDescription>{m.task_delete_confirm_body()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.task_delete_cancel()}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={deleteTask.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {m.task_delete_confirm_action()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
