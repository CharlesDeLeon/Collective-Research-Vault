import { useEffect, useState } from 'react'
import ModalShell from '../ui/ModalShell'
import { DocIcon, ExternalLinkIcon } from '../dashboard/icons'
import RoleBadge from '../forum/RoleBadge'
import PostSummary from './PostSummary'
import useToast from '../../context/useToast'
import useAuth from '../../context/useAuth'
import { getAdminPost, hideAdminComment, removeAdminComment, apiMessage } from '../../services/adminService'
import { badgeRole, canonicalRole } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const btn = 'h-11 rounded-xl border text-sm font-semibold transition'
const tinyBtn = 'rounded-lg border px-2.5 py-1 text-xs font-semibold transition'

export default function PostDetailModal({ post, onAction, onClose }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [full, setFull] = useState(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyComment, setBusyComment] = useState(null)

  useEffect(() => {
    let live = true
    setFailed(false)
    getAdminPost(post.id)
      .then((data) => live && setFull(data))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [post.id, reloadKey])

  const current = full ?? post
  const comments = full?.comments ?? []
  const meta = [current.strand, current.section, current.yearLevel && `Grade ${current.yearLevel}`, current.schoolYear].filter(Boolean)

  const act = (kind) => {
    onClose()
    onAction(current, kind)
  }

  const moderateComment = async (comment, kind) => {
    setBusyComment(comment.id)
    try {
      if (kind === 'remove') await removeAdminComment(comment.id)
      else await hideAdminComment(comment.id, !comment.hidden)
      toast(kind === 'remove' ? 'Comment removed.' : comment.hidden ? 'Comment is visible again.' : 'Comment hidden.')
      setReloadKey((k) => k + 1)
    } catch (e) {
      toast(apiMessage(e, 'Could not update this comment.'), 'error')
    } finally {
      setBusyComment(null)
    }
  }

  const reason = current.reason ?? current.reasonText
  const reporter = current.reporterName ?? current.reporter_name ?? current.reporter
  const reporterEmail = current.reporterEmail ?? current.reporter_email
  const roleNote =
    canonicalRole(user?.role) === 'adviser'
      ? 'Advisers decide what stays in their own groups. Publishing and access approval remain adviser actions.'
      : 'Admins moderate content only. Publishing and access approval stay with the group adviser.'

  return (
    <ModalShell title="Post" icon={DocIcon} onClose={onClose}>
      <div className="mt-4 space-y-5 px-1 pb-1">
        <PostSummary post={current} lines={12} />

        {meta.length > 0 && <p className="truncate text-xs text-white/55">{meta.join(' · ')}</p>}

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

        {current.reported && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">Report</h3>
            {backendSupport.adminModerationReason ? (
              <div className="space-y-1 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-white/80">
                <p className="truncate"><span className="text-white/55">Reason:</span> {reason || '—'}</p>
                <p className="truncate"><span className="text-white/55">Reporter:</span> {reporter || '—'}</p>
                {reporterEmail && <p className="truncate"><span className="text-white/55">Email:</span> {reporterEmail}</p>}
              </div>
            ) : (
              <p className="text-xs text-white/45">{unsupportedNote.adminModerationReason}</p>
            )}
          </section>
        )}

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
                    <span className="truncate font-semibold">{c.authorName}</span>
                    <RoleBadge role={badgeRole(c.authorRole)} />
                    <span className="text-white/45">{timeAgo(c.createdAt)}</span>
                    {c.reported && <span className="text-warn-ink">Reported</span>}
                    {c.hidden && <span className="text-white/50">Hidden</span>}
                  </div>
                  <p className="mt-1 wrap-break-word whitespace-pre-line text-sm text-white/80">{c.text}</p>
                  {backendSupport.adminCommentModeration && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyComment === c.id}
                        onClick={() => moderateComment(c, 'hide')}
                        className={`${tinyBtn} border-white/20 text-white/75 enabled:hover:bg-white/10 disabled:opacity-50`}
                      >
                        {c.hidden ? 'Make visible' : 'Hide'}
                      </button>
                      <button
                        type="button"
                        disabled={busyComment === c.id}
                        onClick={() => moderateComment(c, 'remove')}
                        className={`${tinyBtn} border-danger/50 text-danger-ink enabled:hover:bg-danger/15 disabled:opacity-50`}
                      >
                        {busyComment === c.id ? 'Working…' : 'Remove'}
                      </button>
                    </div>
                  )}
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
          {backendSupport.adminRestoreRemoved && current.removed && (
            <button
              type="button"
              onClick={() => act('restore')}
              className={`${btn} border-success/40 bg-success/10 text-success-ink hover:bg-success/20`}
            >
              Restore post
            </button>
          )}
          {backendSupport.adminDismissReport && current.reported && (
            <button
              type="button"
              onClick={() => act('dismiss')}
              className={`${btn} border-white/20 text-white/85 hover:bg-white/10`}
            >
              Dismiss report
            </button>
          )}
        </div>
        {!backendSupport.adminRestoreRemoved && <p className="text-center text-xs text-white/45">{unsupportedNote.adminRestoreRemoved}</p>}
        {!backendSupport.adminDismissReport && current.reported && <p className="text-center text-xs text-white/45">{unsupportedNote.adminDismissReport}</p>}
        <p className="text-center text-xs text-white/45">{roleNote}</p>
      </div>
    </ModalShell>
  )
}
