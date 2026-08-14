import { cn } from "@/lib/utils";

/**
 * The KStack layered-diamond mark, dark-background variant.
 *
 * Per the official brand deck (03-logo-construction), the three facets are not
 * decorative: bottom = the infrastructure (brand green), middle = the reflection
 * between a student and a service (white), top = the student/service that sees
 * the light (light reflected green). Do not recolor them arbitrarily.
 */
export function KStackMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={cn("size-8", className)} role="img" aria-label="KStack">
      <title>KStack</title>
      <polygon points="32,26 60,40 32,54 4,40" fill="#15BB81" />
      <polygon points="32,18 60,32 32,46 4,32" fill="#FFFFFF" />
      <polygon points="32,10 60,24 32,38 4,24" fill="#8ADDC0" />
    </svg>
  );
}

/** Full lockup: mark + wordmark. The K is always brand green, "Stack" takes the ambient foreground. */
export function KStackLogo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} dir="ltr">
      <KStackMark className={markClassName} />
      <span className={cn("text-xl font-bold tracking-tight", wordmarkClassName)}>
        <span className="text-primary">K</span>
        <span className="text-foreground">Stack</span>
      </span>
    </span>
  );
}
