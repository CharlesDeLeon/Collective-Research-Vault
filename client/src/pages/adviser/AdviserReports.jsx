import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import StatTile from '../../components/ui/StatTile'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { timeAgo } from '../../utils/formatDate'

const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
const label = (value) => String(value ?? '').replace(/_/g, ' ')
const day = (value) => (value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

function buildCsv(report) {
  const lines = ['Research output report', '']
  const block = (title, head, rows) => {
    lines.push(title, head.map(cell).join(','))
    rows.forEach((r) => lines.push(r.map(cell).join(',')))
    lines.push('')
  }
  block('By status', ['Status', 'Count'], (report.byStatus ?? []).map((r) => [label(r.status), r.count]))
  block('By strand', ['Strand', 'Count'], (report.byStrand ?? []).map((r) => [r.strand, r.count]))
  block('By school year', ['School year', 'Count'], (report.byYear ?? []).map((r) => [r.school_year, r.count]))
  block(
    'Published papers',
    ['Title', 'Authors', 'Strand', 'Section', 'School year', 'Published'],
    (report.published ?? []).map((p) => [p.title, p.authors, p.strand, p.section, p.school_year, p.published_at])
  )
  return lines.join('\r\n')
}

function Breakdown({ title, rows, name }) {
  return (
    <section className={`${glass} p-4 sm:p-5`}>
      <h2 className="text-base font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">Nothing yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {rows.map((r, i) => (
            <li key={`${name(r)}-${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate capitalize text-white/85">{name(r) || '—'}</span>
              <span className="font-semibold text-gold">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function AdviserReports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/coordinator/submissions/reports')
      setReport(res.data?.data ?? null)
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load the report.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = () => {
    const blob = new Blob(['﻿', buildCsv(report)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'research-outputs-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const published = report?.published ?? []
  const accessTotal = (report?.accessStats ?? []).reduce((sum, r) => sum + Number(r.count), 0)

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-white/60">Research submissions and published papers from your groups.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!report}
          className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export CSV
        </button>
      </header>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : report ? (
        <>
          <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Submissions" value={report.totalSubmissions ?? 0} />
            <StatTile label="Published" value={report.totalPublished ?? 0} />
            <StatTile label="Access requests" value={accessTotal} className="col-span-2 sm:col-span-1" />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Breakdown title="By status" rows={report.byStatus ?? []} name={(r) => label(r.status)} />
            <Breakdown title="By strand" rows={report.byStrand ?? []} name={(r) => r.strand} />
            <Breakdown title="By school year" rows={report.byYear ?? []} name={(r) => r.school_year} />
          </div>

          <section className={`${glass} p-4 sm:p-5`}>
            <h2 className="text-base font-bold">Published papers</h2>
            {published.length === 0 ? (
              <p className="mt-3 text-sm text-white/55">No published papers yet.</p>
            ) : (
              <>
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                        <th scope="col" className="py-3 pr-4 font-semibold">Title</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Authors</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Strand</th>
                        <th scope="col" className="px-4 py-3 font-semibold">School year</th>
                        <th scope="col" className="py-3 pl-4 font-semibold">Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {published.map((p) => (
                        <tr key={p.submission_id} className="border-b border-white/5 last:border-0">
                          <td className="max-w-xs py-3 pr-4 font-semibold"><span className="line-clamp-2 wrap-break-word">{p.title}</span></td>
                          <td className="px-4 py-3 text-white/70">{p.authors || '—'}</td>
                          <td className="px-4 py-3 text-white/70">{p.strand || '—'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-white/70">{p.school_year || '—'}</td>
                          <td className="whitespace-nowrap py-3 pl-4 text-white/70">{day(p.published_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-3 divide-y divide-white/10 md:hidden">
                  {published.map((p) => (
                    <li key={p.submission_id} className="py-3">
                      <p className="wrap-break-word text-sm font-semibold">{p.title}</p>
                      <p className="mt-1 text-xs text-white/55">{p.authors || '—'}</p>
                      <p className="mt-1 text-xs text-white/55">
                        {[p.strand, p.section, p.school_year].filter(Boolean).join(' · ')} · {p.published_at ? timeAgo(p.published_at) : '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      ) : (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">No report data yet.</p>
            <p className="mt-1 text-sm text-white/60">Once your groups submit papers, the totals show up here.</p>
          </div>
        )
      )}
    </div>
  )
}