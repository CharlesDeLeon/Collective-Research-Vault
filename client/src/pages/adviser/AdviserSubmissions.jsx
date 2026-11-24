import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listSubmissions } from '../../services/adviserService'
import { glass, STATUS_STYLES } from '../../components/dashboard/constants'
import { SearchIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import { timeAgo } from '../../utils/formatDate'

const STAGE_LABELS = { proposal: 'Proposal', defense: 'Defense', final_submission: 'Final Submission' }
const LIMIT = 25

export default function AdviserSubmissions() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, total: count } = await listSubmissions({
        search: search || undefined,
        stage: stageFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      setSubmissions(data)
      setTotal(count)
    } catch (e) {
      console.error(e)
      setError('Failed to load submissions.')
    } finally {
      setLoading(false)
    }
  }, [page, search, stageFilter, statusFilter])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const open = (id) => navigate(`/adviser/reviews/${id}`)

  return (
    <div className="max-w-full min-w-0 space-y-6 sm:space-y-8">
      <header>
        <h1 className="m-0 text-2xl font-bold tracking-tight sm:text-3xl">Review Queue</h1>
        <p className="mb-0 mt-1 text-sm text-white/60">
          {loading ? 'Loading…' : `${total} ${total === 1 ? 'paper' : 'papers'}`} · All submissions in the vault. Review and publish research.
        </p>
      </header>

      <div className={`${glass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="relative block flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title or author…"
              aria-label="Search submissions"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <Select
              aria-label="Filter by stage"
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(1) }}
              className="border-white/15"
            >
              <Option value="">All stages</Option>
              <Option value="proposal">Proposal</Option>
              <Option value="defense">Defense</Option>
              <Option value="final_submission">Final</Option>
            </Select>
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="border-white/15"
            >
              <Option value="">All statuses</Option>
              <Option value="submitted">Under Review</Option>
              <Option value="under_review">Under Review (resubmitted)</Option>
              <Option value="needs_revision">For Revision</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="published">Approved/Vault</Option>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          Nothing waiting for review.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-white/[0.06] text-left text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waiting since</th>
                <th className="px-4 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {submissions.map((s) => (
                <tr key={s.submission_id} className="hover:bg-white/[0.03]">
                  <td className="max-w-xs px-4 py-3 font-medium">
                    <span className="line-clamp-2 wrap-break-word">{s.title}</span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{s.submitted_by_name || '—'}</td>
                  <td className="px-4 py-3 text-white/60">{s.group_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/70 wrap-break-word">{STAGE_LABELS[s.stage] || s.stage || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/70 wrap-break-word">
                      {STATUS_STYLES[s.status]?.label ?? String(s.status ?? '—').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">{timeAgo(s.updated_at) || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => open(s.submission_id)}
                      className="min-h-9 text-xs font-semibold text-gold hover:underline"
                    >
                      {s.status === 'approved' ? 'Review & publish' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-10 rounded-lg border border-white/15 px-4 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 text-sm text-white/60">
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          <button
            type="button"
            disabled={page * LIMIT >= total}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-10 rounded-lg border border-white/15 px-4 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}