import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="font-semibold">{m.error_generic_title()}</h2>
        <p className="text-sm text-muted-foreground">{m.error_generic_body()}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {m.error_retry()}
        </Button>
      )}
    </div>
  );
}
