import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPanelistPapers } from '../../services/panelistService'
import { glass } from '../../components/dashboard/constants'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatusPill from '../../components/dashboard/StatusPill'
import { normalizeStatus } from '../../utils/paperRules'

export default function PanelistPapers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setPapers(await listPanelistPapers())
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load papers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Student papers</h1>
        <p className="mt-1 text-sm text-white/60">
          Read-only metadata for every student paper. Use Request access to view the full file.
        </p>
      </header>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className={`${glass} px-6 py-10 text-center text-sm text-white/60`}>
          No student papers yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {papers.map((p) => (
            <li key={p.id} className={`${glass} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="wrap-break-word text-lg font-bold">{p.title}</h2>
                  <p className="mt-1 text-xs text-white/55">
                    {p.authors?.join(', ') || 'Unknown author'}
                    {p.groupName ? ` · ${p.groupName}` : ''}
                    {p.schoolYear ? ` · ${p.schoolYear}` : ''}
                  </p>
                  {p.abstract && (
                    <p className="mt-3 line-clamp-3 text-sm text-white/70">{p.abstract}</p>
                  )}
                  {p.keywords?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.keywords.map((k) => (
                        <span key={k} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{k}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {p.status && <StatusPill status={normalizeStatus(p.status)} />}
                  {p.slug ? (
                    <Link
                      to={`/paper/${p.slug}`}
                      className="rounded-xl bg-gold px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90"
                    >
                      View / Request access
                    </Link>
                  ) : (
                    <span className="text-xs text-white/40">Not published</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
