import { PenLineIcon, ShieldIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * The shared stand-in for a person, everywhere one is shown: a sharp-cornered
 * chip carrying a generic person mark rather than initials in a circle — this
 * app has no real photos, so a soft "profile bubble" only pretended to be one
 * without matching the rest of the identity's angular corners.
 *
 * The two badges are independent and can both be on at once (e.g. a super
 * admin who also created the task) — they sit on opposite corners so neither
 * one displaces the other.
 */
export function UserAvatar({
  isSuperAdmin,
  isCreator,
  className,
}: {
  /** Same shield mark used for admin badges elsewhere in the app. */
  isSuperAdmin?: boolean;
  /** Marks whoever created the task this avatar is shown in the context of. */
  isCreator?: boolean;
  className?: string;
}) {
  return (
    <Avatar className={cn("rounded-lg", className)}>
      <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
        <UserIcon className="size-[55%]" aria-hidden="true" />
      </AvatarFallback>
      {isSuperAdmin && (
        <AvatarBadge className="bg-amber-500 text-amber-950" title="Super admin">
          <ShieldIcon aria-hidden="true" />
        </AvatarBadge>
      )}
      {isCreator && (
        <AvatarBadge
          position="start"
          className="bg-primary text-primary-foreground"
          title="Task creator"
        >
          <PenLineIcon aria-hidden="true" />
        </AvatarBadge>
      )}
    </Avatar>
  );
}
