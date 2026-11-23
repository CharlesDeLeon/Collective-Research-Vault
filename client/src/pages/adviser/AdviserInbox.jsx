<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from 'react'
import { listAccessRequests, getAccessRequest, approveAccessRequest, declineAccessRequest, revokeAccessLink } from '../../services/accessService'
=======
import { useCallback, useEffect, useRef, useState } from 'react'
import useToast from '../../context/useToast'
import {
  listAccessRequests,
  getAccessRequest,
  approveAccessRequest,
  declineAccessRequest,
  revokeAccessLink,
} from '../../services/accessService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
>>>>>>> a54d3d019bb812bfc4cbca39ff2c5a8d70ddfd4c
import { glass } from '../../components/dashboard/constants'
import { SearchIcon, BellIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ModalShell from '../../components/ui/ModalShell'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatTile from '../../components/ui/StatTile'
import Pager from '../../components/admin/Pager'
import useDebouncedValue from '../../hooks/useDebouncedValue'

const LIMIT = 25
const COUNTED = ['pending', 'approved', 'declined', 'accessed']

const STATUS_CLS = {
  pending: 'border-warn/40 bg-warn/10 text-warn-ink',
  approved: 'border-success/40 bg-success/10 text-success-ink',
  declined: 'border-danger/40 bg-danger/10 text-danger-ink',
  accessed: 'border-info/40 bg-info/10 text-info-ink',
  expired: 'border-white/15 bg-white/5 text-white/55',
}

const when = (value) => (value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
const whenFull = (value) => (value ? new Date(value).toLocaleString() : '—')

const btn = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const ghost = `${btn} border-white/15 text-white/75 enabled:hover:bg-white/10 enabled:hover:text-white`

function StatusChip({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_CLS[status] ?? STATUS_CLS.expired}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  )
}

function linkState(link) {
  if (link.revoked_at) return ['Revoked', STATUS_CLS.declined]
  if (link.used_at) return ['Used', STATUS_CLS.accessed]
  if (new Date(link.expires_at) < new Date()) return ['Expired', STATUS_CLS.expired]
  return ['Active', STATUS_CLS.approved]
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-white/55">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-white/90">{children}</dd>
    </div>
  )
}

