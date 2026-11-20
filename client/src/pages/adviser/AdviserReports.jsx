import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'

export default function AdviserReports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/submissions/reports')
      setReport(res.data?.data || null)
    } catch (e) {
      console.error(e)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport() }, [fetchReport])

  const exportCsv = () => {
    if (!report) return
    const lines = []
    lines.push('Research Output Report')
    lines.push('')
    lines.push('By Status')
    lines.push('Status,Count')
    for (const r of report.byStatus || []) lines.push(`${r.status},${r.count}`)
    lines.push('')
    lines.push('By Strand')
    lines.push('Strand,Count')
    for (const r of report.byStrand || []) lines.push(`${r.strand},${r.count}`)
    lines.push('')
    lines.push('By School Year')
    lines.push('School Year,Count')
    for (const r of report.byYear || []) lines.push(`${r.school_year},${r.count}`)
    lines.push('')
    lines.push('Published Papers')
    lines.push('Title,Authors,Strand,Section,School Year,Published At')
    for (const p of report.published || []) {
      lines.push(`"${p.title}","${p.authors || ''}",${p.strand || ''},${p.section || ''},${p.school_year || ''},${p.published_at || ''}`)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'research-outputs-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports on Research Outputs</h1>
          <p className="text-sm text-white/60">Summary of research submissions and published papers.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!report}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
        >
          Export CSV
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`${glass} p-5`}>
              <div className="text-3xl font-bold text-gold">{report.totalSubmissions}</div>
              <div className="mt-1 text-sm text-white/60">Total submissions</div>
            </div>
            <div className={`${glass} p-5`}>
              <div className="text-3xl font-bold text-gold">{report.totalPublished}</div>
              <div className="mt-1 text-sm text-white/60">Published papers</div>
            </div>
            <div className={`${glass} p-5`}>
              <div className="text-3xl font-bold text-gold">{report.accessStats?.reduce((a, b) => a + b.count, 0) ?? 0}</div>
              <div className="mt-1 text-sm text-white/60">Access requests</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className={`${glass} p-5`}>
              <h2 className="mb-3 text-lg font-bold">By status</h2>
              <ul className="space-y-2">
                {(report.byStatus || []).map((r) => (
                  <li key={r.status} className="flex justify-between text-sm">
                    <span className="capitalize text-white/80">{String(r.status).replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${glass} p-5`}>
              <h2 className="mb-3 text-lg font-bold">By strand</h2>
              <ul className="space-y-2">
                {(report.byStrand || []).map((r) => (
                  <li key={r.strand} className="flex justify-between text-sm">
                    <span className="text-white/80">{r.strand || '—'}</span>
                    <span className="font-semibold text-gold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${glass} p-5`}>
              <h2 className="mb-3 text-lg font-bold">By school year</h2>
              <ul className="space-y-2">
                {(report.byYear || []).map((r) => (
                  <li key={r.school_year} className="flex justify-between text-sm">
                    <span className="text-white/80">{r.school_year || '—'}</span>
                    <span className="font-semibold text-gold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-4 text-lg font-bold">Published papers</h2>
            {report.published?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.06] text-left text-xs uppercase tracking-wide text-white/60">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Authors</th>
                      <th className="px-3 py-2">Strand</th>
                      <th className="px-3 py-2">Section</th>
                      <th className="px-3 py-2">School year</th>
                      <th className="px-3 py-2">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {report.published.map((p) => (
                      <tr key={p.submission_id}>
                        <td className="px-3 py-2 font-medium">{p.title}</td>
                        <td className="px-3 py-2 text-white/60">{p.authors}</td>
                        <td className="px-3 py-2 text-white/60">{p.strand || '—'}</td>
                        <td className="px-3 py-2 text-white/60">{p.section || '—'}</td>
                        <td className="px-3 py-2 text-white/60">{p.school_year || '—'}</td>
                        <td className="px-3 py-2 text-white/50 text-xs">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-white/50">No published papers yet.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}