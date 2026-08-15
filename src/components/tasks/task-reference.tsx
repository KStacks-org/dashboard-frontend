import { cn } from "@/lib/utils";

/**
 * Short task handle, e.g. "KS-42". Always rendered LTR so it stays readable in
 * the Arabic UI, and it's what people quote in chat instead of a long title.
 */
export function TaskReference({ reference, className }: { reference: number; className?: string }) {
  return (
    <span
      dir="ltr"
      className={cn(
        "shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      KS-{reference}
    </span>
  );
}
