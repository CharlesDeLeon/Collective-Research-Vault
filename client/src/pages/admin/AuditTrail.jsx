import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuditLogs, getAuditSummary, getUserNames, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import AuditDetailModal from '../../components/admin/AuditDetailModal'
import { CheckIcon, SearchIcon } from '../../components/dashboard/icons'
import { formatAction } from '../../utils/adminRoles'
import { toCsv, downloadCsv } from '../../utils/csv'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { timeAgo } from '../../utils/formatDate'

const PAGE_SIZE = 25

const targetText = (a) => (a.target_type ? `${a.target_type}${a.target_id ? ` #${a.target_id}` : ''}` : '—')
const whenText = (a) => (a.created_at ? new Date(a.created_at).toLocaleString() : '—')

const smallBtn =
  'rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

const dateInputCls =
  'mt-1 h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 px-3 text-sm text-white outline-none transition scheme-dark focus:border-gold/60 focus:ring-2 focus:ring-gold/20'

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ actions: [], targets: [], actors: [] })
  const [actors, setActors] = useState([])
  const [actor, setActor] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [open, setOpen] = useState(null)
  const requestId = useRef(0)

  const hasFilters = Boolean(actor || action || targetType || dateFrom || dateTo || search)
  const rangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo)

  useEffect(() => {
    Promise.all([getAuditSummary(), getUserNames().catch(() => ({}))])
      .then(([summaryResult, names]) => {
        setSummary(summaryResult)
        const counts = Object.fromEntries((summaryResult.actors ?? []).map((row) => [row.name, row.count]))
        setActors(
          Object.entries(names).map(([id, name]) => ({
            id,
            name,
            count: counts[name] ?? 0,
          }))
        )
      })
      .catch(() => setSummary({ actions: [], targets: [], actors: [] }))
  }, [])

  const load = useCallback(async () => {
    if (rangeInvalid) return
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await getAuditLogs({
        page,
        limit: PAGE_SIZE,
        userId: actor || undefined,
        action: action || undefined,
        targetType: targetType || undefined,
        dateFrom: dateFrom ? `${dateFrom}T00:00:00` : undefined,
        dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
        ...(backendSupport.adminAuditSearch ? { search: search || undefined } : {}),
      })
      if (id !== requestId.current) return
      setLogs(result.data)
      setTotal(result.total)
    } catch (e) {
      if (id !== requestId.current) return
      setError(apiMessage(e, 'Could not load the audit log.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, actor, action, targetType, dateFrom, dateTo, search, rangeInvalid])

  useEffect(() => {
    load()
  }, [load])

  const change = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setActor('')
    setAction('')
    setTargetType('')
    setDateFrom('')
    setDateTo('')
    setSearch('')
    setPage(1)
  }

  const exportPage = () => {
    const csv = toCsv(
      ['Time', 'Actor', 'Email', 'Action', 'Target type', 'Target id', 'IP address', 'Request id'],
      logs.map((a) => [
        a.created_at ? new Date(a.created_at).toISOString() : '',
        a.user_name || 'System',
        a.user_email || '',
        a.action,
        a.target_type || '',
        a.target_id || '',
        a.ip_address || '',
        a.request_id ?? a.requestId ?? '',
      ])
    )
    downloadCsv(`corev-audit-page-${page}.csv`, csv)
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6 font-display">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">Audit log</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold text-success-ink">
              <CheckIcon className="size-3.5" />
              Immutable
            </span>
          </div>
          <p className="mt-1 text-sm text-white/60">A read-only record of what happened in CORE V. Entries cannot be edited or deleted.</p>
        </div>
        <button type="button" onClick={exportPage} disabled={logs.length === 0} className={`${smallBtn} h-11 px-4 text-sm`}>
          Export this page (CSV)
        </button>
      </header>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search audit entries</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              disabled={!backendSupport.adminAuditSearch}
              placeholder="Search entries"
              className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20 disabled:opacity-50"
            />
          </label>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Actor</span>
            <Select value={actor} onChange={change(setActor)} aria-label="Filter by actor" className="border-white/20">
              <Option value="">All actors</Option>
              {actors.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.name}{a.count ? ` (${a.count})` : ''}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Action</span>
            <Select value={action} onChange={change(setAction)} aria-label="Filter by action" className="border-white/20">
              <Option value="">All actions</Option>
              {summary.actions.map((row) => (
                <Option key={row.action} value={row.action}>
                  {formatAction(row.action)}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Target</span>
            <Select value={targetType} onChange={change(setTargetType)} aria-label="Filter by target type" className="border-white/20">
              <Option value="">All targets</Option>
              {summary.targets
                .filter((row) => row.target_type)
                .map((row) => (
                  <Option key={row.target_type} value={row.target_type}>
                    {formatAction(row.target_type)}
                  </Option>
                ))}
            </Select>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">From</span>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={change(setDateFrom)} className={dateInputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">To</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={change(setDateTo)} className={dateInputCls} />
          </label>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className={`${smallBtn} h-11 self-end px-4 text-sm`}>
            Clear filters
          </button>
        </div>
        {rangeInvalid && (
          <p role="alert" className="mt-3 text-xs text-danger-ink">
            The start date must be on or before the end date.
          </p>
        )}
        {!backendSupport.adminAuditSearch && <p className="mt-3 text-xs text-white/50">{unsupportedNote.adminAuditSearch}</p>}
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={smallBtn}>
            Try again
          </button>
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : logs.length === 0 && !error ? (
        <div className={`${glass} px-6 py-12 text-center`}>
          <p className="font-semibold">{hasFilters ? 'No entries match these filters.' : 'Nothing has been logged yet.'}</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className={`${smallBtn} mt-4`}>
              Clear filters
            </button>
          )}
        </div>
      ) : (logs.length === 0 ? null : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Time</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Actor</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Target</th>
                  <th scope="col" className="px-5 py-3 font-semibold">IP</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Request ID</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((a) => (
                  <tr key={a.log_id} className="border-b border-white/5 last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-white/75">{whenText(a)}</td>
                    <td className="px-5 py-3">{a.user_name || <span className="text-white/50">System</span>}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                        {formatAction(a.action)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/75">{targetText(a)}</td>
                    <td className="px-5 py-3 text-white/75">{a.ip_address || '—'}</td>
                    <td className="px-5 py-3 text-white/75">{a.request_id ?? a.requestId ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => setOpen(a)} className={smallBtn}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
            {logs.map((a) => (
              <li key={a.log_id}>
                <button type="button" onClick={() => setOpen(a)} className={`${glass} block w-full p-4 text-left transition hover:bg-white/5`}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-block rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                      {formatAction(a.action)}
                    </span>
                    <span className="shrink-0 text-xs text-white/50">{timeAgo(a.created_at)}</span>
                  </span>
                  <span className="mt-2 block text-sm">{a.user_name || 'System'}</span>
                  <span className="block text-xs text-white/55">{targetText(a)}</span>
                  {(a.request_id ?? a.requestId) && <span className="mt-1 block text-xs text-white/45">Request {a.request_id ?? a.requestId}</span>}
                </button>
              </li>
            ))}
          </ul>

          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
            <p>
              Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`${smallBtn} px-4`}>
                Previous
              </button>
              <span>Page {page}</span>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= total} className={`${smallBtn} px-4`}>
                Next
              </button>
            </div>
          </nav>
        </>
      ))}

      {open && <AuditDetailModal entry={open} onClose={() => setOpen(null)} />}
    </div>
  )
}