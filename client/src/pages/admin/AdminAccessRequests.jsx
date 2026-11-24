import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAccessRequests, listAdminGroups, getUserNames, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import AdviserChip from '../../components/admin/AdviserChip'
import AccessRequestModal from '../../components/admin/AccessRequestModal'
import Pager from '../../components/admin/Pager'
import { RequestStatusChip } from '../../components/admin/RequestStatusChip'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const PAGE_SIZE = 25
const COUNTERS = ['pending', 'approved', 'declined', 'accessed']
const STATUSES = ['pending', 'approved', 'declined', 'accessed', 'expired']

const ghost =
  'rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export default function AdminAccessRequests() {
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({})
  const [groups, setGroups] = useState([])
  const [names, setNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [groupId, setGroupId] = useState('')
  const [open, setOpen] = useState(null)
  const requestId = useRef(0)

  const hasFilters = Boolean(status || groupId)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await listAccessRequests({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        group: groupId || undefined,
      })
      if (id !== requestId.current) return
      setRequests(result.data)
      setCounts(result.counts)
    } catch (e) {
      if (id !== requestId.current) return
      setError(apiMessage(e, 'Could not load access requests.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, status, groupId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    listAdminGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
    getUserNames()
      .then(setNames)
      .catch(() => setNames({}))
  }, [])

  const pick = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const clearFilters = () => {
    setStatus('')
    setGroupId('')
    setPage(1)
  }

  const adviserName = (r) => (r.adviser_id ? names[r.adviser_id] ?? `User #${r.adviser_id}` : null)

  const reassignControl = (r) => {
    if (r.adviser_id || !r.group_id) return null
    const cls = `${ghost} hover:bg-white/10 hover:text-white`
    return backendSupport.adminReassignAdviser ? (
      <Link to={`/admin/groups/${r.group_id}`} className={cls}>
        Reassign adviser
      </Link>
    ) : (
      <button type="button" disabled title={unsupportedNote.adminReassignAdviser} className={cls}>
        Reassign adviser
      </button>
    )
  }

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Access requests</h1>
        <p className="mt-1 text-sm text-white/60">
          Oversight only. Requests for full papers are handled by each group&apos;s adviser, so there is nothing to approve or decline here.
        </p>
      </header>

      <section aria-label="Requests by status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COUNTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pick(setStatus)(status === s ? '' : s)}
            aria-pressed={status === s}
            className={`${glass} p-4 text-left transition ${status === s ? 'border-gold/60' : 'hover:bg-white/5'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{s}</p>
            <p className="mt-1 text-3xl font-bold text-gold">{counts[s] ?? 0}</p>
          </button>
        ))}
      </section>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[12rem_16rem_auto] xl:justify-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Status</span>
            <Select value={status} onChange={(e) => pick(setStatus)(e.target.value)} aria-label="Filter by status" className="border-white/20">
              <Option value="">All statuses</Option>
              {STATUSES.map((s) => (
                <Option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Group</span>
            <Select value={groupId} onChange={(e) => pick(setGroupId)(e.target.value)} aria-label="Filter by group" className="border-white/20">
              <Option value="">All groups</Option>
              {groups.map((g) => (
                <Option key={g.group_id} value={String(g.group_id)}>
                  {g.group_name}
                </Option>
              ))}
            </Select>
          </div>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className={`${ghost} h-11 self-end px-4 text-sm`}>
            Clear filters
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={ghost}>
            Try again
          </button>
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{hasFilters ? 'No requests match these filters.' : 'No access requests yet.'}</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className={`${ghost} mt-4`}>
                Clear filters
              </button>
            )}
          </div>
        )
      ) : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Requester</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Paper</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Adviser</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Requested</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{r.name}</p>
                      <p className="truncate text-xs text-white/55">{r.email}</p>
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <p className="line-clamp-2 wrap-break-word">{r.paper_title}</p>
                      <p className="text-xs text-white/50">{r.group_name || '—'}</p>
                    </td>
                    <td className="px-5 py-3"><AdviserChip name={adviserName(r)} /></td>
                    <td className="px-5 py-3"><RequestStatusChip status={r.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/75">{timeAgo(r.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {reassignControl(r)}
                        <button type="button" onClick={() => setOpen(r)} className={ghost}>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
            {requests.map((r) => (
              <li key={r.request_id}>
                <button type="button" onClick={() => setOpen(r)} className={`${glass} block w-full p-4 text-left transition hover:bg-white/5`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.name}</span>
                      <span className="block truncate text-xs text-white/55">{r.email}</span>
                    </span>
                    <RequestStatusChip status={r.status} />
                  </span>
                  <span className="mt-2 block wrap-break-word text-sm text-white/80">{r.paper_title}</span>
                  <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
                    <span className="truncate">{r.group_name || '—'}</span>
                    <span>{timeAgo(r.created_at)}</span>
                  </span>
                </button>
                {reassignControl(r) && <div className="mt-2">{reassignControl(r)}</div>}
              </li>
            ))}
          </ul>

          <Pager
            page={page}
            hasNext={requests.length === PAGE_SIZE}
            onPage={setPage}
            summary={`${requests.length} ${requests.length === 1 ? 'request' : 'requests'} shown`}
          />
        </>
      )}

      {open && <AccessRequestModal request={open} names={names} onClose={() => setOpen(null)} />}
    </div>
  )
}