function RequestModal({ id, onChanged, onClose }) {
  const { toast } = useToast()
  const [detail, setDetail] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [issued, setIssued] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      setDetail(await getAccessRequest(id))
    } catch {
      setLoadError('Could not load this request.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (kind) => {
    setConfirm(null)
    setActing(true)
    setActionError('')
    try {
      if (kind === 'approve') {
        const res = await approveAccessRequest(detail.request_id, note)
        setIssued(res)
        toast('Request approved.')
      } else {
        await declineAccessRequest(detail.request_id, note)
        toast('Request declined.')
      }
      await load()
      onChanged()
    } catch (e) {
      setActionError(e.response?.data?.message || 'That did not work. Try again.')
    } finally {
      setActing(false)
    }
  }

  const revoke = async (linkId) => {
    setConfirm(null)
    try {
      await revokeAccessLink(linkId)
      toast('Link revoked.')
      await load()
      onChanged()
    } catch (e) {
      setActionError(e.response?.data?.message || 'Could not revoke the link.')
    }
  }

  const url = issued?.token ? `${window.location.origin}/access/${issued.token}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied.')
    } catch {
      toast('Could not copy. Select the link and copy it by hand.', 'error')
    }
  }

  return (
    <>
      <ModalShell title="Access request" icon={BellIcon} onClose={onClose}>
        <div className="mt-4 max-h-[75dvh] space-y-5 overflow-y-auto px-1 pb-1">
          {loadError && <ErrorBanner message={loadError} onRetry={load} />}
          {!detail && !loadError && <div className="h-40 animate-pulse rounded-xl bg-white/5" aria-busy="true" />}
          {detail && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="wrap-break-word text-base font-bold">{detail.paper_title}</p>
                <StatusChip status={detail.status} />
              </div>
              <dl className="divide-y divide-white/10">
                <Row label="Requester">{detail.name}</Row>
                <Row label="Email">{detail.email}</Row>
                <Row label="Institution">{detail.institution || '—'}</Row>
                <Row label="Group">{detail.group_name || '—'}</Row>
                <Row label="Reference"><span className="font-mono text-gold">{detail.reference_code}</span></Row>
                <Row label="Requested">{whenFull(detail.created_at)}</Row>
              </dl>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gold">Purpose</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-white/80">{detail.purpose || '—'}</p>
              </div>

              {actionError && <ErrorBanner message={actionError} />}

              {['pending', 'verified'].includes(detail.status) ? (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-gold">Note to the requester (optional)</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-navy-900/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                      placeholder="Reason for approving or declining"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'decline' })}
                      disabled={acting}
                      className="h-11 rounded-xl border border-danger bg-danger/15 text-sm font-semibold text-danger-ink transition enabled:hover:bg-danger/25 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => decide('approve')}
                      disabled={acting}
                      className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:opacity-50"
                    >
                      {acting ? 'Working…' : 'Approve'}
                    </button>
                  </div>
                </div>
              ) : (
                detail.decision_note && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gold">Your note</h3>
                    <p className="mt-2 text-sm text-white/80">{detail.decision_note}</p>
                  </div>
                )
              )}

              {url && (
                <div className="space-y-2 rounded-xl border border-success/40 bg-success/10 p-4">
                  <p className="text-sm font-semibold text-success-ink">Link ready. It works once and expires in 72 hours.</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={url}
                      aria-label="Access link"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-white/20 bg-navy-900/60 px-3 text-xs text-white outline-none"
                    />
                    <button type="button" onClick={copy} className={`${ghost} h-10 px-4`}>
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-white/55">Copy this link and send it to the requester yourself. Email delivery is not confirmed automatically.</p>
                </div>
              )}

              {detail.links?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gold">Links</h3>
                  <ul className="mt-2 space-y-2">
                    {detail.links.map((l) => {
                      const [label, cls] = linkState(l)
                      return (
                        <li key={l.link_id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-white/70">#{l.link_id}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold ${cls}`}>{label}</span>
                          </div>
                          <p className="mt-1 text-white/55">
                            Expires {whenFull(l.expires_at)}
                            {l.used_at ? ` · Used ${whenFull(l.used_at)}` : ''}
                          </p>
                          {label === 'Active' && (
                            <button type="button" onClick={() => setConfirm({ kind: 'revoke', id: l.link_id })} className="mt-2 font-semibold text-danger-ink hover:underline">
                              Revoke link
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </ModalShell>

      {confirm?.kind === 'decline' && (
        <ConfirmModal
          title="Decline request"
          message="The request will be declined. The requester may not be notified automatically. This cannot be undone."
          confirmLabel="Decline"
          danger
          onConfirm={() => decide('decline')}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === 'revoke' && (
        <ConfirmModal
          title="Revoke link"
          message="The link will stop working right away. The requester will need a new approval."
          confirmLabel="Revoke"
          danger
          onConfirm={() => revoke(confirm.id)}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}

export default function AdviserInbox() {
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)
  const requestId = useRef(0)
  const debounced = useDebouncedValue(search.trim())

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await listAccessRequests({ status: status || undefined, search: debounced || undefined, page, limit: LIMIT })
      if (id !== requestId.current) return
      setRequests(result.data)
      setCounts(result.counts)
    } catch (e) {
      if (id !== requestId.current) return
      setError(e.response?.data?.message || 'Could not load access requests.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [status, debounced, page])

  useEffect(() => {
    load()
  }, [load])

<<<<<<< HEAD
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
=======
  const filtered = Boolean(status || search)
  const clear = () => {
    setStatus('')
    setSearch('')
    setPage(1)
>>>>>>> a54d3d019bb812bfc4cbca39ff2c5a8d70ddfd4c
  }
  const pick = (s) => {
    setStatus((cur) => (cur === s ? '' : s))
    setPage(1)
  }
<<<<<<< HEAD

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
=======
  const from = requests.length === 0 ? 0 : (page - 1) * LIMIT + 1
  const to = (page - 1) * LIMIT + requests.length
>>>>>>> a54d3d019bb812bfc4cbca39ff2c5a8d70ddfd4c

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Access Inbox</h1>
        <p className="mt-1 text-sm text-white/60">People asking for the full text of a paper in the vault. Any adviser can approve or decline a request and share the link.</p>
      </header>

      <section aria-label="Requests by status" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {COUNTED.map((s) => (
          <StatTile key={s} label={s} value={counts[s] ?? 0} onClick={() => pick(s)} active={status === s} />
        ))}
        <StatTile
          label="expired"
          value={backendSupport.adviserExpiredCount ? (counts.expired ?? 0) : '—'}
          note={!backendSupport.adviserExpiredCount ? 'Not counted yet' : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </section>
      {!backendSupport.adviserExpiredCount && <p className="-mt-3 text-xs text-white/50">{unsupportedNote.adviserExpiredCount}</p>}

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search requests</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by requester, paper or purpose"
              className="h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
          </label>
          <div className="-mt-1">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="border-white/20"
            >
              <Option value="">All statuses</Option>
              {COUNTED.map((s) => (
                <Option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Option>
              ))}
            </Select>
          </div>
          <button type="button" onClick={clear} disabled={!filtered} className={`${ghost} h-11 px-4 text-sm`}>
            Clear filters
          </button>
        </div>
      </section>

      <ErrorBanner message={error} onRetry={load} />

      {loading && requests.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{filtered ? 'No requests match these filters.' : 'No access requests yet.'}</p>
            <p className="mt-1 text-sm text-white/60">{filtered ? 'Try a different search or clear the filters.' : 'Requests from the public gallery will show up here.'}</p>
          </div>
        )
      ) : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Requester</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Paper</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Group</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Requested</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-white/55">{r.email}</p>
                    </td>
                    <td className="max-w-xs px-5 py-3"><span className="line-clamp-2 wrap-break-word">{r.paper_title}</span></td>
                    <td className="px-5 py-3 text-white/70">{r.group_name || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/70">{when(r.created_at)}</td>
                    <td className="px-5 py-3"><StatusChip status={r.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => setOpenId(r.request_id)} className={ghost}>
                        {r.status === 'pending' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
            {requests.map((r) => (
              <li key={r.request_id} className={`${glass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-white/55">{r.email}</p>
                  </div>
                  <StatusChip status={r.status} />
                </div>
                <p className="mt-3 line-clamp-2 wrap-break-word text-sm">{r.paper_title}</p>
                <p className="mt-1 text-xs text-white/55">{[r.group_name, when(r.created_at)].filter(Boolean).join(' · ')}</p>
                <button type="button" onClick={() => setOpenId(r.request_id)} className={`${ghost} mt-3`}>
                  {r.status === 'pending' ? 'Review' : 'View'}
                </button>
              </li>
            ))}
          </ul>

          {(page > 1 || requests.length === LIMIT) && (
            <Pager page={page} hasNext={requests.length === LIMIT} onPage={setPage} summary={`Showing ${from}–${to}`} />
          )}
        </>
      )}

      {openId && <RequestModal id={openId} onChanged={load} onClose={() => setOpenId(null)} />}
    </div>
  )
}