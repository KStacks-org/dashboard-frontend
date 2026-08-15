import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BugIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  UserRoundXIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { GrantsDialog } from "@/components/team/grants-dialog";
import { MemberFormDialog } from "@/components/team/member-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateMember } from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api";
import { adminScopesQuery, teamQuery } from "@/lib/queries";
import type { TeamMemberProfile } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/team")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamQuery),
  component: TeamPage,
});

function TeamPage() {
  const { user } = Route.useRouteContext();
  const { data: members, isPending, isError, refetch } = useQuery(teamQuery);
  const updateMember = useUpdateMember();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMemberProfile | undefined>();
  const [grantsOpen, setGrantsOpen] = useState(false);
  const [grantee, setGrantee] = useState<TeamMemberProfile | undefined>();

  // Roster management needs the dashboard scope; changing who holds a scope is
  // narrower still, and only a super admin can do it.
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || user.adminScopes.includes("dashboard");

  const toggleActive = (member: TeamMemberProfile) => {
    updateMember.mutate(
      { id: member.id, values: { isActive: !member.isActive } },
      {
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : m.error_generic_body()),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.team_title()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.team_subtitle()}</p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <PlusIcon aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{m.team_add()}</span>
          </Button>
        )}
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {members && members.length === 0 && (
        <EmptyState icon={UsersIcon} title={m.team_empty_title()} body={m.team_empty_body()} />
      )}

      {members && members.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              canEditGrants={isSuperAdmin}
              isSelf={member.id === user.id}
              onEditGrants={() => {
                setGrantee(member);
                setGrantsOpen(true);
              }}
              onEdit={() => {
                setEditing(member);
                setFormOpen(true);
              }}
              onToggleActive={() => toggleActive(member)}
            />
          ))}
        </div>
      )}

      <MemberFormDialog open={formOpen} onOpenChange={setFormOpen} member={editing} />
      <GrantsDialog open={grantsOpen} onOpenChange={setGrantsOpen} member={grantee} />
    </div>
  );
}

function MemberCard({
  member,
  isAdmin,
  canEditGrants,
  isSelf,
  onEdit,
  onEditGrants,
  onToggleActive,
}: {
  member: TeamMemberProfile;
  isAdmin: boolean;
  canEditGrants: boolean;
  isSelf: boolean;
  onEdit: () => void;
  onEditGrants: () => void;
  onToggleActive: () => void;
}) {
  const { workload } = member;
  const totalTasks = workload.activeTasks + workload.completedTasks;
  const percent = totalTasks === 0 ? 0 : Math.round((workload.completedTasks / totalTasks) * 100);

  return (
    <article
      className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${
        member.isActive ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
              {member.displayName.trim().slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 dir="auto" className="font-semibold break-words">
                {member.displayName}
              </h2>
              <RoleBadges member={member} />
              {!member.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  {m.team_inactive()}
                </Badge>
              )}
            </div>
            {member.jobTitle && <p className="text-sm text-primary">{member.jobTitle}</p>}
            <p dir="ltr" className="truncate text-xs text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label={`${member.displayName} — actions`}
              >
                <MoreVerticalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <PencilIcon aria-hidden="true" />
                {m.team_edit()}
              </DropdownMenuItem>
              {canEditGrants && (
                <DropdownMenuItem onSelect={onEditGrants}>
                  <ShieldIcon aria-hidden="true" />
                  {m.grants_edit()}
                </DropdownMenuItem>
              )}
              {/* Deactivating yourself would lock you out mid-session. */}
              {!isSelf && (
                <DropdownMenuItem
                  variant={member.isActive ? "destructive" : "default"}
                  onSelect={onToggleActive}
                >
                  <UserRoundXIcon aria-hidden="true" />
                  {member.isActive ? m.team_deactivate() : m.team_reactivate()}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <section className="mt-4">
        <h3 className="text-xs font-semibold text-muted-foreground">{m.team_responsibilities()}</h3>
        {member.responsibilities.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{m.team_no_responsibilities()}</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {member.responsibilities.map((responsibility) => (
              <li
                key={responsibility}
                dir="auto"
                className="rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {responsibility}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 border-t border-border/60 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground">{m.team_workload()}</h3>
          <span dir="ltr" className="font-mono text-xs text-muted-foreground">
            {workload.completedTasks} / {totalTasks}
          </span>
        </div>
        <ProgressBar percent={percent} />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {workload.inProgress > 0 && (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              {m.team_in_progress({ count: workload.inProgress })}
            </Badge>
          )}
          {workload.todo > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {m.team_todo({ count: workload.todo })}
            </Badge>
          )}
          {workload.blocked > 0 && (
            <Badge
              variant="outline"
              className="border-destructive/40 bg-destructive/10 text-destructive"
            >
              {m.team_blocked({ count: workload.blocked })}
            </Badge>
          )}
          {workload.completedTasks > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {m.team_done({ count: workload.completedTasks })}
            </Badge>
          )}
          {workload.openIssues > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              <BugIcon className="size-3" aria-hidden="true" />
              {m.team_open_issues({ count: workload.openIssues })}
            </Badge>
          )}
        </div>
      </section>
    </article>
  );
}

/**
 * What this person administers, at a glance. A super admin gets one badge that
 * says so; everyone else gets one badge per scope, because "admin of kdevs and
 * kgroups" is a different fact from "admin", and the difference matters.
 */
function RoleBadges({ member }: { member: TeamMemberProfile }) {
  // Scopes are stored as codenames; people know the services by their names.
  const { data: scopes = [] } = useQuery(adminScopesQuery);
  const nameOf = (scope: string) => scopes.find((entry) => entry.scope === scope)?.name ?? scope;

  if (member.role === "SUPER_ADMIN") {
    return (
      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
        <ShieldIcon className="size-3" aria-hidden="true" />
        {m.team_role_super_admin()}
      </Badge>
    );
  }

  return (
    <>
      {member.adminGrants.map(({ scope }) =>
        scope === "dashboard" ? (
          <Badge
            key={scope}
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            <ShieldIcon className="size-3" aria-hidden="true" />
            {m.team_role_dashboard_admin()}
          </Badge>
        ) : (
          <Badge key={scope} variant="outline" className="text-muted-foreground">
            <ServiceLogo codename={scope} className="size-3.5" />
            {m.team_role_service_admin({ service: nameOf(scope) })}
          </Badge>
        ),
      )}
    </>
  );
}
