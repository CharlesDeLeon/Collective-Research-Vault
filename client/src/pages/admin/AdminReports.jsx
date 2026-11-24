import { useCallback, useEffect, useMemo, useState } from 'react'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import StatTile from '../../components/ui/StatTile'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { loadInsights, POST_LIMIT } from '../../services/adminInsights'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { downloadCsv } from '../../utils/downloadCsv'

const FILTERS = [
  { key: 'strand', label: 'All strands', aria: 'Filter by strand', pick: (g) => g.strand || g.program },
  { key: 'section', label: 'All sections', aria: 'Filter by section', pick: (g) => g.section },
  { key: 'year_level', label: 'All year levels', aria: 'Filter by year level', pick: (g) => g.year_level },
  { key: 'school_year', label: 'All school years', aria: 'Filter by school year', pick: (g) => g.school_year },
]

const EMPTY = { strand: '', section: '', year_level: '', school_year: '', group: '', from: '', to: '' }
const label = (value) => String(value ?? '').replace(/_/g, ' ')
const dateField =
  'h-11 w-full rounded-xl border border-white/20 bg-field px-3 text-sm text-white outline-none focus:border-gold'

function distinct(groups, pick) {
  return [...new Set(groups.map(pick).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function totalsBy(groups, pick) {
  const map = new Map()
  groups.forEach((g) => {
    const key = pick(g) || 'Not set'
    const row = map.get(key) ?? { name: key, groups: 0, members: 0, submissions: 0 }
    row.groups += 1
    row.members += g.member_count ?? 0
    row.submissions += g.submission_count ?? 0
    map.set(key, row)
  })
  return [...map.values()].sort((a, b) => b.submissions - a.submissions || a.name.localeCompare(b.name))
}

function Totals({ title, rows }) {
  return (
    <section className={`${glass} p-4 sm:p-5 print:border-black/30`}>
      <h2 className="text-base font-bold">{title}</h2>
      <ul className="mt-3 divide-y divide-white/10">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-white/85">{r.name}</span>
            <span className="shrink-0 text-white/60">
              {r.groups} {r.groups === 1 ? 'group' : 'groups'} · <span className="font-semibold text-gold">{r.submissions}</span>{' '}
              {r.submissions === 1 ? 'paper' : 'papers'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function AdminReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY)

  const load = useCallback(async () => {
    setData(await loadInsights())
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => load())
  }, [load])

  const groups = useMemo(() => data?.groups ?? [], [data])
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))
  const filtered = Object.values(filters).some(Boolean)

  const view = useMemo(() => {
    const matches = groups.filter((g) => {
      if (filters.group && String(g.group_id) !== filters.group) return false
      return FILTERS.every((f) => !filters[f.key] || String(f.pick(g) ?? '') === filters[f.key])
    })
    const ids = new Set(matches.map((g) => g.group_id))
    const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : 0
    const to = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : Infinity
    const latest = new Map()
    ;(data?.posts ?? []).forEach((p) => {
      const t = new Date(p.createdAt).getTime()
      if (!p.paperId || !ids.has(p.groupId) || t < from || t > to || latest.has(p.paperId)) return
      latest.set(p.paperId, p)
    })
    const statuses = new Map()
    ;[...latest.values()].forEach((p) => {
      const key = p.status || 'unknown'
      statuses.set(key, (statuses.get(key) ?? 0) + 1)
    })
    return {
      matches,
      members: matches.reduce((s, g) => s + (g.member_count ?? 0), 0),
      submissions: matches.reduce((s, g) => s + (g.submission_count ?? 0), 0),
      byStrand: totalsBy(matches, (g) => g.strand || g.program),
      bySchoolYear: totalsBy(matches, (g) => g.school_year),
      statuses: [...statuses].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    }
  }, [groups, data, filters])

  const exportCsv = () => {
    downloadCsv('admin-report.csv', [
      ['Group', 'Strand', 'Section', 'Year level', 'School year', 'Members', 'Papers'],
      ...view.matches.map((g) => [g.group_name, g.strand || g.program, g.section, g.year_level, g.school_year, g.member_count ?? 0, g.submission_count ?? 0]),
      [],
      ['Paper status', 'Count'],
      ...view.statuses.map((s) => [label(s.status), s.count]),
    ])
  }

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-white/60">A snapshot of groups and papers as they are today. Trends are under Analytics.</p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!data}
            className="h-11 flex-1 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white/90 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            Print
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="h-11 flex-1 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            Export CSV
          </button>
        </div>
      </header>

      <h1 className="hidden text-2xl font-bold print:block">Research report</h1>

      <ErrorBanner
        message={data?.failed.length ? `Could not load: ${data.failed.join(', ')}. The report may be incomplete.` : ''}
        onRetry={load}
      />

      {loading || !data ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : (
        <>
          <section aria-label="Filters" className={`${glass} p-4 print:hidden sm:p-5`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FILTERS.map((f) => (
                <Select key={f.key} value={filters[f.key]} onChange={set(f.key)} aria-label={f.aria} className="border-white/20">
                  <Option value="">{f.label}</Option>
                  {distinct(groups, f.pick).map((v) => (
                    <Option key={v} value={v}>
                      {v}
                    </Option>
                  ))}
                </Select>
              ))}
              <Select value={filters.group} onChange={set('group')} aria-label="Filter by group" className="border-white/20">
                <Option value="">All groups</Option>
                {groups.map((g) => (
                  <Option key={g.group_id} value={String(g.group_id)}>
                    {g.group_name}
                  </Option>
                ))}
              </Select>
              <label className="text-xs text-white/55">
                Papers posted from
                <input type="date" value={filters.from} onChange={set('from')} max={filters.to || undefined} className={`${dateField} mt-1`} />
              </label>
              <label className="text-xs text-white/55">
                Papers posted until
                <input type="date" value={filters.to} onChange={set('to')} min={filters.from || undefined} className={`${dateField} mt-1`} />
              </label>
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                disabled={!filtered}
                className="h-11 self-end rounded-xl border border-white/25 px-4 text-sm font-medium text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear filters
              </button>
            </div>
          </section>

          {view.matches.length === 0 ? (
            <div className={`${glass} px-6 py-12 text-center`}>
              <p className="font-semibold">{filtered ? 'No groups match these filters.' : 'No groups yet.'}</p>
              <p className="mt-1 text-sm text-white/60">{filtered ? 'Try clearing a filter.' : 'Once groups are created, the totals show up here.'}</p>
            </div>
          ) : (
            <>
              <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile label="Groups" value={view.matches.length} />
                <StatTile label="Students" value={view.members} />
                <StatTile label="Papers" value={view.submissions} className="col-span-2 sm:col-span-1" />
              </section>

              <div className="grid gap-4 lg:grid-cols-3">
                <Totals title="By strand" rows={view.byStrand} />
                <Totals title="By school year" rows={view.bySchoolYear} />
                <section className={`${glass} p-4 sm:p-5 print:border-black/30`}>
                  <h2 className="text-base font-bold">Paper status</h2>
                  {view.statuses.length === 0 ? (
                    <p className="mt-3 text-sm text-white/55">No paper posts match.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-white/10">
                      {view.statuses.map((s) => (
                        <li key={s.status} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="capitalize text-white/85">{label(s.status)}</span>
                          <span className="font-semibold text-gold">{s.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-white/50">
                    {backendSupport.adminReportStatuses ? '' : unsupportedNote.adminReportStatuses}
                    {data.posts?.length >= POST_LIMIT ? ` Based on the latest ${POST_LIMIT} posts.` : ''}
                  </p>
                </section>
              </div>

              <section className={`${glass} p-4 sm:p-5 print:border-black/30`}>
                <h2 className="text-base font-bold">Groups</h2>
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                        <th scope="col" className="py-3 pr-4 font-semibold">Group</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Strand</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Section</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Year level</th>
                        <th scope="col" className="px-4 py-3 font-semibold">School year</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Students</th>
                        <th scope="col" className="py-3 pl-4 text-right font-semibold">Papers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.matches.map((g) => (
                        <tr key={g.group_id} className="border-b border-white/5 last:border-0">
                          <td className="py-3 pr-4 font-semibold">{g.group_name}</td>
                          <td className="px-4 py-3 text-white/70">{g.strand || g.program || '—'}</td>
                          <td className="px-4 py-3 text-white/70">{g.section || '—'}</td>
                          <td className="px-4 py-3 text-white/70">{g.year_level || '—'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-white/70">{g.school_year || '—'}</td>
                          <td className="px-4 py-3 text-right text-white/70">{g.member_count ?? 0}</td>
                          <td className="py-3 pl-4 text-right text-white/70">{g.submission_count ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-3 divide-y divide-white/10 md:hidden">
                  {view.matches.map((g) => (
                    <li key={g.group_id} className="py-3">
                      <p className="wrap-break-word text-sm font-semibold">{g.group_name}</p>
                      <p className="mt-1 truncate text-xs text-white/55">
                        {[g.strand || g.program, g.section, g.year_level, g.school_year].filter(Boolean).join(' · ') || '—'}
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        {g.member_count ?? 0} {g.member_count === 1 ? 'student' : 'students'} · {g.submission_count ?? 0} {g.submission_count === 1 ? 'paper' : 'papers'}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}