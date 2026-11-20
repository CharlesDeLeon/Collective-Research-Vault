import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { CheckIcon, CloseIcon, DocIcon, PlusIcon, SearchIcon } from '../../components/dashboard/icons'
import StatusPill from '../../components/dashboard/StatusPill'
import ResubmitModal from "../../components/paper/ResubmitModal";
import { getMyPapers, resubmitPaper } from '../../services/paperService'
import { canEdit, canResubmit, normalizeStatus } from '../../utils/paperRules'
import { timeAgo } from '../../utils/formatDate'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'for_revision', label: 'For Revision' },
  { key: 'approved', label: 'Approved' },
  { key: 'published', label: 'Approved/Vault' },
]

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] items-stretch gap-4 sm:gap-5'

const secondary =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 hover:bg-white/10'

function PaperRow({ paper, onResubmit }) {
  return (
    <article className={`${glass} flex flex-col p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <StatusPill status={paper.status} />
        <span className="text-xs text-white/50">Updated {timeAgo(paper.updatedAt)}</span>
      </div>
      <h3 className="mb-0 mt-4 wrap-break-word text-base font-semibold leading-snug sm:text-lg">{paper.title}</h3>
      <p className="mb-0 mt-2 truncate text-xs text-white/60">
        {[paper.groupName, paper.strand, paper.section].filter(Boolean).join(' · ')}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <Link to={ROUTES.paper(paper.id)} className={secondary}>
            View
          </Link>
          {canEdit(paper.status) && (
            <Link to={ROUTES.editPaper(paper.id)} className={secondary}>
              Edit
            </Link>
          )}
          {canResubmit(paper.status) && (
            <button
              type="button"
              onClick={() => onResubmit(paper)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-linear-to-br/srgb from-gold to-gold-soft px-4 text-sm font-semibold text-ink hover:brightness-105"
            >
              Resubmit for Review
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function MyPapers() {
  const location = useLocation()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState(location.state?.notice ?? '')
  const [resubmitting, setResubmitting] = useState(null)

  useEffect(() => {
    let live = true
    getMyPapers()
      .then((rows) => {
        if (live) setPapers(rows)
      })
      .catch(() => {
        if (live) setError(true)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [])

  const counts = useMemo(() => {
    const out = { all: papers.length }
    papers.forEach((p) => {
      const key = normalizeStatus(p.status)
      out[key] = (out[key] ?? 0) + 1
    })
    return out
  }, [papers])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return papers.filter(
      (p) =>
        (filter === 'all' || normalizeStatus(p.status) === filter) &&
        (!q || p.title.toLowerCase().includes(q))
    )
  }, [papers, query, filter])

  const confirmResubmit = async (paper) => {
    const data = await resubmitPaper(paper.id)
    const next = { ...paper, status: data.status ?? paper.status }
    setPapers((list) => list.map((p) => (p.id === next.id ? next : p)))
    setResubmitting(null)
    setNotice('Sent to your adviser for review.')
  }

  return (
    <div className="space-y-6 font-display">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-3xl font-bold">My Papers</h1>
        <Link
          to={ROUTES.upload}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink hover:brightness-105"
        >
          <PlusIcon className="size-4" />
          New paper
        </Link>
      </header>

      {notice && (
        <p
          role="status"
          className="m-0 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-2 pl-4 pr-2 text-sm text-emerald-200"
        >
          <span className="flex items-center gap-2">
            <CheckIcon className="size-4" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss"
            className="grid size-9 place-items-center rounded-lg hover:bg-white/10"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </p>
      )}

      <div className="space-y-4">
        <label className="flex h-11 max-w-xl items-center gap-3 rounded-full border border-white/25 bg-white/5 px-4 focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20">
          <SearchIcon className="size-4 shrink-0 text-white/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your papers"
            aria-label="Search your papers"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/70"
          />
        </label>
        <div role="group" aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.filter((f) => f.key === 'all' || counts[f.key]).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium ${
                filter === f.key
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/20 text-white/75 hover:bg-white/5'
              }`}
            >
              {f.label}
              <span className="text-xs opacity-70">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="m-0 text-sm text-danger-ink">
          Could not load your papers. Refresh the page to try again.
        </p>
      ) : loading ? (
        <div className={GRID}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 px-6 py-12 text-center">
          <DocIcon className="mx-auto size-8 text-white/50" />
          <p className="mb-0 mt-3 text-lg font-semibold">You haven’t submitted a paper yet</p>
          <p className="mb-0 mt-1 text-sm text-white/70">Start with your proposal. Your adviser will review it.</p>
          <Link
            to={ROUTES.upload}
            className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-7 text-base font-semibold text-ink"
          >
            New paper
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="m-0 rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/70">
          No papers match your search.
        </p>
      ) : (
        <div className={GRID}>
          {visible.map((p) => (
            <PaperRow key={p.id} paper={p} onResubmit={setResubmitting} />
          ))}
        </div>
      )}

      {resubmitting && (
        <ResubmitModal paper={resubmitting} onConfirm={confirmResubmit} onClose={() => setResubmitting(null)} />
      )}
    </div>
  )
}