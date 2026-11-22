import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useForum from '../../context/useForum'
import useAssignedGroups from '../../hooks/useAssignedGroups'
import { getGroup } from '../../services/adviserService'
import { glass } from '../../components/dashboard/constants'
import ForumPostCard from '../../components/forum/ForumPostCard'
import StatusPill from '../../components/dashboard/StatusPill'
import GroupSwitcher from '../../components/group/GroupSwitcher'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Avatar from '../../components/paper/Avatar'
import { normalizeStatus } from '../../utils/paperRules'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const TABS = ['Feed', 'Papers', 'Members']
const chip = 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70'
const postHref = (p) => `/panelist/posts/${p.id}`

export default function PanelistGroupDetail() {
  const { groupId } = useParams()
  const { posts } = useForum()
  const { groups: assigned } = useAssignedGroups()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Feed')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setGroup(await getGroup(groupId))
    } catch (e) {
      setGroup(null)
      setError(e.response?.status === 404 ? 'This group does not exist.' : e?.response?.data?.message || 'Could not load this group.')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const groupPosts = useMemo(() => (posts ?? []).filter((p) => String(p.groupId) === String(groupId)), [posts, groupId])
  const paperPosts = useMemo(() => groupPosts.filter((p) => p.type === 'paper' || p.paperId != null), [groupPosts])

  const back = (
    <Link to="/panelist/groups" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition hover:text-white">
      <span aria-hidden="true">←</span> Groups
    </Link>
  )

  if (loading && !group) {
    return (
      <div className="space-y-6 font-display" aria-busy="true">
        {back}
        <div className="h-32 animate-pulse rounded-2xl bg-panel" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="space-y-6 font-display">
        {back}
        <ErrorBanner message={error || 'Group not found.'} onRetry={load} />
      </div>
    )
  }

  const strand = group.strand || group.program
  const members = group.members ?? []
  const panel = group.panel ?? []

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <GroupSwitcher groups={assigned} currentId={groupId} basePath="/panelist/groups" />
      </div>

      <header className={`${glass} space-y-3 p-5 sm:p-6`}>
        <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{group.group_name}</h1>
        <div className="flex flex-wrap gap-2">
          {strand && <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{strand}</span>}
          {group.section && <span className={chip}>{group.section}</span>}
          {group.year_level && <span className={chip}>Grade {group.year_level}</span>}
          {group.school_year && <span className={chip}>{group.school_year}</span>}
        </div>
        <p className="text-sm text-white/60">
          Adviser: {group.adviser_name || '—'} · {members.length} {members.length === 1 ? 'member' : 'members'}
        </p>
      </header>

      <div role="tablist" aria-label="Group sections" className="flex gap-1 overflow-x-auto border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-t-xl px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            {t === 'Feed' ? `Feed (${groupPosts.length})` : t === 'Papers' ? `Papers (${paperPosts.length})` : `Members (${members.length})`}
          </button>
        ))}
      </div>

      {tab === 'Feed' &&
        (groupPosts.length === 0 ? (
          <div className={`${glass} px-6 py-10 text-center text-sm text-white/60`}>No posts in this group yet.</div>
        ) : (
          <div className="space-y-4">
            {groupPosts.map((p) => (
              <ForumPostCard key={p.id} post={p} showGroup={false} paperHref={postHref} />
            ))}
          </div>
        ))}

      {tab === 'Papers' && (
        <section className={`${glass} p-4 sm:p-6`}>
          {!backendSupport.panelistPaperList && <p className="mb-4 text-xs text-white/55">{unsupportedNote.panelistPaperList}</p>}
          {paperPosts.length === 0 ? (
            <p className="text-sm text-white/60">No paper posts in this group yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {paperPosts.map((p) => (
                <li key={p.id}>
                  <Link to={postHref(p)} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg px-2 py-3 transition hover:bg-white/5">
                    <span className="min-w-0">
                      <span className="block wrap-break-word text-sm font-semibold">{p.paperTitle || 'Untitled paper'}</span>
                      <span className="block text-xs text-white/55">
                        {p.authorName} · {timeAgo(p.createdAt)}
                      </span>
                    </span>
                    {p.status && <StatusPill status={normalizeStatus(p.status)} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'Members' && (
        <section className={`${glass} space-y-6 p-4 sm:p-6`}>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gold">Students</h2>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No members yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-white/10">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 py-3">
                    <Avatar name={m.name} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{m.name}</span>
                      <span className="block truncate text-xs text-white/55">{m.email}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gold">Panel</h2>
            {panel.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No panelists assigned.</p>
            ) : (
              <ul className="mt-2 divide-y divide-white/10">
                {panel.map((m) => (
                  <li key={m.assignment_id} className="flex items-center gap-3 py-3">
                    <Avatar name={m.name} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{m.name}</span>
                      <span className="block truncate text-xs text-white/55">{m.email}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}