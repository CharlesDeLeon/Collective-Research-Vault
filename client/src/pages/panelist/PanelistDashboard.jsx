import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import useForum from '../../context/useForum'
import useAssignedGroups from '../../hooks/useAssignedGroups'
import { glass } from '../../components/dashboard/constants'
import GroupCard from '../../components/group/GroupCard'
import StatTile from '../../components/ui/StatTile'
import ErrorBanner from '../../components/ui/ErrorBanner'
import PostSummary from '../../components/admin/PostSummary'

export default function PanelistDashboard() {
  const { user } = useAuth()
  const { posts } = useForum()
  const { groups, loading, error, reload } = useAssignedGroups()

  const ids = useMemo(() => new Set(groups.map((g) => String(g.group_id))), [groups])
  const matchingPosts = useMemo(() => (posts ?? []).filter((p) => ids.has(String(p.groupId))), [posts, ids])
  const recent = useMemo(() => matchingPosts.slice(0, 5), [matchingPosts])
  const paperCount = groups.reduce((sum, g) => sum + Number(g.submission_count ?? 0), 0)
  const firstName = String(user?.name ?? user?.full_name ?? '').split(' ')[0]

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{firstName ? `Welcome, ${firstName}` : 'Dashboard'}</h1>
        <p className="mt-1 text-sm text-white/60">Groups where you are on the review panel. You can read their posts and add comments.</p>
      </header>

      <ErrorBanner message={error} onRetry={reload} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Assigned groups" value={loading ? '…' : groups.length} />
        <StatTile label="Papers" value={loading ? '…' : paperCount} />
        <StatTile label="Recent posts" value={loading ? '…' : matchingPosts.length} className="col-span-2 sm:col-span-1" />
      </section>

      <section aria-labelledby="groups-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="groups-heading" className="text-lg font-bold">Your groups</h2>
          <Link to="/panelist/groups" className="text-sm font-semibold text-gold underline-offset-2 hover:underline">
            See all
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-panel" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          !error && (
            <div className={`${glass} px-6 py-10 text-center`}>
              <p className="font-semibold">No groups yet</p>
              <p className="mt-1 text-sm text-white/60">You will see a group here once a System Admin assigns you to it.</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
            {groups.slice(0, 4).map((g) => (
              <GroupCard key={g.group_id} group={g} to={`/panelist/groups/${g.group_id}`} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <h2 id="recent-heading" className="text-lg font-bold">Recent posts</h2>
        <p className="text-xs text-white/45">Only the 200 most recent posts in the vault are checked.</p>
        {recent.length === 0 ? (
          <div className={`${glass} px-6 py-8 text-center text-sm text-white/60`}>
            {loading ? 'Loading…' : 'No posts in your groups yet.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`/panelist/posts/${p.id}`} className={`${glass} block p-4 transition hover:border-gold/40 sm:p-5`}>
                  <PostSummary post={p} lines={2} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}