import { Link, useParams } from 'react-router-dom'
import useForum from '../../context/useForum'
import useAssignedGroups from '../../hooks/useAssignedGroups'
import { glass } from '../../components/dashboard/constants'
import ForumPostCard from '../../components/forum/ForumPostCard'
import ErrorBanner from '../../components/ui/ErrorBanner'

export default function PanelistPostDetail() {
  const { postId } = useParams()
  const { posts, loading } = useForum()
  const { groups: assigned, loading: assignedLoading, error: assignedError, reload: reloadAssigned } = useAssignedGroups()
  const post = (posts ?? []).find((p) => String(p.id) === String(postId))
  const allowed = true
  const backTo = post?.groupId ? `/panelist/groups/${post.groupId}` : '/panelist/groups'

  return (
    <div className="space-y-6 font-display">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition hover:text-white">
        <span aria-hidden="true">←</span> {post?.groupName || 'Groups'}
      </Link>

      {assignedLoading || (loading && !post) ? (
        <div className="h-48 animate-pulse rounded-2xl bg-panel" aria-busy="true" />
      ) : assignedError ? (
        <ErrorBanner message={assignedError} onRetry={reloadAssigned} />
      ) : !post ? (
        <div className={`${glass} px-6 py-12 text-center`}>
          <p className="font-semibold">This post is not available.</p>
          <p className="mt-1 text-sm text-white/60">It may have been removed, or it belongs to a group you are not part of.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <ForumPostCard post={post} defaultOpen paperHref={() => null} />
        </div>
      )}
    </div>
  )
}
