import { Link } from "@tanstack/react-router";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { useId, useState } from "react";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import type { CurrentUser } from "@/lib/types";
import { m } from "@/paraglide/messages";

const navLinkClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary";

const NAV_LINKS = [
  { to: "/overview", label: () => m.nav_overview() },
  { to: "/tasks", label: () => m.nav_tasks() },
  { to: "/issues", label: () => m.nav_issues() },
  { to: "/milestones", label: () => m.nav_milestones() },
  { to: "/team", label: () => m.nav_team() },
  { to: "/services", label: () => m.nav_services() },
  { to: "/health", label: () => m.nav_health() },
  { to: "/github", label: () => m.nav_github() },
  { to: "/projects", label: () => m.nav_projects() },
  { to: "/archive", label: () => m.nav_archive() },
] as const;

export function AppHeader({ user }: { user: CurrentUser }) {
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavId = useId();

  const initials = user.displayName.trim().slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/overview" className="shrink-0" aria-label={m.app_title()}>
            <KStackLogo />
          </Link>
          <nav className="hidden flex-wrap items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass}>
                {link.label()}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <NotificationBell />
            <LanguageToggle />
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span dir="auto" className="max-w-[10rem] truncate text-sm font-medium">
              {user.displayName}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-label={m.nav_logout()}
            >
              <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
            </Button>
          </div>

          <span className="lg:hidden">
            <NotificationBell />
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls={mobileNavId}
            aria-label="Toggle menu"
          >
            <MenuIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div id={mobileNavId} className="border-t border-border px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                {link.label()}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span dir="auto" className="truncate text-sm font-medium">
              {user.displayName}
            </span>
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
                {m.nav_logout()}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
