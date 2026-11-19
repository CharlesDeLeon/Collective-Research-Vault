import { useState } from 'react'
import { Link } from 'react-router-dom'
import useForum from '../../context/useForum'
import { glass, ROUTES } from '../dashboard/constants'
import StatusPill from '../dashboard/StatusPill'
import { normalizeStatus } from '../../utils/paperRules'
import { CommentIcon, ExternalLinkIcon, FlagIcon, HeartIcon, PencilIcon, TrashIcon } from '../dashboard/icons'
import Avatar from '../paper/Avatar'
import LinkifiedText from './LinkifiedText'
import VideoEmbed from './VideoEmbed'
import PostMenu from './PostMenu'
import RoleBadge from './RoleBadge'
import CommentThread from './CommentThread'
import ConfirmModal from '../ui/ConfirmModal'
import { findVideoLink } from '../../utils/videoLinks'
import { timeAgo } from '../../utils/formatDate'

const TYPE_LABEL = { update: 'Update', video: 'Video', paper: 'Paper' }

export default function ForumPostCard({ post, showGroup = true }) {
  const { me, myGroup, editPost, deletePost, toggleLike, reportPost, loadPost } = useForum()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.text)
  const [confirming, setConfirming] = useState(false)

  const mine = post.authorName === me
  const link = findVideoLink(post.mediaUrl) ?? findVideoLink(post.text)
  const externalMedia = post.mediaUrl && !findVideoLink(post.mediaUrl)
  const own = post.paperId != null && post.groupId === myGroup.id

  const items = mine
    ? [
        { label: 'Edit', icon: PencilIcon, onSelect: () => { setDraft(post.text); setEditing(true) } },
        { label: 'Delete', icon: TrashIcon, danger: true, onSelect: () => setConfirming(true) },
      ]
    : [
        {
          label: post.reported ? 'Reported' : 'Report',
          icon: FlagIcon,
          disabled: post.reported,
          onSelect: () => reportPost(post.id),
        },
      ]

  const save = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    editPost(post.id, text)
    setEditing(false)
  }

  return (
    <article className={`${glass} p-4 font-display sm:p-6`}>
      <div className="flex items-start gap-3">
        <Avatar name={post.authorName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold">{post.authorName}</span>
            <RoleBadge role={post.authorRole} />
          </div>
          <p className="mt-0.5 text-xs text-white/45">
            {timeAgo(post.createdAt)}
            {post.editedAt ? ' · edited' : ''}
            {showGroup && ` · ${post.groupName}`}
          </p>
        </div>
        <PostMenu items={items} label="Post actions" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white/60">
          {TYPE_LABEL[post.type]}
        </span>
        {post.status && <StatusPill status={normalizeStatus(post.status)} />}
        <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-gold">
          {post.strand}
        </span>
        <span className="text-[0.6875rem] text-white/40">
          {post.section} · {post.schoolYear}
        </span>
      </div>

      {post.type === 'paper' && post.paperTitle && (
        <h3 className="mt-3 wrap-break-word text-base font-bold leading-snug">
          {own ? (
            <Link to={ROUTES.paper(post.paperId)} className="transition hover:text-gold">
              {post.paperTitle}
            </Link>
          ) : (
            post.paperTitle
          )}
        </h3>
      )}

      {editing ? (
        <form onSubmit={save} className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            aria-label="Edit post"
            className="h-28 w-full resize-none rounded-lg border border-field-line bg-field p-3 text-sm text-white outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition enabled:hover:brightness-105 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 wrap-break-word whitespace-pre-line text-sm font-medium leading-relaxed">
          <LinkifiedText text={post.text} />
        </p>
      )}

      {link && (
        <div className="mt-3">
          <VideoEmbed link={link} />
        </div>
      )}

      {externalMedia && (
        <a
          href={post.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-gold transition hover:border-gold/60"
        >
          <ExternalLinkIcon className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{post.mediaUrl}</span>
        </a>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => toggleLike(post.id)}
          aria-pressed={post.liked}
          aria-label={post.liked ? 'Unlike' : 'Like'}
          className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition ${
            post.liked
              ? 'border-gold bg-gold/15 text-gold'
              : 'border-white/25 bg-white/5 text-white/80 hover:bg-white/10'
          }`}
        >
          <HeartIcon className={`size-4 ${post.liked ? 'fill-current' : ''}`} />
          {post.likes}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!open && (post.comments?.length ?? 0) === 0) loadPost?.(post.id)
            setOpen((v) => !v)
          }}
          aria-expanded={open}
          aria-label="Comments"
          className="flex h-10 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 text-sm text-white/80 transition hover:bg-white/10"
        >
          <CommentIcon className="size-4" />
          {post.comments.length}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          <CommentThread post={post} autoFocusComposer />
        </div>
      )}

      {confirming && (
        <ConfirmModal
          title="Delete post"
          message="This post and all of its comments will be removed. This cannot be undone."
          confirmLabel="Delete"
          danger
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            deletePost(post.id)
          }}
        />
      )}
    </article>
  )
}