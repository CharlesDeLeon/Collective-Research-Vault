import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import { getDashboard } from '../../services/adviserService'
import { glass } from '../../components/dashboard/constants'

const KPI = [
  { key: 'total_groups', label: 'My Groups', accent: 'text-sky-300' },
  { key: 'total_submissions', label: 'Submissions', accent: 'text-violet-300' },
  { key: 'pending_review', label: 'Pending Review', accent: 'text-amber-300' },
  { key: 'published', label: 'Published', accent: 'text-emerald-300' },
]

const QUICK = [
  { label: 'Create Group', to: '/adviser/groups', primary: true },
  { label: 'Review Queue', to: '/adviser/reviews' },
  { label: 'Access Inbox', to: '/adviser/inbox' },
  { label: 'Manage Groups', to: '/adviser/groups' },
]

export default function AdviserDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await getDashboard())
    } catch (e) {
      console.error(e)
      setError('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const firstName = (user?.name ?? user?.full_name ?? 'Adviser').split(' ')[0]

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-white/60">
          Overview of your groups, submissions, and reviews.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && stats && Number(stats.total_groups) === 0 && (
        <section className="rounded-2xl border-2 border-dashed border-white/20 px-6 py-10 text-center">
          <p className="m-0 text-lg font-semibold">Create your first group</p>
          <p className="mb-0 mt-1 text-sm text-white/70">Groups hold your students, their papers and the discussion feed.</p>
          <button
            type="button"
            onClick={() => navigate('/adviser/groups')}
            className="mt-5 h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-7 text-base font-semibold text-ink hover:brightness-105"
          >
            Create group
          </button>
        </section>
      )}

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="mb-3 text-sm font-medium text-white/70">At a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {KPI.map(({ key, label, accent }) => (
            <div key={key} className={`${glass} p-4 sm:p-5`}>
              <div className={`text-3xl font-bold tracking-tight ${accent}`}>
                {loading ? '—' : (stats?.[key] ?? 0)}
              </div>
              <div className="mt-1 text-xs font-medium text-white/60 sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${glass} p-5 sm:p-6`}>
          <h2 className="mb-4 text-lg font-bold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map(({ label, to, primary }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className={`h-11 rounded-xl text-sm font-semibold transition ${
                  primary
                    ? 'bg-linear-to-br/srgb from-gold to-gold-soft text-ink hover:brightness-105'
                    : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${glass} p-5 sm:p-6`}>
          <h2 className="mb-4 text-lg font-bold">Submissions by status</h2>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.07]" />
              ))}
            </div>
          ) : stats?.by_status?.length ? (
            <ul className="space-y-2">
              {stats.by_status.map((s) => (
                <li key={s.status} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-sm capitalize text-white/80">{String(s.status).replace(/_/g, ' ')}</span>
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">No submissions yet.</p>
          )}
        </div>
      </section>

      <section className={`${glass} p-5 sm:p-6`}>
        <h2 className="mb-4 text-lg font-bold">Recent activity</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.07]" />
            ))}
          </div>
        ) : stats?.recent_activity?.length ? (
          <ul className="divide-y divide-white/10">
            {stats.recent_activity.map((r) => (
              <li key={r.submission_id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-white/50">
                    {r.group_name} · {r.stage} · {String(r.status).replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-white/40">
                  {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/50">No recent activity.</p>
        )}
      </section>
    </div>
  )
}