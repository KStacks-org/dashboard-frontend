import { Link } from "@tanstack/react-router";
import {
  ActivityIcon,
  ArchiveIcon,
  BugIcon,
  FlagIcon,
  GitBranchIcon,
  HandshakeIcon,
  LayersIcon,
  LayoutGridIcon,
  LifeBuoyIcon,
  LogOutIcon,
  SquareCheckBigIcon,
  UsersIcon,
} from "lucide-react";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import type { CurrentUser } from "@/lib/types";
import { m } from "@/paraglide/messages";

/**
 * The sections, grouped the way the team thinks about them rather than as one
 * flat list. Overview sits above the groups because it is the way in, not a
 * category of its own.
 */
const OVERVIEW = { to: "/overview", icon: LayoutGridIcon, label: () => m.nav_overview() } as const;

const NAV_GROUPS = [
  {
    label: () => m.nav_group_work(),
    links: [
      { to: "/tasks", icon: SquareCheckBigIcon, label: () => m.nav_tasks() },
      { to: "/milestones", icon: FlagIcon, label: () => m.nav_milestones() },
      { to: "/issues", icon: BugIcon, label: () => m.nav_issues() },
      { to: "/support", icon: LifeBuoyIcon, label: () => m.nav_support() },
    ],
  },
  {
    label: () => m.nav_group_team(),
    links: [
      { to: "/team", icon: UsersIcon, label: () => m.nav_team() },
      { to: "/github", icon: GitBranchIcon, label: () => m.nav_github() },
    ],
  },
  {
    label: () => m.nav_group_services(),
    links: [
      { to: "/services", icon: LayersIcon, label: () => m.nav_services() },
      { to: "/health", icon: ActivityIcon, label: () => m.nav_health() },
    ],
  },
  {
    label: () => m.nav_group_records(),
    links: [
      { to: "/projects", icon: HandshakeIcon, label: () => m.nav_projects() },
      { to: "/archive", icon: ArchiveIcon, label: () => m.nav_archive() },
    ],
  },
] as const;

const itemClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[status=active]:bg-primary/12 data-[status=active]:text-primary";

/**
 * The nav body, shared verbatim by the desktop rail and the mobile drawer so
 * the two can never drift apart. `onNavigate` lets the drawer close itself.
 */
export function AppNav({ user, onNavigate }: { user: CurrentUser; onNavigate?: () => void }) {
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <UserAvatar className="size-9" isSuperAdmin={user.role === "SUPER_ADMIN"} />
        <div className="min-w-0 flex-1">
          <p dir="auto" className="truncate text-sm font-semibold">
            {user.displayName}
          </p>
          <p dir="auto" className="truncate text-xs text-muted-foreground">
            {user.jobTitle ??
              (user.role === "SUPER_ADMIN" ? m.team_role_super_admin() : m.team_role_member())}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <Link to={OVERVIEW.to} className={itemClass} onClick={onNavigate}>
          <OVERVIEW.icon className="size-4 shrink-0" aria-hidden="true" />
          {OVERVIEW.label()}
        </Link>

        {NAV_GROUPS.map((group) => (
          <div key={group.label()} className="mt-3 border-t border-border pt-3">
            <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground/70">
              {group.label()}
            </p>
            <ul className="space-y-0.5">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={itemClass} onClick={onNavigate}>
                    <link.icon className="size-4 shrink-0" aria-hidden="true" />
                    {link.label()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <LanguageToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-muted-foreground"
        >
          <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
          {m.nav_logout()}
        </Button>
      </div>
    </div>
  );
}

/** The permanent rail, from `lg` up. Below that the same nav becomes a drawer. */
export function AppSidebar({ user }: { user: CurrentUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-border bg-card/40 lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link to="/overview" aria-label={m.app_title()}>
          <KStackLogo />
        </Link>
        <NotificationBell />
      </div>
      <div className="min-h-0 flex-1">
        <AppNav user={user} />
      </div>
    </aside>
  );
}
