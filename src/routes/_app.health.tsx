import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ActivityIcon, ExternalLinkIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { HealthBadge } from "@/components/services/service-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { useCheckServiceNow } from "@/hooks/use-catalog";
import { formatDateTime } from "@/lib/format";
import { serviceHealthQuery } from "@/lib/queries";
import type { ServiceHealth } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/health")({
  loader: ({ context }) => context.queryClient.ensureQueryData(serviceHealthQuery),
  component: HealthPage,
});

function HealthPage() {
  const { data: services, isPending, isError, refetch } = useQuery(serviceHealthQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.health_title()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.health_subtitle()}</p>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {services && services.length === 0 && (
        <EmptyState icon={ActivityIcon} title={m.health_title()} body={m.health_no_url()} />
      )}

      {services && services.length > 0 && (
        <div className="space-y-3">
          {services.map((service) => (
            <HealthRow key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

function HealthRow({ service }: { service: ServiceHealth }) {
  const checkNow = useCheckServiceNow();
  const monitored = Boolean(service.healthCheckUrl);
  const uptimePercent = service.uptimeRatio === null ? null : Math.round(service.uptimeRatio * 100);

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 p-1.5">
            <ServiceLogo codename={service.codename} className="size-full" />
          </span>
          <div className="min-w-0">
            <Link
              to="/services/$codename"
              params={{ codename: service.codename }}
              className="font-semibold hover:text-primary"
            >
              {service.name}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <HealthBadge latest={service.latest} monitored={monitored} />
              {uptimePercent !== null && monitored && (
                <span dir="auto">{m.health_uptime({ percent: uptimePercent })}</span>
              )}
              {service.latest && (
                <span dir="auto">
                  {m.health_last_checked({ time: formatDateTime(service.latest.checkedAt) })}
                </span>
              )}
              {service.latest?.responseTimeMs !== null &&
                service.latest?.responseTimeMs !== undefined && (
                  <span dir="ltr">
                    {m.health_response_time({ ms: service.latest.responseTimeMs })}
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {service.url && (
            <Button variant="ghost" size="icon-sm" asChild aria-label={m.services_open_site()}>
              <a href={service.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          )}
          {monitored && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkNow.mutate(service.id)}
              disabled={checkNow.isPending}
            >
              {checkNow.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <RefreshCwIcon aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{m.health_check_now()}</span>
            </Button>
          )}
        </div>
      </div>

      {!monitored ? (
        <p className="mt-3 text-xs text-muted-foreground">{m.health_no_url()}</p>
      ) : (
        service.history.length > 0 && (
          <div className="mt-3">
            {/* Oldest → newest, so the strip reads in time order in both directions. */}
            <div className="flex items-end gap-0.5" dir="ltr">
              {service.history.map((check) => (
                <span
                  key={check.id}
                  title={`${formatDateTime(check.checkedAt)} — ${
                    check.isUp ? m.health_up() : (check.error ?? m.health_down())
                  }`}
                  className={`h-6 min-w-1 flex-1 rounded-sm ${
                    check.isUp ? "bg-primary/70" : "bg-destructive/80"
                  }`}
                />
              ))}
            </div>
          </div>
        )
      )}

      {service.latest?.error && (
        <p dir="auto" className="mt-2 text-xs break-words text-destructive">
          {service.latest.error}
        </p>
      )}
    </article>
  );
}
