import { useState } from 'react'
import useForum from '../../context/useForum'
import Avatar from '../paper/Avatar'
import LinkifiedText from './LinkifiedText'
import PostMenu from './PostMenu'
import RoleBadge from './RoleBadge'
import ConfirmModal from '../ui/ConfirmModal'
import { CommentIcon, FlagIcon, PencilIcon, TrashIcon } from '../dashboard/icons'
import { timeAgo } from '../../utils/formatDate'

function CommentInput({ placeholder, label, onSubmit, onCancel, autoFocus = false, initial = '', submitLabel }) {
  const [draft, setDraft] = useState(initial)

  const submit = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSubmit(text)
    setDraft('')
  }

  return (
    <form
      onSubmit={submit}
      className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 pl-4 pr-1.5 transition focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20"
    >
      <CommentIcon className="size-5 shrink-0 text-white/70" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={500}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/60"
      />
      {(submitLabel || onCancel) && (
        <span className="flex shrink-0 gap-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
          )}
          {submitLabel && (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition enabled:hover:brightness-105 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          )}
        </span>
      )}
    </form>
  )
}

function CommentItem({ postId, comment, canReply, onReply }) {
  const { me, editComment, deleteComment, reportComment } = useForum()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const mine = comment.authorName === me

  const items = mine
    ? [
        { label: 'Edit', icon: PencilIcon, onSelect: () => setEditing(true) },
        { label: 'Delete', icon: TrashIcon, danger: true, onSelect: () => setConfirming(true) },
      ]
    : [
        {
          label: comment.reported ? 'Reported' : 'Report',
          icon: FlagIcon,
          disabled: comment.reported,
          onSelect: () => reportComment(postId, comment.id),
        },
      ]

  return (
    <div className="flex gap-3">
      <Avatar name={comment.authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-xs font-semibold">{comment.authorName}</span>
            <RoleBadge role={comment.authorRole} />
            <span className="text-[0.6875rem] text-white/40">
              {timeAgo(comment.createdAt)}
              {comment.editedAt ? ' · edited' : ''}
            </span>
          </div>
          <PostMenu items={items} label="Comment actions" />
        </div>

        {editing ? (
          <div className="mt-1.5">
            <CommentInput
              initial={comment.text}
              label="Edit comment"
              placeholder="Edit comment"
              submitLabel="Save"
              autoFocus
              onCancel={() => setEditing(false)}
              onSubmit={(text) => {
                editComment(postId, comment.id, text)
                setEditing(false)
              }}
            />
          </div>
        ) : (
          <p className="mt-0.5 wrap-break-word whitespace-pre-line text-sm leading-snug text-white/90">
            <LinkifiedText text={comment.text} />
          </p>
        )}

        {canReply && !editing && (
          <button
            type="button"
            onClick={onReply}
            className="mt-1 text-xs font-semibold text-gold/80 transition hover:text-gold"
          >
            Reply
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmModal
          title="Delete comment"
          message={
            comment.parentId
              ? 'This comment will be removed. This cannot be undone.'
              : 'This comment and its replies will be removed. This cannot be undone.'
          }
          confirmLabel="Delete"
          danger
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            deleteComment(postId, comment.id)
          }}
        />
      )}
    </div>
  )
}

export default function CommentThread({ post, autoFocusComposer = false }) {
  const { addComment } = useForum()
  const [reply, setReply] = useState(null)
  const replyTo = reply?.parentId ?? null
  const prefill = reply?.prefill ?? ''
  const setReplyTo = (id) => setReply(id ? { parentId: id, prefill: '' } : null)
  const top = post.comments.filter((c) => !c.parentId)

  return (
    <div className="space-y-4">
      {top.length > 0 && (
        <ul className="space-y-4">
          {top.map((c) => {
            const replies = post.comments.filter((r) => r.parentId === c.id)
            return (
              <li key={c.id}>
                <CommentItem
                  postId={post.id}
                  comment={c}
                  canReply
                  onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
                />
                {(replies.length > 0 || replyTo === c.id) && (
                  <div className="ml-4 mt-3 space-y-3 border-l border-white/10 pl-4 sm:ml-11">
                    {replies.map((r) => (
                      <CommentItem
                        key={r.id}
                        postId={post.id}
                        comment={r}
                        canReply
                        onReply={() => setReply({ parentId: c.id, prefill: `@${r.authorName} ` })}
                      />
                    ))}
                    {replyTo === c.id && (
                      <CommentInput
                        key={prefill}
                        initial={prefill}
                        autoFocus
                        label={`Reply to ${c.authorName}`}
                        placeholder="Write a reply…"
                        submitLabel="Reply"
                        onCancel={() => setReplyTo(null)}
                        onSubmit={(text) => {
                          addComment(post.id, text, c.id)
                          setReplyTo(null)
                        }}
                      />
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <CommentInput
        autoFocus={autoFocusComposer}
        label="Write a comment"
        placeholder="Write a comment…"
        onSubmit={(text) => addComment(post.id, text)}
      />
    </div>
  )
}