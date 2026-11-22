import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserAudit, apiMessage } from '../../services/adminService'
import { glass } from '../dashboard/constants'
import Pager from './Pager'
import AuditDetailModal from './AuditDetailModal'
import { formatAction } from '../../utils/adminRoles'

const PAGE_SIZE = 10

const TABS = [
  { id: 'about', label: 'Changes to this account', empty: 'No changes to this account have been recorded.' },
  { id: 'by', label: 'Actions by this person', empty: 'This person has not done anything that was recorded.' },
]

const when = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function UserActivity({ userId, refreshKey }) {
  const [mode, setMode] = useState('about')
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await getUserAudit(userId, mode, page, PAGE_SIZE)
      if (id !== requestId.current) return
      setLogs(result.data)
      setTotal(result.total)
    } catch (e) {
      if (id !== requestId.current) return
      setError(apiMessage(e, 'Could not load the activity.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [userId, mode, page])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const tab = TABS.find((t) => t.id === mode)
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <section className={`${glass} p-4 sm:p-5`}>
      <h2 className="text-base font-bold">Activity</h2>
      <div role="tablist" aria-label="Activity" className="mt-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => {
              setMode(t.id)
              setPage(1)
            }}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              mode === t.id ? 'border-gold/50 bg-gold/15 text-gold' : 'border-white/15 text-white/70 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-semibold transition hover:bg-danger/15">
            Try again
          </button>
        </div>
      )}

      <div className="mt-4" role="tabpanel">
        {loading && logs.length === 0 ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          !error && <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">{tab.empty}</p>
        ) : (
          <ul className={`divide-y divide-white/10 ${loading ? 'opacity-60' : ''}`}>
            {logs.map((entry) => (
              <li key={entry.log_id ?? `${entry.created_at}-${entry.action}`}>
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-2 py-3 text-left transition hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{formatAction(entry.action)}</span>
                    <span className="block text-xs text-white/55">
                      {mode === 'about'
                        ? `By ${entry.user_name || 'System'}`
                        : entry.target_type
                          ? `${entry.target_type}${entry.target_id ? ` #${entry.target_id}` : ''}`
                          : 'No target'}
                    </span>
                  </span>
                  <span className="text-xs text-white/55">{when(entry.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4">
          <Pager page={page} hasNext={page * PAGE_SIZE < total} onPage={setPage} summary={`Showing ${from}–${to} of ${total}`} />
        </div>
      )}

      {selected && <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}