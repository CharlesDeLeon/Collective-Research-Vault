import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { glass } from '../../components/dashboard/constants'
import { DocIcon, ExternalLinkIcon } from '../../components/dashboard/icons'
import { listMyAccessRequests, consumeMyAccessRequest } from '../../services/studentAccessService'
import { longDate } from '../../utils/formatDate'

const STATUS_CLS = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-rose-500/20 text-rose-300',
  accessed: 'bg-sky-500/20 text-sky-300',
}

export default function MyAccess() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewing, setViewing] = useState(null) // { paperSlug, fileUrl, state }
  const [busy, setBusy] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await listMyAccessRequests())
    } catch (e) {
      console.error(e)
      setError('Failed to load your access requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleView = async (req) => {
    setBusy(true)
    try {
      const res = await consumeMyAccessRequest(req.request_id)
      if (res.state === 'success') {
        setViewing({ paperSlug: res.paperSlug, fileUrl: res.fileUrl, title: req.paper_title })
      } else if (res.state === 'used') {
        // already used — try to show cached? No, single-use. Show message.
        alert('This access link has already been used. Request a new one if needed.')
      } else if (res.state === 'expired') {
        alert('This access link has expired. Request a new one.')
      } else if (res.state === 'revoked') {
        alert('This access link has been revoked.')
      } else if (res.state === 'pending') {
        alert('Your request is still pending approval.')
      } else {
        alert('Unable to access this paper.')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to access paper.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Access</h1>
        <p className="text-sm text-white/60">Papers you've requested and your granted access.</p>
      </header>

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
          You haven't requested access to any papers yet. Browse the{' '}
          <a href="/gallery" className="font-semibold text-gold hover:underline">gallery</a> to find research.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.request_id} className={`${glass} p-4 sm:p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-medium">{r.paper_title}</p>
                  <p className="m-0 mt-1 text-xs text-white/50">
                    {r.group_name || '—'} · Requested {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                  </p>
                  {r.decision_note && (
                    <p className="m-0 mt-1 text-xs text-white/60">Note: {r.decision_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status] || 'bg-white/10 text-white/60'}`}>
                    {String(r.status).replace(/_/g, ' ')}
                  </span>
                  {r.status === 'approved' && r.link_status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleView(r)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-linear-to-br/srgb from-gold to-gold-soft px-4 text-xs font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
                    >
                      {busy ? 'Opening…' : 'View paper'}
                    </button>
                  )}
                  {r.status === 'approved' && r.link_status === 'used' && (
                    <span className="text-xs text-white/50">Already viewed</span>
                  )}
                  {r.status === 'approved' && r.link_status === 'expired' && (
                    <span className="text-xs text-rose-300">Link expired</span>
                  )}
                  {r.status === 'approved' && r.link_status === 'revoked' && (
                    <span className="text-xs text-rose-300">Link revoked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline viewer */}
      {viewing && (
        <div className={`${glass} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{viewing.title}</h2>
            <button type="button" onClick={() => setViewing(null)} className="text-sm text-white/60 hover:text-white">
              Close
            </button>
          </div>
          {viewing.fileUrl ? (
            <>
              <iframe
                title={viewing.title}
                src={`${viewing.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="h-[70vh] w-full rounded-xl border border-white/15 bg-white"
              />
              <a href={viewing.fileUrl} download className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-white/15 px-4 text-sm text-gold hover:border-gold/40">
                Download PDF
              </a>
            </>
          ) : (
            <p className="text-sm text-white/50">The paper file is not available.</p>
          )}
        </div>
      )}
    </div>
  )
}