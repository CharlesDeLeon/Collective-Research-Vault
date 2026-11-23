import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useToast from '../../context/useToast'
import { glass, ROUTES } from '../../components/dashboard/constants'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { listMyAccessRequests, consumeMyAccessRequest } from '../../services/studentAccessService'
import { longDate } from '../../utils/formatDate'

const STATE_MESSAGES = {
  used: 'This access link has already been used. Request a new one if needed.',
  expired: 'This access link has expired. Request a new one.',
  revoked: 'This access link has been revoked.',
  pending: 'Your request is still pending approval.',
  invalid: 'Unable to access this paper.',
}

const STATUS_CLS = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-rose-500/20 text-rose-300',
  accessed: 'bg-sky-500/20 text-sky-300',
}

export default function MyAccess() {
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')
  const [viewing, setViewing] = useState(null) // { fileUrl, title }
  const [pendingView, setPendingView] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await listMyAccessRequests())
    } catch (e) {
      console.error(e)
      setError('Could not load your access requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const markLink = (id, linkStatus) => {
    setRequests((list) =>
      list.map((r) => (r.request_id === id ? { ...r, link_status: linkStatus } : r))
    )
  }

  const confirmView = async () => {
    const req = pendingView
    if (!req) return
    setPendingView(null)
    setActionError('')
    setBusy(true)
    try {
      const res = await consumeMyAccessRequest(req.request_id)
      if (res.state === 'success') {
        setViewing({ fileUrl: res.fileUrl, title: req.paper_title })
        markLink(req.request_id, 'used')
        if (!res.fileUrl) toast('The paper file is not available. Request a new link.', 'error')
      } else {
        const message = STATE_MESSAGES[res.state] || 'Unable to access this paper.'
        setActionError(message)
        toast(message, 'error')
        if (['used', 'expired', 'revoked'].includes(res.state)) markLink(req.request_id, res.state)
      }
    } catch (e) {
      console.error(e)
      const message = e?.response?.data?.message || 'Could not open the paper. Please try again.'
      setActionError(message)
      toast(message, 'error')
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
        <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3">
          <p className="m-0 text-sm text-rose-200">{error}</p>
          <button
            type="button"
            onClick={fetchRequests}
            className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-rose-300/50 px-4 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
          >
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="m-0 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {actionError}
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
          <Link to={ROUTES.gallery} className="font-semibold text-gold hover:underline">gallery</Link> to find research.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.request_id} className={`${glass} p-4 sm:p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-medium">{r.paper_title}</p>
                  <p className="m-0 mt-1 text-xs text-white/50">
                    {r.group_name || '—'} · Requested {r.created_at ? longDate(r.created_at) : ''}
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
                      onClick={() => setPendingView(r)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-linear-to-br/srgb from-gold to-gold-soft px-4 text-xs font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
                    >
                      {busy ? 'Opening…' : 'View paper'}
                    </button>
                  )}
                  {r.status === 'approved' && ['used', 'expired', 'revoked'].includes(r.link_status) && (
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs ${r.link_status === 'used' ? 'text-white/50' : 'text-rose-300'}`}>
                        {r.link_status === 'used' ? 'Already viewed' : `Link ${r.link_status}`}
                      </span>
                      <Link to={ROUTES.gallery} className="text-xs font-semibold text-gold hover:underline">
                        Request a new link
                      </Link>
                    </div>
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
            <div className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-white/60">
              <p className="m-0 font-medium text-white/80">The paper file is not available.</p>
              <p className="mb-0 mt-1">
                The link may have expired or the adviser may have removed the file. Request a new access link from the gallery.
              </p>
              <Link
                to={ROUTES.gallery}
                className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-gold/50 px-4 text-sm font-semibold text-gold transition hover:bg-gold/10"
              >
                Browse gallery
              </Link>
            </div>
          )}
        </div>
      )}

      {pendingView && (
        <ConfirmModal
          title="Open paper"
          message="Opening the paper uses your one-time access link. You won’t be able to open it again — download a copy while it is available. If the file is missing, ask your adviser for a new link."
          confirmLabel="Open paper"
          onConfirm={confirmView}
          onClose={() => setPendingView(null)}
        />
      )}
    </div>
  )
}