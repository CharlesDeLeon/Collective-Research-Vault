import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'

export default function AdviserAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/submissions/analytics')
      setData(res.data?.data || null)
    } catch (e) {
      console.error(e)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const cards = data ? [
    { label: 'Forum posts', value: data.totalPosts, accent: 'text-sky-300' },
    { label: 'Comments', value: data.totalComments, accent: 'text-violet-300' },
    { label: 'Likes', value: data.totalLikes, accent: 'text-rose-300' },
    { label: 'Access requests', value: data.totalAccessRequests, accent: 'text-amber-300' },
    { label: 'Downloads', value: data.totalDownloads, accent: 'text-emerald-300' },
  ] : []

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-sm text-white/60">Engagement and activity across your groups.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className={`${glass} p-4 sm:p-5`}>
              <div className={`text-3xl font-bold tracking-tight ${c.accent}`}>{c.value ?? 0}</div>
              <div className="mt-1 text-xs font-medium text-white/60 sm:text-sm">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className={`${glass} p-5 sm:p-6`}>
        <h2 className="mb-3 text-lg font-bold">Notes</h2>
        <p className="text-sm text-white/60">
          Charts and time-series breakdowns will be added once the data volume warrants it. The KPIs above
          reflect all activity across your groups.
        </p>
      </div>
    </div>
  )
}