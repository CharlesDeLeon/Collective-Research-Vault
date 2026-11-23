import React, { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import useForum from '../../context/useForum'
import useToast from '../../context/useToast'
import {
  getGroup,
  listMyGroups,
  listSubmissions,
  searchStudents,
  addGroupMember,
  removeGroupMember,
  revokePanelAssignment,
  createPanelistInvite,
} from '../../services/adviserService'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { glass } from '../../components/dashboard/constants'
import { PlusIcon } from '../../components/dashboard/icons'
import ForumPostCard from '../../components/forum/ForumPostCard'
import StatusPill from '../../components/dashboard/StatusPill'
import GroupSwitcher from '../../components/group/GroupSwitcher'
import { timeAgo } from '../../utils/formatDate'

const TABS = ['Feed', 'Members', 'Panelists', 'Papers', 'Analytics']

export default function AdviserGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { posts, openComposer } = useForum()
  const { toast } = useToast()

  const [group, setGroup] = useState(null)
  const [allGroups, setAllGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('Feed')

  const [members, setMembers] = useState([])
  const [panel, setPanel] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [pendingRemoval, setPendingRemoval] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [copied, setCopied] = useState('')

  const fetchGroup = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const g = await getGroup(groupId)
      setGroup(g)
      setMembers(g?.members || [])
      setPanel(g?.panel || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const [g, { data }] = await Promise.all([getGroup(groupId), listSubmissions({ limit: 100 })])
      setMembers(g?.members || [])
      setPanel(g?.panel || [])
      setSubmissions(data.filter((s) => String(s.group_id) === String(groupId)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetail(false)
    }
  }, [groupId])

  useEffect(() => { fetchGroup() }, [fetchGroup])
  useEffect(() => { listMyGroups().then(setAllGroups).catch(() => setAllGroups([])) }, [])
  useEffect(() => { if (group) fetchDetail() }, [group, fetchDetail])

  const searchMembers = async (q) => {
    setMemberSearch(q)
    if (!q.trim()) { setMemberResults([]); return }
    try {
      const list = await searchStudents(q)
      setMemberResults(list.filter((s) => !members.some((m) => m.user_id === s.user_id)))
    } catch (e) {
      console.error(e)
    }
  }

  const addMember = async (s) => {
    try {
      await addGroupMember(groupId, s.user_id)
      setMemberResults((r) => r.filter((x) => x.user_id !== s.user_id))
      setMemberSearch('')
      toast(`${s.name} added to the group.`)
      fetchDetail()
    } catch (e) {
      console.error(e)
      toast('Could not add the student.', 'error')
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteError('')
    setInviteResult(null)
    if (!inviteEmail.trim()) {
      setInviteError('Email is required.')
      return
    }
    setInviteLoading(true)
    try {
      const result = await createPanelistInvite({ email: inviteEmail.trim(), name: inviteName.trim() })
      setInviteResult(result)
      setInviteEmail('')
      setInviteName('')
      toast('Invitation created. Share the link and temporary password.')
    } catch (e) {
      console.error(e)
      setInviteError(e?.response?.data?.message || 'Could not create invitation.')
    } finally {
      setInviteLoading(false)
    }
  }

  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  const confirmRemoval = async () => {
    const target = pendingRemoval
    setPendingRemoval(null)
    if (!target) return
    try {
      if (target.kind === 'member') {
        await removeGroupMember(groupId, target.id)
        toast('Member removed.')
      } else {
        await revokePanelAssignment(target.id)
        toast('Panelist revoked.')
      }
      fetchDetail()
    } catch (e) {
      console.error(e)
      toast('That did not work. Try again.', 'error')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-white/60">Loading group…</div>
  }
  if (error || !group) {
    return (
      <div className="space-y-4">
        <Link to="/adviser/groups" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
          ‹ Back to groups
        </Link>
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="m-0 text-sm text-rose-200">{error || 'Group not found.'}</p>
        </div>
      </div>
    )
  }

  const groupPosts = (posts || []).filter((p) => String(p.groupId) === String(groupId))
  const groupIndex = allGroups.findIndex((g) => String(g.group_id) === String(groupId))
  const prevGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : null
  const nextGroup = groupIndex >= 0 && groupIndex < allGroups.length - 1 ? allGroups[groupIndex + 1] : null

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/adviser/groups" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
          ‹ Groups
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/adviser/groups/${prevGroup.group_id}`)}
            disabled={!prevGroup}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 enabled:hover:bg-white/10 disabled:opacity-40"
          >
            ‹ Previous
          </button>
          <GroupSwitcher groups={allGroups} currentId={groupId} basePath="/adviser/groups" />
          <button
            type="button"
            onClick={() => navigate(`/adviser/groups/${nextGroup.group_id}`)}
            disabled={!nextGroup}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 enabled:hover:bg-white/10 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      </div>

      <header className={`${glass} flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between`}>
        <div className="min-w-0 space-y-3">
          <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{group.group_name}</h1>
          <div className="flex flex-wrap gap-2">
            {(group.strand || group.program) && (
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                {group.strand || group.program}
              </span>
            )}
            {group.section && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                {group.section}
              </span>
            )}
            {group.year_level && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                Grade {group.year_level}
              </span>
            )}
            {group.school_year && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                {group.school_year}
              </span>
            )}
          </div>
          <p className="text-sm text-white/60">Adviser: {group.adviser_name || '—'}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <button
            type="button"
            onClick={() => navigate(`/adviser/groups?edit=${groupId}`)}
            className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20"
          >
            Edit group
          </button>
          <div className="text-sm text-white/60">
            <div>{members.length} members</div>
            <div>{submissions.length} papers</div>
            <div>{groupPosts.length} posts</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-t-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Feed' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openComposer({ groupId: Number(groupId) })}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gold/60 bg-gold/10 px-4 text-sm font-semibold text-gold transition hover:bg-gold/20"
            >
              <PlusIcon className="size-4" /> New post
            </button>
          </div>
          {groupPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
              No posts in this group yet.
            </div>
          ) : (
            <div className="space-y-4">
              {groupPosts.map((p) => (
                <ForumPostCard key={p.id} post={p} showGroup={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Members' && (
        <div className={`${glass} p-5 sm:p-6 space-y-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">Members ({members.length})</h2>
            <div className="relative w-full sm:w-64">
              <input
                value={memberSearch}
                onChange={(e) => searchMembers(e.target.value)}
                placeholder="Search students to add…"
                className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
              />
              {memberResults.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy-900/95 shadow-lg">
                  {memberResults.map((s) => (
                    <li key={s.user_id}>
                      <button
                        type="button"
                        onClick={() => addMember(s)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                      >
                        {s.name} <span className="text-white/50">({s.email})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-white/50">No members yet.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div>
                    <p className="m-0 text-sm font-medium">{m.name}</p>
                    <p className="m-0 text-xs text-white/50">{m.email} · {m.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingRemoval({ kind: 'member', id: m.user_id, name: m.name })}
                    className="text-xs font-semibold text-rose-300 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Panelists' && (
        <div className={`${glass} p-5 sm:p-6 space-y-4`}>
          <h2 className="text-lg font-bold">Invite external panelist</h2>
          <p className="m-0 text-xs text-white/60">
            Panelists receive platform-wide access to the forum and student paper metadata. They do not need to be assigned to this group.
          </p>

          <form onSubmit={handleInvite} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Email</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="panelist@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Name (optional)</span>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
                />
              </label>
            </div>
            {inviteError && <p className="text-xs text-rose-300">{inviteError}</p>}
            <button
              type="submit"
              disabled={inviteLoading}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {inviteLoading ? 'Creating…' : 'Create invitation'}
            </button>
          </form>

          {inviteResult && (
            <div className="space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <p className="m-0 text-sm font-semibold text-gold">Invitation created</p>
              <p className="m-0 text-xs text-white/60">
                Share the link and temporary password with the panelist yourself. Email delivery is not confirmed automatically.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/80">{inviteResult.inviteUrl}</code>
                  <button
                    type="button"
                    onClick={() => copyText(inviteResult.inviteUrl, 'link')}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                  >
                    {copied === 'link' ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/80">{inviteResult.tempPassword}</code>
                  <button
                    type="button"
                    onClick={() => copyText(inviteResult.tempPassword, 'pw')}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                  >
                    {copied === 'pw' ? 'Copied' : 'Copy password'}
                  </button>
                </div>
              </div>
              <p className="m-0 text-xs text-white/50">
                Expires {new Date(inviteResult.expiresAt).toLocaleString()}. Single use.
              </p>
            </div>
          )}

          {panel.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Previously assigned panelists</h3>
              <ul className="space-y-2">
                {panel.map((p) => (
                  <li key={p.assignment_id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div>
                      <p className="m-0 text-sm font-medium">{p.name}</p>
                      <p className="m-0 text-xs text-white/50">{p.email} · {p.role_in_panel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingRemoval({ kind: 'panel', id: p.assignment_id, name: p.name })}
                      className="text-xs font-semibold text-rose-300 hover:underline"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'Papers' && (
        <div className={`${glass} p-5 sm:p-6 space-y-4`}>
          <h2 className="text-lg font-bold">Papers ({submissions.length})</h2>
          <p className="m-0 text-xs text-white/50">
            Showing matches within the 100 most recently updated submissions in the vault. Older papers for this group may not appear.
          </p>
          {loadingDetail ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-white/50">No papers submitted for this group.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.submission_id} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 font-medium truncate">{s.title}</p>
                      <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <StatusPill status={s.status} />
                        <span>{s.stage}</span>
                        {s.submitted_by_name && <span>by {s.submitted_by_name}</span>}
                        {s.updated_at && <span>Updated {timeAgo(s.updated_at)}</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/adviser/reviews/${s.submission_id}`)}
                      className="shrink-0 text-xs font-semibold text-gold hover:underline"
                    >
                      Review
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pendingRemoval && (
        <ConfirmModal
          title={pendingRemoval.kind === 'member' ? 'Remove member' : 'Revoke panelist'}
          message={
            pendingRemoval.kind === 'member'
              ? `Remove ${pendingRemoval.name} from this group? Their posts and papers stay.`
              : `Revoke ${pendingRemoval.name} from this group's panel?`
          }
          confirmLabel={pendingRemoval.kind === 'member' ? 'Remove' : 'Revoke'}
          danger
          onConfirm={confirmRemoval}
          onClose={() => setPendingRemoval(null)}
        />
      )}

      {tab === 'Analytics' && (
        <div className={`${glass} p-5 sm:p-6 space-y-4`}>
          <h2 className="text-lg font-bold">Group Analytics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl font-bold text-gold">{members.length}</div>
              <div className="text-xs text-white/60">Members</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl font-bold text-gold">{submissions.length}</div>
              <div className="text-xs text-white/60">Papers</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl font-bold text-gold">{submissions.filter(s => s.status === 'published').length}</div>
              <div className="text-xs text-white/60">Published</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl font-bold text-gold">{groupPosts.length}</div>
              <div className="text-xs text-white/60">Posts</div>
            </div>
          </div>
          {submissions.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-white/70">Papers by status</h3>
              <ul className="space-y-1 text-sm">
                {[...new Set(submissions.map(s => s.status))].map(st => (
                  <li key={st} className="flex justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                    <span className="capitalize">{String(st).replace(/_/g, ' ')}</span>
                    <span className="text-gold">{submissions.filter(s => s.status === st).length}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}