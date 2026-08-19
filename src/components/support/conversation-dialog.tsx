import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReplySupportConversation, useSetSupportConversationStatus } from "@/hooks/use-support";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { adminScopesQuery, supportConversationQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/**
 * `id` alone drives this dialog rather than the already-fetched list row: the
 * list only carries each conversation's latest message (listConversations
 * caps it at one), so the full thread still needs its own fetch on open.
 */
export function ConversationDialog({
  id,
  onOpenChange,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl">
        {/* Radix unmounts on close, so draft/asOrg state below re-seeds on every open. */}
        {id && <ConversationBody id={id} />}
      </DialogContent>
    </Dialog>
  );
}

function ConversationBody({ id }: { id: string }) {
  const {
    data: conversation,
    isPending,
    isError,
    refetch,
  } = useQuery(supportConversationQuery(id));
  const { data: scopes = [] } = useQuery(adminScopesQuery);
  const reply = useReplySupportConversation();
  const setStatus = useSetSupportConversationStatus();
  const [draft, setDraft] = useState("");
  const [asOrg, setAsOrg] = useState(false);

  if (isPending) {
    return (
      <div className="py-10">
        <StackingLoader />
      </div>
    );
  }
  if (isError || !conversation) return <ErrorState onRetry={() => refetch()} />;

  const serviceName =
    scopes.find((scope) => scope.scope === conversation.serviceCodename)?.name ??
    conversation.serviceCodename;

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    const saved = await reply.mutateAsync({ id: conversation.id, body, asOrg }).catch(() => null);
    if (saved) setDraft("");
  };

  const handleToggleStatus = async () => {
    const next = conversation.status === "OPEN" ? "CLOSED" : "OPEN";
    await setStatus.mutateAsync({ id: conversation.id, status: next }).catch((error) => {
      toast.error(error instanceof ApiError ? error.message : m.error_generic_body());
    });
  };

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle dir="auto">{conversation.reporterName}</DialogTitle>
          <Badge
            variant="outline"
            className={
              conversation.status === "OPEN"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground"
            }
          >
            {conversation.status === "OPEN" ? m.support_status_open() : m.support_status_closed()}
          </Badge>
        </div>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-start">
            <span dir="ltr">{conversation.reporterEmail}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <ServiceLogo codename={conversation.serviceCodename} className="size-3.5" />
              {serviceName}
            </span>
            {conversation.pageContext && (
              <>
                <span aria-hidden="true">·</span>
                <span dir="auto">{conversation.pageContext}</span>
              </>
            )}
          </div>
        </DialogDescription>
      </DialogHeader>

      {/* A chat thread, not a comment list: staff is "me" here (right in LTR, and
          correctly the mirror-image left in RTL via self-end/self-start, which
          — unlike justify-content on a row — already resolves against `dir` on
          a column flex's cross axis) so replies read the way the reporter's own
          widget does, just from the other side of the conversation. */}
      <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto py-1">
        {conversation.messages.map((message) => {
          const isStaff = message.senderType === "STAFF";
          const who = isStaff
            ? ((message.asOrg ? null : message.staff?.displayName) ?? m.support_kstack_team())
            : conversation.reporterName;
          return (
            <li
              key={message.id}
              className={cn(
                "flex max-w-[85%] flex-col gap-0.5",
                isStaff ? "self-end items-end" : "self-start items-start",
              )}
            >
              <div className="flex items-baseline gap-x-2 px-0.5">
                <span dir="auto" className="text-xs font-medium">
                  {who}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTime(message.createdAt)}
                </span>
              </div>
              <div
                dir="auto"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap",
                  isStaff ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.body}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder={m.support_reply_placeholder()}
          aria-label={m.support_reply_placeholder()}
        />
        {reply.error instanceof ApiError && (
          <p role="alert" className="text-sm text-destructive">
            {reply.error.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
            <Checkbox checked={asOrg} onCheckedChange={(value) => setAsOrg(value === true)} />
            {m.support_reply_as_org()}
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={setStatus.isPending}
            >
              {conversation.status === "OPEN" ? m.support_close() : m.support_reopen()}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={reply.isPending || !draft.trim()}
            >
              {reply.isPending && <Loader2Icon className="animate-spin" />}
              {m.support_send()}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
