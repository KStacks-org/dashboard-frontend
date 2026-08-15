import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ExternalLinkIcon,
  GithubIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ProjectFormDialog, projectStatusLabel } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteSponsoredProject } from "@/hooks/use-catalog";
import { sponsoredProjectsQuery } from "@/lib/queries";
import type { SponsoredProject, SponsoredProjectStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/projects")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sponsoredProjectsQuery),
  component: ProjectsPage,
});

const STATUS_CLASSES: Record<SponsoredProjectStatus, string> = {
  PROPOSED: "border-border bg-muted text-muted-foreground",
  IN_REVIEW: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  ACTIVE: "border-primary/40 bg-primary/10 text-primary",
  LAUNCHED: "border-primary/60 bg-primary/20 text-primary",
  ARCHIVED: "border-border bg-muted/50 text-muted-foreground",
};

function ProjectsPage() {
  const { data: projects, isPending, isError, refetch } = useQuery(sponsoredProjectsQuery);
  const deleteProject = useDeleteSponsoredProject();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SponsoredProject | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const ok = await deleteProject.mutateAsync(deletingId).then(
      () => true,
      () => false,
    );
    setDeletingId(null);
    if (!ok) toast.error(m.error_generic_body());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.projects_title()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.projects_subtitle()}</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{m.projects_new()}</span>
        </Button>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {projects && projects.length === 0 && (
        <EmptyState
          icon={RocketIcon}
          title={m.projects_empty_title()}
          body={m.projects_empty_body()}
          action={
            <Button onClick={openCreate} className="mt-1">
              <PlusIcon aria-hidden="true" />
              {m.projects_new()}
            </Button>
          }
        />
      )}

      {projects && projects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 dir="auto" className="font-semibold break-words">
                    {project.name}
                  </h2>
                  <p dir="auto" className="mt-0.5 text-xs text-muted-foreground">
                    {m.projects_by({ name: project.ownerName })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label={`${project.name} — actions`}
                    >
                      <MoreVerticalIcon aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(project);
                        setFormOpen(true);
                      }}
                    >
                      <PencilIcon aria-hidden="true" />
                      {m.projects_edit()}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeletingId(project.id)}
                    >
                      <Trash2Icon aria-hidden="true" />
                      {m.action_delete()}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p dir="auto" className="mt-2 text-sm break-words text-muted-foreground">
                {project.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={STATUS_CLASSES[project.status]}>
                  {projectStatusLabel(project.status)}
                </Badge>
                {project.projectUrl && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLinkIcon className="size-3 rtl:-scale-x-100" aria-hidden="true" />
                    {m.projects_url()}
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <GithubIcon className="size-3" aria-hidden="true" />
                    {m.projects_repo()}
                  </a>
                )}
              </div>

              {project.resources && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-xs font-medium">{m.projects_resources()}</p>
                  <p dir="auto" className="mt-0.5 text-xs break-words text-muted-foreground">
                    {project.resources}
                  </p>
                </div>
              )}

              {project.contact && (
                <p dir="auto" className="mt-2 text-xs break-words text-muted-foreground">
                  {m.projects_contact()}: {project.contact}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.projects_delete_title()}</AlertDialogTitle>
            <AlertDialogDescription>{m.projects_delete_body()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.action_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleteProject.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {m.action_delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
