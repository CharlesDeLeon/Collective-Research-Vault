import { useEffect, useState } from 'react'
import ModalShell from '../ui/ModalShell'
import { DocIcon, ExternalLinkIcon } from '../dashboard/icons'
import RoleBadge from '../forum/RoleBadge'
import PostSummary from './PostSummary'
import { getAdminPost } from '../../services/adminService'
import { badgeRole } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const btn =
  'h-11 rounded-xl border text-sm font-semibold transition'

export default function PostDetailModal({ post, onAction, onClose }) {
  const [full, setFull] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    getAdminPost(post.id)
      .then((data) => live && setFull(data))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [post.id])

  const current = full ?? post
  const comments = full?.comments ?? []
  const meta = [current.strand, current.section, current.yearLevel && `Grade ${current.yearLevel}`, current.schoolYear].filter(Boolean)

  const act = (kind) => {
    onClose()
    onAction(current, kind)
  }

  return (
    <ModalShell title="Post" icon={DocIcon} onClose={onClose}>
      <div className="mt-4 space-y-5 px-1 pb-1">
        <PostSummary post={current} lines={12} />

        {meta.length > 0 && <p className="text-xs text-white/55">{meta.join(' · ')}</p>}

        {current.mediaUrl && (
          <a
            href={current.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-gold transition hover:border-gold/60"
          >
            <ExternalLinkIcon className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{current.mediaUrl}</span>
          </a>
        )}

        <p className="text-xs text-white/55">
          {current.likes ?? 0} {current.likes === 1 ? 'like' : 'likes'} · {full ? comments.length : (current.commentCount ?? 0)}{' '}
          {(full ? comments.length : current.commentCount) === 1 ? 'comment' : 'comments'}
        </p>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">Comments</h3>
          {failed ? (
            <p className="text-sm text-danger-ink">Could not load the comments.</p>
          ) : !full ? (
            <div className="h-12 animate-pulse rounded-xl bg-white/5" aria-busy="true" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-white/55">No comments.</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold">{c.authorName}</span>
                    <RoleBadge role={badgeRole(c.authorRole)} />
                    <span className="text-white/45">{timeAgo(c.createdAt)}</span>
                    {c.reported && <span className="text-warn-ink">Reported</span>}
                  </div>
                  <p className="mt-1 wrap-break-word whitespace-pre-line text-sm text-white/80">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
          {!backendSupport.adminCommentModeration && <p className="mt-2 text-xs text-white/45">{unsupportedNote.adminCommentModeration}</p>}
        </section>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => act(current.hidden ? 'show' : 'hide')}
            className={`${btn} border-white/20 text-white/85 hover:bg-white/10`}
          >
            {current.hidden ? 'Make visible' : 'Hide post'}
          </button>
          <button
            type="button"
            onClick={() => act('remove')}
            className={`${btn} border-danger bg-danger/20 text-danger-ink hover:bg-danger/30`}
          >
            Remove post
          </button>
        </div>
        <p className="text-center text-xs text-white/45">Admins moderate content only. Publishing and access approval stay with the group adviser.</p>
      </div>
    </ModalShell>
  )
}