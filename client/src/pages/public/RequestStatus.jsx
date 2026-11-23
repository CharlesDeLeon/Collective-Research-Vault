import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import GalleryNavbar from '../../components/gallery/GalleryNavbar'
import StatePanel, { primaryBtn, outlineBtn } from '../../components/public/StatePanel'
import { inputCls } from '../../components/upload/Field'
import { getRequestStatus } from '../../services/accessRequestService'
import { getGalleryPaper } from '../../services/galleryService'
import { longDate } from '../../utils/formatDate'

const STATUS_COPY = {
  pending: ['Under review', 'neutral', 'The adviser is reviewing your request. We will email you once there is a decision.'],
  approved: ['Approved', 'success', 'Your request was approved. Check your email for your one-time access link. It works for 72 hours.'],
  declined: ['Declined', 'error', 'Your request was not approved.'],
  accessed: ['Paper accessed', 'success', 'This access link has already been used. Submit a new request if you need the paper again.'],
  verified: ['Verified', 'success', 'Your request was verified. Check your email for your one-time access link.'],
  expired: ['Expired', 'warn', 'The access link for this request has expired. You can submit a new request.'],
  revoked: ['Cancelled', 'warn', 'This access request was cancelled. You can submit a new request.'],
}

const LINK_COPY = {
  active: ['Access link active', 'Your one-time link is ready to use.'],
  used: ['Access link used', 'The one-time link has already been used.'],
  expired: ['Access link expired', 'The link was valid for 72 hours. Submit a new request if you still need the paper.'],
  revoked: ['Access link cancelled', 'The link is no longer active.'],
}

const statusCopy = (status) => {
  if (STATUS_COPY[status]) return STATUS_COPY[status]
  const label = typeof status === 'string' && status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Status unavailable'
  return [label, 'neutral', 'We could not find a description for this status. Contact the office if you need help.']
}

function Lookup({ initial }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initial)
  const submit = (e) => {
    e.preventDefault()
    const code = value.trim()
    if (code) navigate(`/access/status/${encodeURIComponent(code)}`)
  }
  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="E.g. CV-A1B2C3"
        aria-label="Reference code"
        className={`${inputCls} border-white/15 sm:max-w-xs`}
      />
      <button type="submit" className={primaryBtn}>Check status</button>
    </form>
  )
}

export default function RequestStatus() {
  const { ref = '' } = useParams()
  const [lookup, setLookup] = useState({ ref: '', attempt: 0, status: 'idle', data: null })
  const [attempt, setAttempt] = useState(0)
  const [paper, setPaper] = useState(null)

  useEffect(() => {
    if (!ref) return undefined
    let live = true
    getRequestStatus(ref)
      .then((data) => {
        if (!live) return
        setLookup({ ref, attempt, status: data ? 'ready' : 'not_found', data })
      })
      .catch((err) => {
        if (!live) return
        setLookup({
          ref,
          attempt,
          status: err?.response?.status === 404 ? 'not_found' : 'error',
          data: null,
        })
      })
    return () => {
      live = false
    }
  }, [ref, attempt])

  const active = lookup.ref === ref && lookup.attempt === attempt
  const loading = Boolean(ref) && !active
  const notFound = Boolean(ref) && active && lookup.status === 'not_found'
  const failed = Boolean(ref) && active && lookup.status === 'error'
  const data = Boolean(ref) && active && lookup.status === 'ready' ? lookup.data : null
  const copy = data ? statusCopy(data.status) : null
  const linkCopy = data?.linkStatus ? LINK_COPY[data.linkStatus] : null
  const activePaper = paper?.slug === data?.paperSlug ? paper : null
  const paperSlug = activePaper?.slug || data?.paperSlug
  const paperTitle = activePaper?.title || data?.paperTitle

  useEffect(() => {
    if (!data?.paperSlug) return undefined
    let cancelled = false
    getGalleryPaper(data.paperSlug).then((p) => { if (!cancelled) setPaper(p) }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [data?.paperSlug])

  const tone = failed ? 'error' : notFound ? 'warn' : copy ? copy[1] : 'neutral'

  return (
    <div className="min-h-screen bg-linear-to-br from-navy-900 to-navy-500 font-display text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />
        <div className="mx-auto mt-6 max-w-3xl">
          <StatePanel title="Request status" tone={tone}>
            <p className="m-0">Enter the reference code you received after sending your request.</p>
            <Lookup key={ref} initial={ref} />

            {loading && <p role="status" className="mb-0 mt-6 text-white/70">Looking it up…</p>}

            {notFound && (
              <p role="alert" className="mb-0 mt-6 text-danger-ink">
                We couldn’t find a request with that code. Check it and try again.
              </p>
            )}

            {failed && (
              <div role="alert" className="mb-0 mt-6">
                <p className="m-0 text-danger-ink">We couldn’t check the status right now. Please try again.</p>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className={`${primaryBtn} mt-4`}
                >
                  Try again
                </button>
              </div>
            )}

            {data && copy && (
              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="m-0 text-xl font-semibold">{copy[0]}</p>
                <p className="mb-0 mt-2">{copy[2]}</p>

                {linkCopy && (
                  <div className="mb-0 mt-4 rounded-xl border border-white/12 bg-field/35 px-4 py-3">
                    <p className="m-0 font-semibold">{linkCopy[0]}</p>
                    <p className="mb-0 mt-1 text-sm text-white/75">{linkCopy[1]}</p>
                  </div>
                )}

                {data.status === 'declined' && data.reason && (
                  <p className="mb-0 mt-2 text-white/75">Reason: {data.reason}</p>
                )}

                <dl className="mb-0 mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Reference</dt>
                    <dd className="m-0 mt-1">{data.ref}</dd>
                  </div>
                  {(paperTitle || paperSlug) && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Paper</dt>
                      <dd className="m-0 mt-1">
                        {paperSlug ? (
                          <Link to={`/paper/${paperSlug}`} className="underline decoration-gold/60 underline-offset-2">
                            {paperTitle || paperSlug}
                          </Link>
                        ) : (
                          paperTitle
                        )}
                      </dd>
                    </div>
                  )}
                  {data.createdAt && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Sent</dt>
                      <dd className="m-0 mt-1">{longDate(data.createdAt)}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  {paperSlug && data.status !== 'pending' && (
                    <Link to={`/paper/${paperSlug}`} className={primaryBtn}>Request again</Link>
                  )}
                  <Link to="/gallery" className={outlineBtn}>Back to gallery</Link>
                </div>
              </div>
            )}
          </StatePanel>
        </div>
      </div>
    </div>
  )
}
