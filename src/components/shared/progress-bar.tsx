/** Progress bar with an accessible value, so it never reads as colour alone. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={`mt-2 h-2 w-full overflow-hidden rounded-full bg-muted ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
