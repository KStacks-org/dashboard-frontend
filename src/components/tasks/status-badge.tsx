import { CircleDashedIcon, CircleDotIcon, OctagonAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

/** Icon + label alongside the colour, so status never depends on colour alone. */
export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: () => string; icon: typeof CircleDotIcon; className: string; dotClassName: string }
> = {
  TODO: {
    label: () => m.status_todo(),
    icon: CircleDashedIcon,
    className: "border-border bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  IN_PROGRESS: {
    label: () => m.status_in_progress(),
    icon: CircleDotIcon,
    className: "border-primary/40 bg-primary/10 text-primary",
    dotClassName: "bg-primary",
  },
  BLOCKED: {
    label: () => m.status_blocked(),
    icon: OctagonAlertIcon,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    dotClassName: "bg-destructive",
  },
};

export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED"];

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" aria-hidden="true" />
      {config.label()}
    </Badge>
  );
}
