import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GithubIcon,
  ListTodoIcon,
  PencilIcon,
  UserIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { HealthBadge, ServiceStatusBadge } from "@/components/services/service-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskReference } from "@/components/tasks/task-reference";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateService } from "@/hooks/use-catalog";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { serviceQuery, teamMembersQuery } from "@/lib/queries";
import type { ServiceDetail } from "@/lib/types";
import { m } from "@/paraglide/messages";

const NO_OWNER = "__none__";

export const Route = createFileRoute("/_app/services/$codename")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(serviceQuery(params.codename)),
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { codename } = Route.useParams();
  const { data: service, isPending, isError, refetch } = useQuery(serviceQuery(codename));
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <Link
        to="/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        {m.services_back()}
      </Link>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {service && (
        <>
          <header className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card p-2.5">
                  <ServiceLogo
                    codename={service.codename}
                    logoUrl={service.logoUrl}
                    className="size-full"
                  />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{service.name}</h1>
                  <p className="mt-1 text-sm text-primary">{service.tagline}</p>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {service.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={service.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="rtl:-scale-x-100" aria-hidden="true" />
                      {m.services_open_site()}
                    </a>
                  </Button>
                )}
                <Button size="sm" onClick={() => setEditing((v) => !v)}>
                  <PencilIcon aria-hidden="true" />
                  {m.services_edit()}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <ServiceStatusBadge status={service.status} />
              <HealthBadge
                latest={service.healthChecks[0] ?? null}
                monitored={Boolean(service.healthCheckUrl)}
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="size-3" aria-hidden="true" />
                <span dir="auto">{service.owner?.displayName ?? m.services_no_owner()}</span>
              </span>
              {service.repoUrl && (
                <a
                  href={service.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <GithubIcon className="size-3" aria-hidden="true" />
                  {m.services_repo_label()}
                </a>
              )}
            </div>
          </header>

          {editing && <ServiceDetailsForm service={service} onDone={() => setEditing(false)} />}

          <Separator />

          <section className="space-y-2">
            <h2 className="font-semibold">{m.services_overview_title()}</h2>
            {service.overview ? (
              <p
                dir="auto"
                className="text-sm break-words whitespace-pre-wrap text-muted-foreground"
              >
                {service.overview}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{m.services_overview_empty()}</p>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="font-semibold">{m.services_tasks_title()}</h2>

            {service.tasks.length === 0 ? (
              <EmptyState
                icon={ListTodoIcon}
                title={m.services_tasks_empty()}
                body={m.empty_tasks_body()}
              />
            ) : (
              <ul className="space-y-2">
                {service.tasks.map((task) => (
                  <li key={task.id} className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <TaskReference reference={task.reference} />
                      <span dir="auto" className="font-medium break-words">
                        {task.title}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.assignees.map(({ user }) => (
                        <span
                          key={user.id}
                          dir="auto"
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {user.displayName}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {service.healthChecks.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h2 className="font-semibold">{m.health_history()}</h2>
                <ul className="space-y-1 text-sm">
                  {service.healthChecks.slice(0, 10).map((check) => (
                    <li
                      key={check.id}
                      className="flex flex-wrap items-center gap-2 text-muted-foreground"
                    >
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          check.isUp ? "bg-primary" : "bg-destructive"
                        }`}
                        aria-hidden="true"
                      />
                      <span dir="auto">{formatDateTime(check.checkedAt)}</span>
                      <span>{check.isUp ? m.health_up() : m.health_down()}</span>
                      {check.responseTimeMs !== null && (
                        <span dir="ltr">
                          {m.health_response_time({ ms: check.responseTimeMs })}
                        </span>
                      )}
                      {check.error && <span className="text-destructive">{check.error}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ServiceDetailsForm({ service, onDone }: { service: ServiceDetail; onDone: () => void }) {
  const { data: members = [] } = useQuery(teamMembersQuery);
  const updateService = useUpdateService(service.codename);
  const overviewId = useId();
  const repoId = useId();
  const healthId = useId();
  const ownerId = useId();

  const [form, setForm] = useState({
    overview: service.overview ?? "",
    repoUrl: service.repoUrl ?? "",
    healthCheckUrl: service.healthCheckUrl ?? "",
    ownerId: service.ownerId ?? NO_OWNER,
  });

  const errorMessage = updateService.error instanceof ApiError ? updateService.error.message : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await updateService
      .mutateAsync({
        overview: form.overview.trim() || null,
        repoUrl: form.repoUrl.trim() || null,
        healthCheckUrl: form.healthCheckUrl.trim() || null,
        ownerId: form.ownerId === NO_OWNER ? null : form.ownerId,
      })
      .catch(() => null);

    if (!saved) return;
    toast.success(m.services_save());
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor={overviewId}>{m.services_overview_title()}</Label>
        <Textarea
          id={overviewId}
          value={form.overview}
          rows={6}
          maxLength={20000}
          placeholder={m.services_overview_placeholder()}
          onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={ownerId}>{m.services_owner_label()}</Label>
          <Select
            value={form.ownerId}
            onValueChange={(value) => setForm((f) => ({ ...f, ownerId: value }))}
          >
            <SelectTrigger id={ownerId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_OWNER}>{m.services_no_owner()}</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={repoId}>{m.services_repo_label()}</Label>
          <Input
            id={repoId}
            value={form.repoUrl}
            dir="ltr"
            type="url"
            maxLength={300}
            placeholder="https://github.com/KStacks-org/..."
            onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={healthId}>{m.services_health_url_label()}</Label>
        <Input
          id={healthId}
          value={form.healthCheckUrl}
          dir="ltr"
          type="url"
          maxLength={300}
          placeholder="https://..."
          onChange={(e) => setForm((f) => ({ ...f, healthCheckUrl: e.target.value }))}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" disabled={updateService.isPending}>
          {m.services_save()}
        </Button>
      </div>
    </form>
  );
}
