import { useCallback, useEffect, useMemo, useState } from 'react'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import StatTile from '../../components/ui/StatTile'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { BarList, ColumnChart } from '../../components/admin/Charts'
import { loadInsights, POST_LIMIT } from '../../services/adminInsights'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { downloadCsv } from '../../utils/downloadCsv'
import { roleLabel } from '../../utils/adminRoles'

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

const DAY = 86400000
const short = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const monthLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function bucketPosts(posts, range) {
  const today = startOfDay(new Date())
  if (range === 'all') {
    const dates = posts.map((p) => new Date(p.createdAt)).filter((d) => !Number.isNaN(d.getTime()))
    if (dates.length === 0) return []
    const earliest = new Date(Math.min(...dates))
    let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
    const last = new Date(today.getFullYear(), today.getMonth(), 1)
    const months = []
    while (cursor <= last) {
      months.push({ key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: monthLabel(cursor), value: 0 })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
    const trimmed = months.slice(-24)
    const index = Object.fromEntries(trimmed.map((m, i) => [m.key, i]))
    dates.forEach((d) => {
      const i = index[`${d.getFullYear()}-${d.getMonth()}`]
      if (i !== undefined) trimmed[i].value += 1
    })
    return trimmed
  }
  const days = Number(range)
  const size = days === 90 ? 7 : 1
  const count = Math.ceil(days / size)
  const start = new Date(today.getTime() - (count * size - 1) * DAY)
  const buckets = Array.from({ length: count }, (_, i) => ({
    label: short(new Date(start.getTime() + i * size * DAY)),
    value: 0,
  }))
  posts.forEach((p) => {
    const t = new Date(p.createdAt).getTime()
    if (Number.isNaN(t)) return
    const i = Math.floor((startOfDay(t).getTime() - start.getTime()) / (size * DAY))
    if (i >= 0 && i < count) buckets[i].value += 1
  })
  return buckets
}

function tally(items, pick) {
  const map = new Map()
  items.forEach((item) => {
    const key = pick(item)
    if (key) map.set(key, (map.get(key) ?? 0) + 1)
  })
  return [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function Panel({ title, note, children }) {
  return (
    <section className={`${glass} min-w-0 p-4 sm:p-5`}>
      <h2 className="text-base font-bold">{title}</h2>
      {note && <p className="mt-1 text-xs text-white/50">{note}</p>}
      {children}
    </section>
  )
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30')

  const load = useCallback(async () => {
    setLoading(true)
    setData(await loadInsights())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const view = useMemo(() => {
    if (!data) return null
    const allPosts = data.posts ?? []
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * DAY
    const posts = allPosts.filter((p) => new Date(p.createdAt).getTime() >= cutoff)
    const roles = (data.roles ?? []).map((r) => ({ label: roleLabel(r.role), value: Number(r.count) }))
    const access = Object.entries(data.access ?? {}).map(([label, value]) => ({ label, value: Number(value) }))
    return {
      posts,
      roles,
      access,
      users: roles.reduce((s, r) => s + r.value, 0),
      accessTotal: access.reduce((s, r) => s + r.value, 0),
      comments: posts.reduce((s, p) => s + (p.commentCount ?? 0), 0),
      likes: posts.reduce((s, p) => s + (p.likes ?? 0), 0),
      series: bucketPosts(posts, range),
      byType: tally(posts, (p) => p.type),
      byStrand: tally(data.groups ?? [], (g) => g.strand || g.program),
      capped: allPosts.length >= POST_LIMIT,
    }
  }, [data, range])

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? ''

  const exportCsv = () => {
    const block = (title, head, rows) => [[title], head, ...rows, []]
    downloadCsv('admin-analytics.csv', [
      ['Analytics', rangeLabel],
      [],
      ...block('Users by role', ['Role', 'Count'], view.roles.map((r) => [r.label, r.value])),
      ...block('Posts by type', ['Type', 'Count'], view.byType.map((r) => [r.label, r.value])),
      ...block('Posts over time', ['Period', 'Count'], view.series.map((r) => [r.label, r.value])),
      ...block('Access requests', ['Status', 'Count'], view.access.map((r) => [r.label, r.value])),
      ...block('Groups by strand', ['Strand', 'Count'], view.byStrand.map((r) => [r.label, r.value])),
    ])
  }

  const unavailable = !backendSupport.adminDownloads || !backendSupport.adminActiveUsers

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-white/60">Activity across every group, over time.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
            <Select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range" className="border-white/20">
              {RANGES.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!view}
            className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </header>

      <ErrorBanner
        message={data?.failed.length ? `Could not load: ${data.failed.join(', ')}. Those charts are empty.` : ''}
        onRetry={load}
      />

      {loading || !view ? (
        <div className="space-y-3" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-2xl bg-panel" />
        </div>
      ) : (
        <>
          <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Users" value={view.users} />
            <StatTile label="Groups" value={data.groups?.length ?? 0} />
            <StatTile label="Posts" value={view.posts.length} note={rangeLabel} />
            <StatTile label="Comments" value={view.comments} note={rangeLabel} />
            <StatTile label="Likes" value={view.likes} note={rangeLabel} />
            <StatTile label="Access requests" value={view.accessTotal} note="All time" />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Panel title="Posts over time" note={view.capped ? `Based on the latest ${POST_LIMIT} posts.` : undefined}>
                <ColumnChart points={view.series} ariaLabel={`Posts over time, ${rangeLabel.toLowerCase()}`} empty="No posts in this period." />
              </Panel>
            </div>
            <Panel title="Users by role">
              <BarList rows={view.roles} />
            </Panel>
            <Panel title="Posts by type" note={rangeLabel}>
              <BarList rows={view.byType} empty="No posts in this period." />
            </Panel>
            <Panel title="Access requests by status" note="All time">
              <BarList rows={view.access} />
            </Panel>
            <Panel title="Groups by strand">
              <BarList rows={view.byStrand} />
            </Panel>
          </div>

          {unavailable && (
            <section className={`${glass} p-4 sm:p-5`}>
              <h2 className="text-base font-bold">Not available yet</h2>
              <ul className="mt-2 space-y-1 text-sm text-white/60">
                {!backendSupport.adminDownloads && <li>Downloads: {unsupportedNote.adminDownloads}</li>}
                {!backendSupport.adminActiveUsers && <li>Active users: {unsupportedNote.adminActiveUsers}</li>}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}