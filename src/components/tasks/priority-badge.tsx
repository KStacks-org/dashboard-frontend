import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";
import { m } from "@/paraglide/messages";

/**
 * Priority always ships an icon + a text label alongside the color, so it stays
 * readable for color-blind users and in monochrome contexts.
 */
const PRIORITY_CONFIG: Record<
  Priority,
  { label: () => string; icon: typeof ChevronUpIcon; className: string }
> = {
  HIGH: {
    label: () => m.priority_high(),
    icon: ChevronUpIcon,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  MEDIUM: {
    label: () => m.priority_medium(),
    icon: MinusIcon,
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  LOW: {
    label: () => m.priority_low(),
    icon: ChevronDownIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" aria-hidden="true" />
      {config.label()}
    </Badge>
  );
}
