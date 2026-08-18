import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  GitPullRequestIcon,
  Loader2Icon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { githubActivityQuery } from "@/lib/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/github")({
  loader: ({ context }) => context.queryClient.ensureQueryData(githubActivityQuery),
  component: GitHubPage,
});

function GitHubPage() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(githubActivityQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.github_title()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{m.github_subtitle()}</p>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <span dir="auto" className="hidden text-xs text-muted-foreground sm:inline">
              {m.github_updated({ time: formatDateTime(data.fetchedAt) })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ["githubActivity"] });
              await refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <RefreshCwIcon aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{m.github_refresh()}</span>
          </Button>
        </div>
      </div>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data?.rateLimited && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-500"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {m.github_rate_limited()}
        </p>
      )}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={GitCommitHorizontalIcon} title={m.github_commits()}>
            {data.commits.length === 0 ? (
              <Empty />
            ) : (
              <ul className="divide-y divide-border/60">
                {data.commits.map((commit) => (
                  <li key={`${commit.repo}-${commit.sha}`}>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <Avatar url={commit.avatarUrl} name={commit.author} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" dir="auto">
                          {commit.message}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span dir="ltr">{commit.author}</span>
                          <span dir="ltr" className="font-mono">
                            {commit.repo}
                          </span>
                          <span dir="auto">{formatDateTime(commit.committedAt)}</span>
                        </p>
                      </div>
                      <span
                        dir="ltr"
                        className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                      >
                        {commit.sha}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel icon={GitPullRequestIcon} title={m.github_pull_requests()}>
            {data.pullRequests.length === 0 ? (
              <Empty />
            ) : (
              <ul className="divide-y divide-border/60">
                {data.pullRequests.map((pr) => (
                  <li key={pr.url}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <Avatar url={pr.avatarUrl} name={pr.author} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" dir="auto">
                          {pr.title}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span dir="ltr">#{pr.number}</span>
                          <span dir="ltr">{pr.author}</span>
                          <span dir="ltr" className="font-mono">
                            {pr.repo}
                          </span>
                        </p>
                      </div>
                      {pr.isDraft && (
                        <Badge variant="outline" className="shrink-0 text-muted-foreground">
                          {m.github_draft()}
                        </Badge>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel icon={CircleDotIcon} title={m.github_issues()}>
            {data.issues.length === 0 ? (
              <Empty />
            ) : (
              <ul className="divide-y divide-border/60">
                {data.issues.map((issue) => (
                  <li key={issue.url}>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <Avatar url={issue.avatarUrl} name={issue.author} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" dir="auto">
                          {issue.title}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span dir="ltr">#{issue.number}</span>
                          <span dir="ltr" className="font-mono">
                            {issue.repo}
                          </span>
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel icon={GitBranchIcon} title={m.github_branches()}>
            {data.branches.length === 0 ? (
              <Empty />
            ) : (
              <ul className="flex min-w-0 flex-wrap gap-1.5 pt-1">
                {data.branches.map((branch) => (
                  <li key={`${branch.repo}-${branch.name}`}>
                    <a
                      href={branch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      // Branch names like "copilot/fix-failing-github-actions-job"
                      // contain no spaces, so they must be allowed to break.
                      className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs break-all transition-colors ${
                        branch.isDefault
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="text-muted-foreground/70">{branch.repo}</span>/{branch.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel icon={ExternalLinkIcon} title={m.github_repositories()} className="lg:col-span-2">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.repositories.map((repo) => (
                <li key={repo.name}>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span dir="ltr" className="truncate font-mono text-sm font-medium">
                        {repo.name}
                      </span>
                      {repo.language && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span dir="ltr" className="font-mono">
                        {repo.defaultBranch}
                      </span>
                      {repo.openIssues > 0 && (
                        <span>{m.github_open_issues({ count: repo.openIssues })}</span>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof GitBranchIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5 ${className ?? ""}`}
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="py-4 text-sm text-muted-foreground">{m.github_empty()}</p>;
}

/** GitHub avatars are remote images; fall back to a generic mark if one fails. */
function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    <img src={url} alt="" loading="lazy" className="mt-0.5 size-6 shrink-0 rounded-lg bg-muted" />
  ) : (
    <span
      role="img"
      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
      aria-label={name}
    >
      <UserIcon className="size-[55%]" aria-hidden="true" />
    </span>
  );
}
