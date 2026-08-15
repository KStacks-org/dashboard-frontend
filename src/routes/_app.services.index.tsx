import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon, LayersIcon, ListTodoIcon, UserIcon } from "lucide-react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { HealthBadge, ServiceStatusBadge } from "@/components/services/service-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { servicesQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/services/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQuery),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services, isPending, isError, refetch } = useQuery(servicesQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.services_title()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.services_subtitle()}</p>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {services && services.length === 0 && (
        <EmptyState
          icon={LayersIcon}
          title={m.services_title()}
          body={m.services_overview_empty()}
        />
      )}

      {services && services.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              to="/services/$codename"
              params={{ codename: service.codename }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 p-1.5">
                    <ServiceLogo
                      codename={service.codename}
                      logoUrl={service.logoUrl}
                      className="size-full"
                    />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold group-hover:text-primary">{service.name}</h2>
                    <p className="mt-0.5 text-xs text-primary">{service.tagline}</p>
                  </div>
                </div>
                <ChevronRightIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {service.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <ServiceStatusBadge status={service.status} />
                <HealthBadge
                  latest={service.healthChecks[0] ?? null}
                  monitored={Boolean(service.healthCheckUrl)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ListTodoIcon className="size-3" aria-hidden="true" />
                  {m.services_open_tasks({ count: service._count.tasks })}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="size-3" aria-hidden="true" />
                  <span dir="auto">{service.owner?.displayName ?? m.services_no_owner()}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
