import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import GalleryNavbar from '../../components/gallery/GalleryNavbar'
import StatePanel, { primaryBtn, outlineBtn } from '../../components/public/StatePanel'
import { inputCls } from '../../components/upload/Field'
import { getRequestStatus } from '../../services/accessRequestService'
import { getGalleryPaper } from '../../services/galleryService'
import { longDate } from '../../utils/formatDate'

const COPY = {
  pending: ['Under review', 'neutral', 'The adviser is reviewing your request. We will email you once there is a decision.'],
  approved: ['Approved', 'success', 'Your request was approved. Check your email for your one-time access link. It works for 72 hours.'],
  declined: ['Declined', 'error', 'Your request was not approved.'],
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
  const [state, setState] = useState({ ref: '', loading: false, data: null })

  useEffect(() => {
    if (!ref) return
    let live = true
    getRequestStatus(ref).then((data) => {
      if (live) setState({ ref, loading: false, data })
    })
    return () => {
      live = false
    }
  }, [ref])

  const loading = Boolean(ref) && state.ref !== ref
  const data = state.ref === ref ? state.data : null
  const copy = data ? COPY[data.status] : null
  const [paper, setPaper] = useState(null)
  useEffect(() => {
    if (!data?.paperSlug) { setPaper(null); return }
    let cancelled = false
    getGalleryPaper(data.paperSlug).then((p) => { if (!cancelled) setPaper(p) }).catch(() => {})
    return () => { cancelled = true }
  }, [data?.paperSlug])

  return (
    <div className="min-h-screen bg-linear-to-br from-navy-900 to-navy-500 font-display text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />
        <div className="mx-auto mt-6 max-w-3xl">
          <StatePanel title="Request status" tone={copy ? copy[1] : 'neutral'}>
            <p className="m-0">Enter the reference code you received after sending your request.</p>
            <Lookup key={ref} initial={ref} />

            {loading && <p className="mb-0 mt-6 text-white/70">Looking it up…</p>}

            {ref && !loading && !data && (
              <p role="alert" className="mb-0 mt-6 text-danger-ink">
                We couldn’t find a request with that code. Check it and try again.
              </p>
            )}

            {data && copy && (
              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="m-0 text-xl font-semibold">{copy[0]}</p>
                <p className="mb-0 mt-2">{copy[2]}</p>
                {data.status === 'declined' && data.reason && (
                  <p className="mb-0 mt-2 text-white/75">Reason: {data.reason}</p>
                )}
                <dl className="mb-0 mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Reference</dt>
                    <dd className="m-0 mt-1">{data.ref}</dd>
                  </div>
                  {paper && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Paper</dt>
                      <dd className="m-0 mt-1">
                        <Link to={`/paper/${paper.slug}`} className="underline decoration-gold/60 underline-offset-2">
                          {paper.title}
                        </Link>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-gold">Sent</dt>
                    <dd className="m-0 mt-1">{longDate(data.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  {paper && data.status !== 'pending' && (
                    <Link to={`/paper/${paper.slug}`} className={primaryBtn}>Request again</Link>
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