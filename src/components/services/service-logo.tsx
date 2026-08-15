import { LayersIcon } from "lucide-react";
import { useState } from "react";
import kdevs from "@/assets/services/kdevs.svg";
import kgpa from "@/assets/services/kgpa.svg";
import kgroups from "@/assets/services/kgroups.svg";
import kindex from "@/assets/services/kindex.svg";
import kplanner from "@/assets/services/kplanner.svg";
import ksubjects from "@/assets/services/ksubjects.svg";
import { cn } from "@/lib/utils";

/**
 * The official marks from kstacks.org, keyed by the same codename the API uses.
 * These are the "-dark" variants, drawn for a dark ground — the only theme this
 * dashboard has. Bundled copies are small enough to be inlined by the build, so
 * they cost no request and cannot break.
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
 * A service's brand mark, resolved in three steps:
 *
 *   1. the bundled asset for this codename — no request, never breaks;
 *   2. `logoUrl`, captured from kstacks.org by the catalogue sync, so a service
 *      launched upstream shows its real mark before anyone commits an asset;
 *   3. a generic icon, if there is no mark at all or the remote one fails.
 *
 * Decorative on purpose: every place it appears sits next to the service name,
 * so announcing it again would only add noise. Brand marks are never mirrored in
 * RTL, which an <img> already respects.
 */
export function ServiceLogo({
  codename,
  logoUrl,
  className,
}: {
  codename: string;
  logoUrl?: string | null;
  className?: string;
}) {
  // A remote mark can 404 or be blocked; fall through to the icon if it does.
  const [remoteFailed, setRemoteFailed] = useState(false);

  const bundled = LOGOS[codename];
  const src = bundled ?? (remoteFailed ? undefined : (logoUrl ?? undefined));

  if (!src) {
    return <LayersIcon className={cn("text-muted-foreground", className)} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={cn("object-contain", className)}
      onError={bundled ? undefined : () => setRemoteFailed(true)}
    />
  );
}
