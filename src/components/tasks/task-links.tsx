import { ExternalLinkIcon, LinkIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddLink, useDeleteLink } from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api";
import type { TaskLink } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function TaskLinks({ taskId, links }: { taskId: string; links: TaskLink[] }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const addLink = useAddLink();
  const deleteLink = useDeleteLink();

  const errorMessage =
    addLink.error instanceof ApiError
      ? m.links_invalid()
      : addLink.error
        ? m.error_generic_body()
        : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const created = await addLink
      .mutateAsync({ taskId, url: trimmed, label: label.trim() || null })
      .catch(() => null);
    if (created) {
      setUrl("");
      setLabel("");
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{m.links_title()}</h3>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{m.links_empty()}</p>
      ) : (
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.id} className="group flex items-center gap-2">
              <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a
                href={link.url}
                target="_blank"
                // noreferrer also blocks the opened page from reaching window.opener.
                rel="noopener noreferrer"
                dir="auto"
                className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
                title={link.url}
              >
                {link.label || link.url}
              </a>
              <ExternalLinkIcon
                className="size-3 shrink-0 text-muted-foreground rtl:-scale-x-100"
                aria-hidden="true"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => deleteLink.mutate(link.id)}
                aria-label={`${m.links_remove()}: ${link.label || link.url}`}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            type="url"
            dir="ltr"
            maxLength={2000}
            placeholder={m.links_url_placeholder()}
            onChange={(e) => setUrl(e.target.value)}
            aria-label={m.links_url_placeholder()}
            aria-invalid={Boolean(errorMessage) || undefined}
          />
          <Input
            value={label}
            maxLength={120}
            className="sm:max-w-[12rem]"
            placeholder={m.links_label_placeholder()}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={m.links_label_placeholder()}
          />
          <Button type="submit" variant="secondary" disabled={addLink.isPending || !url.trim()}>
            {addLink.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <LinkIcon aria-hidden="true" />
            )}
            <span className="sr-only sm:not-sr-only">{m.links_add()}</span>
          </Button>
        </div>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
      </form>
    </section>
  );
}
