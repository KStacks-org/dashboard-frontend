import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { KStackLogo } from "@/components/brand/kstack-logo";
import { AppNav } from "@/components/layout/app-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { CurrentUser } from "@/lib/types";
import { m } from "@/paraglide/messages";

/**
 * Only exists below `lg`, where the sidebar is hidden: it carries the brand,
 * the bell, and the button that slides the very same nav in as a drawer.
 */
export function AppHeader({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/overview" className="shrink-0" aria-label={m.app_title()}>
          <KStackLogo />
        </Link>

        <div className="flex items-center gap-1">
          <NotificationBell />

          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={m.nav_menu()}
              onClick={() => setOpen(true)}
            >
              <MenuIcon aria-hidden="true" />
            </Button>

            <SheetContent side="start" className="w-72 gap-0 p-0">
              <SheetTitle className="sr-only">{m.nav_menu()}</SheetTitle>
              <SheetDescription className="sr-only">{m.nav_sections()}</SheetDescription>
              <AppNav user={user} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
