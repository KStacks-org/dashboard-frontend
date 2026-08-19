import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoyIcon } from "lucide-react";
import { useState } from "react";
import { StackingLoader } from "@/components/brand/stacking-loader";
import { ServiceLogo } from "@/components/services/service-logo";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConversationDialog } from "@/components/support/conversation-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupportStream } from "@/hooks/use-support";
import { formatDateTime } from "@/lib/format";
import { adminScopesQuery, supportConversationsQuery } from "@/lib/queries";
import type { SupportConversation, SupportConversationStatus } from "@/lib/types";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/support")({
  loader: ({ context }) => context.queryClient.ensureQueryData(supportConversationsQuery("OPEN")),
  component: SupportPage,
});

function SupportPage() {
  // One EventSource for as long as this page is mounted — the inbox is the
  // only place that needs to know about a change the instant it happens.
  useSupportStream();

  const [status, setStatus] = useState<SupportConversationStatus>("OPEN");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data: conversations,
    isPending,
    isError,
    refetch,
  } = useQuery(supportConversationsQuery(status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.support_title()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.support_subtitle()}</p>
      </div>

      <Tabs value={status} onValueChange={(value) => setStatus(value as SupportConversationStatus)}>
        <TabsList>
          <TabsTrigger value="OPEN">{m.support_open()}</TabsTrigger>
          <TabsTrigger value="CLOSED">{m.support_closed()}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending && <StackingLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {conversations && conversations.length === 0 && (
        <EmptyState
          icon={LifeBuoyIcon}
          title={status === "OPEN" ? m.support_empty_open_title() : m.support_empty_closed_title()}
          body={m.support_empty_body()}
        />
      )}

      {conversations && conversations.length > 0 && (
        <ul className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onOpen={() => setSelectedId(conversation.id)}
            />
          ))}
        </ul>
      )}

      <ConversationDialog id={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}

function ConversationRow({
  conversation,
  onOpen,
}: {
  conversation: SupportConversation;
  onOpen: () => void;
}) {
  const { data: scopes = [] } = useQuery(adminScopesQuery);
  const serviceName =
    scopes.find((scope) => scope.scope === conversation.serviceCodename)?.name ??
    conversation.serviceCodename;
  const lastMessage = conversation.messages.at(-1);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/40 sm:p-5"
      >
        <UserAvatar className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span dir="auto" className="font-semibold">
              {conversation.reporterName}
            </span>
            <Badge variant="outline" className="text-muted-foreground">
              <ServiceLogo codename={conversation.serviceCodename} className="size-3.5" />
              {serviceName}
            </Badge>
          </div>
          {conversation.pageContext && (
            <p dir="auto" className="mt-0.5 truncate text-xs text-muted-foreground">
              {conversation.pageContext}
            </p>
          )}
          {lastMessage && (
            <p dir="auto" className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {lastMessage.body}
            </p>
          )}
        </div>
        <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">
          {formatDateTime(conversation.updatedAt)}
        </span>
      </button>
    </li>
  );
}
