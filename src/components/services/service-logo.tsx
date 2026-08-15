import { LayersIcon } from "lucide-react";
import kdevs from "@/assets/services/kdevs.svg";
import kgpa from "@/assets/services/kgpa.svg";
import kgroups from "@/assets/services/kgroups.svg";
import kindex from "@/assets/services/kindex.svg";
import kplanner from "@/assets/services/kplanner.svg";
import ksubjects from "@/assets/services/ksubjects.svg";
import { cn } from "@/lib/utils";

/**
 * The official marks from kstacks.org, keyed by the same codename the API
 * uses. These are the "-dark" variants, drawn for a dark ground — the only
 * theme this dashboard has.
 */
const LOGOS: Record<string, string> = {
  kindex,
  kplanner,
  kgroups,
  kgpa,
  kdevs,
  ksubjects,
};

/**
 * A service's brand mark. Decorative on purpose: every place it appears sits
 * next to the service name, so announcing it again would only add noise. A
 * service the team adds later has no mark yet and falls back to the generic
 * icon rather than a broken image.
 *
 * Brand marks are never mirrored in RTL, which an <img> already respects.
 */
export function ServiceLogo({ codename, className }: { codename: string; className?: string }) {
  const src = LOGOS[codename];

  if (!src) {
    return <LayersIcon className={cn("text-muted-foreground", className)} aria-hidden="true" />;
  }

  return <img src={src} alt="" aria-hidden="true" className={cn("object-contain", className)} />;
}
