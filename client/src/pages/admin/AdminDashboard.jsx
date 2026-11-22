import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import { getUserRoleStats, getAuditLogs, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import { PlusIcon, ClockIcon, UploadCloudIcon } from '../../components/dashboard/icons'
import { ROLE_OPTIONS, ROLE_LABELS, canonicalRole, formatAction } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

function HealthChip({ label, state }) {
  const tone = {
    ok: 'border-success/40 bg-success/10 text-success-ink',
    down: 'border-danger/40 bg-danger/10 text-danger-ink',
    unknown: 'border-white/15 bg-white/5 text-white/55',
  }[state]
  const text = { ok: 'Online', down: 'Unreachable', unknown: 'Not reported yet' }[state]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
      <span className={`size-1.5 rounded-full ${state === 'ok' ? 'bg-success' : state === 'down' ? 'bg-danger' : 'bg-white/40'}`} />
      {label}: {text}
    </span>
  )
}

const actionCls =
  'flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [statsResult, auditResult] = await Promise.allSettled([getUserRoleStats(), getAuditLogs({ page: 1, limit: 6 })])
    setStats(statsResult.status === 'fulfilled' ? statsResult.value : null)
    setRecent(auditResult.status === 'fulfilled' ? auditResult.value.data : null)
    const failed = [statsResult, auditResult].find((r) => r.status === 'rejected')
    if (failed) setError(apiMessage(failed.reason, 'Some dashboard data could not be loaded.'))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = (stats ?? []).reduce((acc, row) => {
    const key = canonicalRole(row.role)
    acc[key] = (acc[key] ?? 0) + Number(row.count)
    return acc
  }, {})
  const totalUsers = Object.values(counts).reduce((a, b) => a + b, 0)
  const serverState = loading ? 'unknown' : stats || recent ? 'ok' : 'down'
  const firstName = (user?.name ?? user?.full_name ?? '').split(' ')[0]

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-white/60">Here is how CORE V is doing.</p>
      </header>

      <section aria-label="System health" className="flex flex-wrap gap-2">
        <HealthChip label="API" state={serverState} />
        <HealthChip label="Database" state={serverState} />
        <HealthChip label="Storage" state="unknown" />
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-semibold transition hover:bg-danger/15"
          >
            Try again
          </button>
        </div>
      )}

      <section aria-label="Users by role" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {loading && !stats
          ? [0, 1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />)
          : stats && (
              <>
                <Link to="/admin/users" className={`${glass} col-span-2 p-4 transition hover:bg-white/5 sm:col-span-1`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Total users</p>
                  <p className="mt-1 text-3xl font-bold text-gold">{totalUsers}</p>
                </Link>
                {ROLE_OPTIONS.map((role) => (
                  <Link key={role} to="/admin/users" className={`${glass} p-4 transition hover:bg-white/5`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{ROLE_LABELS[role]}s</p>
                    <p className="mt-1 text-3xl font-bold text-gold">{counts[role] ?? 0}</p>
                  </Link>
                ))}
              </>
            )}
      </section>

      {!backendSupport.adminOverviewStats && (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-white/55">{unsupportedNote.adminOverviewStats}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className={`${glass} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Recent audit events</h2>
            <Link to="/admin/audit" className="text-sm font-semibold text-gold underline-offset-2 hover:underline">
              View audit log
            </Link>
          </div>
          {loading && !recent ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : !recent || recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/55">{recent ? 'Nothing has been logged yet.' : 'Recent events are not available right now.'}</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((a) => (
                <li key={a.log_id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{formatAction(a.action)}</p>
                    <p className="truncate text-xs text-white/55">
                      {a.user_name || 'System'}
                      {a.target_type ? ` · ${a.target_type}${a.target_id ? ` #${a.target_id}` : ''}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-white/50">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${glass} p-5`}>
          <h2 className="mb-4 text-lg font-bold">Quick actions</h2>
          <div className="flex flex-col gap-3">
            <Link to="/admin/users?create=1" className={actionCls}>
              <PlusIcon className="size-4" />
              Create user
            </Link>
            <Link to="/admin/audit" className={actionCls}>
              <ClockIcon className="size-4" />
              Audit log
            </Link>
            <Link to="/admin/storage" className={actionCls}>
              <UploadCloudIcon className="size-4" />
              Storage
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}