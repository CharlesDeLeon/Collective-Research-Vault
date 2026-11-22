import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import StatTile from '../../components/ui/StatTile'
import ErrorBanner from '../../components/ui/ErrorBanner'

export default function AdviserAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/coordinator/submissions/analytics')
      setData(res.data?.data ?? null)
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const tiles = [
    ['Forum posts', data?.totalPosts],
    ['Comments', data?.totalComments],
    ['Likes', data?.totalLikes],
    ['Access requests', data?.totalAccessRequests],
    ['Downloads', data?.totalDownloads],
  ]

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-white/60">Activity across your groups.</p>
      </header>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : data ? (
        <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {tiles.map(([label, value], i) => (
            <StatTile key={label} label={label} value={value ?? 0} className={i === 4 ? 'col-span-2 sm:col-span-1' : ''} />
          ))}
        </section>
      ) : (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">No activity to show yet.</p>
            <p className="mt-1 text-sm text-white/60">Totals appear once your groups start posting.</p>
          </div>
        )
      )}

      <p className="text-xs text-white/50">These are totals for all time. Charts by week or month come later.</p>
    </div>
  )
}