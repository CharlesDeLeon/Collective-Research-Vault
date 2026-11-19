import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import { DocIcon, SearchIcon, ChevronDownIcon } from '../../components/dashboard/icons'
import { getFileDownloadUrl } from '../../utils/helpers'

const STAGE_LABELS = { proposal: 'Proposal', defense: 'Defense', final_submission: 'Final Submission' }
const STATUS_CLS = {
  submitted: 'bg-sky-500/20 text-sky-300',
  under_review: 'bg-violet-500/20 text-violet-300',
  needs_revision: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-rose-500/20 text-rose-300',
  published: 'bg-emerald-500/20 text-emerald-300',
}

export default function AdviserSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [newStage, setNewStage] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/submissions', {
        params: { search: search || undefined, stage: stageFilter || undefined, status: statusFilter || undefined, page, limit },
      })
      setSubmissions(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, stageFilter, statusFilter])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const openDetail = async (id) => {
    setDetailLoading(true)
    setUpdateError(null)
    try {
      const res = await api.get(`/coordinator/submissions/${id}`)
      const d = res.data.data
      setDetail(d)
      setNewStage(d.stage)
      setNewStatus(d.status)
    } catch (e) {
      setError('Failed to load submission detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!detail) return
    if (newStage === detail.stage && newStatus === detail.status) return
    setUpdating(true)
    setUpdateError(null)
    try {
      if (newStage !== detail.stage) {
        await api.patch(`/coordinator/submissions/${detail.submission_id}/stage`, { stage: newStage })
      }
      if (newStatus !== detail.status) {
        await api.patch(`/coordinator/submissions/${detail.submission_id}/status`, { status: newStatus })
      }
      openDetail(detail.submission_id)
      fetchSubmissions()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setUpdateError(null)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Submissions</h1>
          <p className="text-sm text-white/60">Review and manage research submissions across your groups.</p>
        </div>
      </header>

      <div className={`${glass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title…"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(1) }}
              className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-gold/50"
            >
              <option value="">All stages</option>
              <option value="proposal">Proposal</option>
              <option value="defense">Defense</option>
              <option value="final_submission">Final</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-gold/50"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="published">Published</option>
            </select>
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
          No submissions found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.06] text-left text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {submissions.map((s) => (
                <tr key={s.submission_id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-white/60">{s.group_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                      {STAGE_LABELS[s.stage] || s.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[s.status] || 'bg-white/10 text-white/60'}`}>
                      {String(s.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(s.submission_id)}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-white/60">Page {page}</span>
          <button
            type="button"
            disabled={page * limit >= total}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail panel */}
      {detail && (
        <div className={`${glass} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{detail.title}</h2>
            <button type="button" onClick={closeDetail} className="text-sm text-white/60 hover:text-white">
              Close
            </button>
          </div>

          {detailLoading ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Abstract</h3>
                  <p className="text-sm text-white/80">{detail.abstract || 'No abstract.'}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Metadata</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-white/50">Group</dt><dd>{detail.group_name || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-white/50">Stage</dt><dd>{STAGE_LABELS[detail.stage] || detail.stage}</dd></div>
                    <div className="flex justify-between"><dt className="text-white/50">Status</dt><dd>{String(detail.status).replace(/_/g, ' ')}</dd></div>
                    <div className="flex justify-between"><dt className="text-white/50">Authors</dt><dd>{detail.authors || '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-white/50">Keywords</dt><dd>{detail.keywords || '—'}</dd></div>
                  </dl>
                </div>
                {detail.file_path && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">File</h3>
                    <a
                      href={getFileDownloadUrl(detail.file_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-gold hover:border-gold/40"
                    >
                      Download paper
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Adviser actions</h3>
                {updateError && (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {updateError}
                  </p>
                )}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-white/70">Stage</span>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                  >
                    <option value="proposal">Proposal</option>
                    <option value="defense">Defense</option>
                    <option value="final_submission">Final Submission</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-white/70">Status</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating || (newStage === detail.stage && newStatus === detail.status)}
                  className="h-11 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
                >
                  {updating ? 'Updating…' : 'Update stage & status'}
                </button>

                <div className="mt-2 rounded-lg border border-dashed border-white/20 p-3 text-xs text-white/50">
                  Publish flow, author consent, final/defended file upload, and access inbox are coming in the next slice.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}