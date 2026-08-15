import {
  CircleCheckIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClockIcon,
  FlaskConicalIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HealthCheck, ServiceStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

/**
 * Release status, using the vocabulary already published on kstacks.org
 * (Live / Beta / Coming Soon) rather than inventing synonyms.
 */
export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const config = {
    LIVE: {
      label: m.services_status_live(),
      icon: CircleCheckIcon,
      className: "border-primary/40 bg-primary/10 text-primary",
    },
    BETA: {
      label: m.services_status_beta(),
      icon: FlaskConicalIcon,
      className: "border-amber-500/40 bg-amber-500/10 text-amber-500",
    },
    COMING_SOON: {
      label: m.services_status_coming_soon(),
      icon: ClockIcon,
      className: "border-border bg-muted text-muted-foreground",
    },
  }[status];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

/** Live/down indicator from the most recent probe. */
export function HealthBadge({
  latest,
  monitored,
}: {
  latest: HealthCheck | null;
  monitored: boolean;
}) {
  // A service with a health URL but no probe yet is *pending*, not unmonitored —
  // conflating the two would misreport a service the team is actually watching.
  if (!monitored || !latest) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CircleHelpIcon className="size-3" aria-hidden="true" />
        {monitored ? m.health_pending() : m.health_unknown()}
      </Badge>
    );
  }

  return latest.isUp ? (
    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
      <CircleCheckIcon className="size-3" aria-hidden="true" />
      {m.health_up()}
    </Badge>
  ) : (
    <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
      <CircleXIcon className="size-3" aria-hidden="true" />
      {m.health_down()}
    </Badge>
  );
}
