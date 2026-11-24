import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useToast from '../../context/useToast'
import { getAdminGroup, listAdminPosts, archiveAdminGroup, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import StatusPill from '../../components/dashboard/StatusPill'
import AdviserChip from '../../components/admin/AdviserChip'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ReassignAdviserModal from '../../components/admin/ReassignAdviserModal'
import { normalizeStatus } from '../../utils/paperRules'
import { timeAgo, fullDate } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const ghost =
  'rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

function Section({ title, count, children }) {
  return (
    <section className={`${glass} p-5`}>
      <h2 className="mb-4 text-lg font-bold">
        {title}
        {count !== undefined && <span className="ml-2 text-sm font-normal text-white/50">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

const empty = (text) => <p className="py-4 text-center text-sm text-white/55">{text}</p>

export default function AdminGroupDetail() {
  const { groupId } = useParams()
  const { toast } = useToast()
  const [group, setGroup] = useState(null)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setMissing(false)
    try {
      const [g, posts] = await Promise.all([getAdminGroup(groupId), listAdminPosts({ groupId, limit: 100 }).catch(() => [])])
      setGroup(g)
      setPapers(posts.filter((p) => p.paperId != null))
    } catch (e) {
      if (e.response?.status === 404) setMissing(true)
      else setError(apiMessage(e, 'Could not load this group.'))
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const confirmArchive = async () => {
    setArchiving(true)
    try {
      await archiveAdminGroup(group.group_id)
      setArchiveOpen(false)
      toast(`${group.group_name} was archived.`)
      load()
    } catch (e) {
      toast(apiMessage(e, 'Could not archive this group.'), 'error')
    } finally {
      setArchiving(false)
    }
  }

  const back = (
    <Link to="/admin/groups" className="text-sm font-semibold text-gold underline-offset-2 hover:underline">
      ← All groups
    </Link>
  )

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-panel" />
        <div className="h-40 animate-pulse rounded-2xl bg-panel" />
        <div className="h-40 animate-pulse rounded-2xl bg-panel" />
      </div>
    )
  }

  if (missing || error || !group) {
    return (
      <div className="space-y-4 font-display">
        {back}
        <div className={`${glass} px-6 py-12 text-center`}>
          <p className="font-semibold">{missing ? 'This group does not exist.' : error || 'Could not load this group.'}</p>
          {!missing && (
            <button type="button" onClick={load} className={`${ghost} mt-4`}>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  const meta = [group.strand, group.section, group.year_level && `Grade ${group.year_level}`, group.school_year].filter(Boolean)

  return (
    <div className="space-y-6 font-display">
      {back}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{group.group_name}</h1>
          {meta.length > 0 && <p className="mt-1 truncate text-sm text-white/60">{meta.join(' · ')}</p>}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/55">Adviser</span>
            <AdviserChip name={group.adviser_name} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReassignOpen(true)}
            disabled={!backendSupport.adminReassignAdviser}
            className={`${ghost} h-11 px-4 text-sm`}
          >
            Reassign adviser
          </button>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            disabled={!backendSupport.adminArchiveGroup}
            className={`${ghost} h-11 px-4 text-sm`}
          >
            Archive group
          </button>
        </div>
      </header>

      {(!backendSupport.adminReassignAdviser || !backendSupport.adminArchiveGroup) && (
        <p className="text-xs text-white/50">
          {unsupportedNote.adminReassignAdviser} {unsupportedNote.adminArchiveGroup}
        </p>
      )}

      {!group.adviser_name && (
        <p role="status" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn-ink">
          This group has no adviser. Its papers cannot be published until an adviser is assigned.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Members" count={group.members?.length ?? 0}>
          {!group.members?.length ? (
            empty('No members yet.')
          ) : (
            <ul className="divide-y divide-white/10">
              {group.members.map((m) => (
                <li key={m.user_id} className="py-3">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-white/55">
                    {m.email}
                    {m.program ? ` · ${m.program}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Panelists" count={group.panel?.length ?? 0}>
          {!group.panel?.length ? (
            empty('No panelists assigned.')
          ) : (
            <ul className="divide-y divide-white/10">
              {group.panel.map((p) => (
                <li key={p.assignment_id} className="py-3">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="max-w-full min-w-0 truncate text-xs text-white/55">
                    {p.email}
                    {p.role_in_panel ? ` · ${p.role_in_panel}` : ''}
                    {p.assigned_at ? ` · assigned ${fullDate(p.assigned_at)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Papers" count={papers.length}>
        {papers.length === 0 ? (
          empty('No papers posted by this group yet.')
        ) : (
          <ul className="divide-y divide-white/10">
            {papers.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-semibold">{p.paperTitle || p.text || 'Untitled paper'}</p>
                  <p className="truncate text-xs text-white/55">
                    {p.authorName} · {timeAgo(p.createdAt)}
                  </p>
                </div>
                {p.status && <StatusPill status={normalizeStatus(p.status)} />}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {reassignOpen && (
        <ReassignAdviserModal
          group={group}
          onClose={() => setReassignOpen(false)}
          onDone={() => {
            setReassignOpen(false)
            toast('Adviser reassigned.')
            load()
          }}
        />
      )}
      {archiveOpen && (
        <ConfirmModal
          title="Archive group"
          message={`Archive ${group.group_name}? It will leave the active group list. This does not delete any paper files, and the group cannot be restored from this screen.`}
          confirmLabel={archiving ? 'Archiving…' : 'Archive group'}
          danger
          onConfirm={confirmArchive}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </div>
  )
}