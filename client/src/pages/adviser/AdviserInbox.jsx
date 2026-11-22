import React, { useEffect, useState, useCallback } from 'react'
import { listAccessRequests, getAccessRequest, approveAccessRequest, declineAccessRequest, revokeAccessLink } from '../../services/accessService'
import { glass } from '../../components/dashboard/constants'
import { BellIcon, CheckIcon, CloseIcon, SearchIcon } from '../../components/dashboard/icons'

const STATUS_CLS = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-rose-500/20 text-rose-300',
  accessed: 'bg-sky-500/20 text-sky-300',
  expired: 'bg-white/10 text-white/50',
}

export default function AdviserInbox() {
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 25

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [generatedLink, setGeneratedLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, counts: c } = await listAccessRequests({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit,
      })
      setRequests(data)
      setCounts(c)
      setTotal(data.length)
    } catch (e) {
      console.error(e)
      setError('Failed to load access requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page, limit])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const openDetail = async (id) => {
    setDetailLoading(true)
    setActionError(null)
    setGeneratedLink(null)
    setNote('')
    try {
      const d = await getAccessRequest(id)
      setDetail(d)
    } catch {
      setError('Failed to load request detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setGeneratedLink(null)
    setNote('')
    setActionError(null)
  }

  const handleApprove = async () => {
    if (!detail) return
    setActing(true)
    setActionError(null)
    try {
      const res = await approveAccessRequest(detail.request_id, note)
      setGeneratedLink(res)
      setDetail((d) => (d ? { ...d, status: 'approved' } : d))
      fetchRequests()
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to approve')
    } finally {
      setActing(false)
    }
  }

  const handleDecline = async () => {
    if (!detail) return
    setActing(true)
    setActionError(null)
    try {
      await declineAccessRequest(detail.request_id, note)
      setDetail((d) => (d ? { ...d, status: 'declined' } : d))
      fetchRequests()
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to decline')
    } finally {
      setActing(false)
    }
  }

  const handleRevoke = async (linkId) => {
    if (!window.confirm('Revoke this access link?')) return
    try {
      await revokeAccessLink(linkId)
      const d = await getAccessRequest(detail.request_id)
      setDetail(d)
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to revoke')
    }
  }

  const copyLink = async () => {
    if (!generatedLink?.token) return
    const url = `${window.location.origin}/access/${generatedLink.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Access Inbox</h1>
          <p className="text-sm text-white/60">Review and approve requests for full-paper access.</p>
        </div>
      </header>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {['pending', 'approved', 'declined', 'accessed'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1) }}
            className={`${glass} p-4 text-left transition ${statusFilter === s ? 'border-gold/50' : 'hover:border-white/20'}`}
          >
            <div className="text-2xl font-bold text-gold">{counts[s] ?? 0}</div>
            <div className="mt-1 text-xs font-medium capitalize text-white/60">{s.replace(/_/g, ' ')}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={`${glass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by requester, paper, or purpose…"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-gold/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-gold/50"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="accessed">Accessed</option>
          </select>
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
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          No access requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.06] text-left text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Paper</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map((r) => (
                <tr key={r.request_id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-white/50">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-medium">{r.paper_title}</div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{r.group_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-white/50">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status] || 'bg-white/10 text-white/60'}`}>
                      {String(r.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(r.request_id)}
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
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-white/60">Page {page}</span>
          <button type="button" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Detail panel */}
      {detail && (
        <div className={`${glass} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Request detail</h2>
            <button type="button" onClick={closeDetail} className="text-sm text-white/60 hover:text-white">
              Close
            </button>
          </div>

          {detailLoading ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Requester</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2"><dt className="text-white/50">Name</dt><dd>{detail.name}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-white/50">Email</dt><dd>{detail.email}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-white/50">Institution</dt><dd>{detail.institution || '—'}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-white/50">Reference</dt><dd className="font-mono text-gold">{detail.reference_code}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-white/50">Requested</dt><dd>{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</dd></div>
                  </dl>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Purpose</h3>
                  <p className="text-sm text-white/80 whitespace-pre-line">{detail.purpose || '—'}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Paper</h3>
                  <div className={`${glass} p-3`}>
                    <p className="m-0 font-medium">{detail.paper_title}</p>
                    <p className="m-0 mt-1 text-xs text-white/50">{detail.group_name || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Decision</h3>

                {actionError && (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {actionError}
                  </p>
                )}

                {detail.status === 'pending' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white/70">Decision note (optional)</span>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                        placeholder="Reason for approval or decline…"
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={acting}
                        className="flex-1 h-11 rounded-xl bg-emerald-500/20 text-sm font-semibold text-emerald-300 border border-emerald-400/30 transition hover:bg-emerald-500/30 disabled:opacity-60"
                      >
                        {acting ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDecline}
                        disabled={acting}
                        className="flex-1 h-11 rounded-xl bg-rose-500/20 text-sm font-semibold text-rose-300 border border-rose-400/30 transition hover:bg-rose-500/30 disabled:opacity-60"
                      >
                        {acting ? 'Working…' : 'Decline'}
                      </button>
                    </div>
                  </>
                )}

                {detail.status !== 'pending' && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <p className="m-0 font-medium capitalize">{detail.status}</p>
                    {detail.decision_note && (
                      <p className="mb-0 mt-1 text-white/60">{detail.decision_note}</p>
                    )}
                  </div>
                )}

                {/* Generated link (after approval) */}
                {generatedLink?.token && (
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                    <p className="m-0 text-sm font-semibold text-emerald-300">Access link generated (72h, single-use)</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={`${window.location.origin}/access/${generatedLink.token}`}
                        className="h-10 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={copyLink}
                        className="h-10 rounded-lg bg-gold/20 px-3 text-xs font-semibold text-gold transition hover:bg-gold/30"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="mb-0 mt-2 text-xs text-white/50">
                      Share this link with the requester. It can be used once and expires in 72 hours. Email delivery is not yet configured.
                    </p>
                  </div>
                )}

                {/* Link status */}
                {detail.links?.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Links</h3>
                    <ul className="space-y-2">
                      {detail.links.map((l) => (
                        <li key={l.link_id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-white/70">#{l.link_id}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                              l.revoked_at ? 'bg-rose-500/20 text-rose-300' :
                              l.used_at ? 'bg-sky-500/20 text-sky-300' :
                              new Date(l.expires_at) < new Date() ? 'bg-white/10 text-white/50' :
                              'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {l.revoked_at ? 'Revoked' : l.used_at ? 'Used' : new Date(l.expires_at) < new Date() ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <div className="mt-1 text-white/50">
                            Expires: {new Date(l.expires_at).toLocaleString()}
                            {l.used_at && ` · Used: ${new Date(l.used_at).toLocaleString()}`}
                          </div>
                          {!l.revoked_at && !l.used_at && new Date(l.expires_at) >= new Date() && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(l.link_id)}
                              className="mt-2 text-xs font-semibold text-rose-300 hover:underline"
                            >
                              Revoke link
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}