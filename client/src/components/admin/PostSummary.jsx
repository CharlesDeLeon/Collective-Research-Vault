import Avatar from '../paper/Avatar'
import RoleBadge from '../forum/RoleBadge'
import StatusPill from '../dashboard/StatusPill'
import { normalizeStatus } from '../../utils/paperRules'
import { badgeRole } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'

const TYPE_LABEL = { update: 'Update', video: 'Video', paper: 'Paper' }

export function PostFlags({ post }) {
  return (
    <>
      {post.reported && (
        <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-warn-ink">
          Reported
        </span>
      )}
      {post.hidden && (
        <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white/70">
          Hidden
        </span>
      )}
      {post.removed && (
        <span className="rounded-full border border-danger/40 bg-danger/10 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-danger-ink">
          Removed
        </span>
      )}
    </>
  )
}

export default function PostSummary({ post, lines = 3 }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={post.authorName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold">{post.authorName}</span>
          <RoleBadge role={badgeRole(post.authorRole)} />
        </div>
        <p className="mt-0.5 text-xs text-white/50">
          {timeAgo(post.createdAt)}
          {post.groupName ? ` · ${post.groupName}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white/60">
            {TYPE_LABEL[post.type] ?? 'Post'}
          </span>
          {post.status && <StatusPill status={normalizeStatus(post.status)} />}
          <PostFlags post={post} />
        </div>
        {post.type === 'paper' && post.paperTitle && <p className="mt-2 wrap-break-word text-sm font-bold">{post.paperTitle}</p>}
        <p
          className="mt-2 wrap-break-word whitespace-pre-line text-sm text-white/80"
          style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }}
        >
          {post.text || '—'}
        </p>
      </div>
    </div>
  )
}