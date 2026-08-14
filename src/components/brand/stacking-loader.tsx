import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/**
 * The ecosystem's loading state. kstacks.org's own loading copy literally reads
 * "Stacking..." — keep the on-brand microcopy rather than a bare spinner.
 */
export function StackingLoader({ className, label }: { className?: string; label?: string }) {
  return (
    <output
      className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}
      aria-live="polite"
    >
      <div className="relative flex h-10 w-16 items-end justify-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 h-3 w-10 -translate-x-1/2 rounded-[2px] bg-primary/70"
            style={{
              transform: `translateX(-50%) rotate(45deg) skewX(-15deg)`,
              bottom: `${i * 8}px`,
              opacity: 1 - i * 0.25,
              animation: `kstack-pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{label ?? m.loading()}</p>
    </output>
  );
}
