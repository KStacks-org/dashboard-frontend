import { Loader2Icon, SendIcon } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddComment, useDeleteComment, useUpdateComment } from "@/hooks/use-tasks";
import { formatDateTime } from "@/lib/format";
import type { TaskComment } from "@/lib/types";
import { m } from "@/paraglide/messages";

export function TaskComments({
  taskId,
  comments,
  currentUserId,
  taskCreatorId,
}: {
  taskId: string;
  comments: TaskComment[];
  currentUserId: string;
  /** Marks whichever comment author also created the task. */
  taskCreatorId: string;
}) {
  const [draft, setDraft] = useState("");
  const addComment = useAddComment();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const created = await addComment.mutateAsync({ taskId, body }).catch(() => null);
    if (created) setDraft("");
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{m.comments_title()}</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{m.comments_empty()}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              canManage={comment.authorId === currentUserId}
              isCreator={comment.authorId === taskCreatorId}
            />
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={draft}
          rows={2}
          maxLength={5000}
          placeholder={m.comments_placeholder()}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={m.comments_placeholder()}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={addComment.isPending || !draft.trim()}>
            {addComment.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SendIcon className="rtl:-scale-x-100" aria-hidden="true" />
            )}
            {m.comments_send()}
          </Button>
        </div>
      </form>
    </section>
  );
}

function CommentRow({
  comment,
  canManage,
  isCreator,
}: {
  comment: TaskComment;
  canManage: boolean;
  isCreator: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const handleSave = async () => {
    const body = draft.trim();
    if (!body) return;
    const saved = await updateComment.mutateAsync({ id: comment.id, body }).catch(() => null);
    if (saved) setEditing(false);
  };

  return (
    <li className="flex gap-2.5">
      <UserAvatar className="mt-0.5 size-7 shrink-0" isCreator={isCreator} />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span dir="auto" className="text-sm font-medium">
            {comment.author.displayName}
          </span>
          <span dir="auto" className="text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              rows={2}
              maxLength={5000}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={m.comments_edit()}
            />
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleSave} disabled={updateComment.isPending}>
                {m.comments_save()}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
              >
                {m.comments_cancel()}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p dir="auto" className="text-sm break-words whitespace-pre-wrap">
              {comment.body}
            </p>
            {canManage && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground"
                  onClick={() => setEditing(true)}
                >
                  {m.comments_edit()}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => deleteComment.mutate(comment.id)}
                  disabled={deleteComment.isPending}
                >
                  {m.comments_delete()}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}
