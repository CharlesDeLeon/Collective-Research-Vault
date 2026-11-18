import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { primaryBtn, outlineBtn } from '../../components/public/StatePanel'
import { consumeAccessLink, getAccessLink } from '../../services/accessLinkService'
import { getGalleryPaper } from '../../services/galleryData'

const BLOCKED = {
  invalid: ['Link not valid', 'This access link doesn’t exist. Check that you copied the whole link from your email.'],
  expired: ['Link expired', 'This link was only valid for 72 hours. You can send a new request.'],
  revoked: ['Link cancelled', 'This link is no longer active. You can send a new request.'],
  used: ['Link already used', 'Each access link works once. You can send a new request.'],
}

export default function AccessLink() {
  const { token } = useParams()
  const [link, setLink] = useState({ token: '', data: null })
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let live = true
    getAccessLink(token).then((data) => {
      if (live) setLink({ token, data })
    })
    return () => {
      live = false
    }
  }, [token])

  const data = link.token === token ? link.data : null
  const paper = data?.paperSlug ? getGalleryPaper(data.paperSlug) : null

  const open = async (mode) => {
    setBusy(mode)
    const res = await consumeAccessLink(token)
    setBusy('')
    setResult({ ...res, mode })
  }

  if (!data) {
    return (
      <PublicShell>
        <StatePanel title="Checking your link">
          <p className="m-0">One moment…</p>
        </StatePanel>
      </PublicShell>
    )
  }

  if (result && result.state === 'success') {
    return (
      <PublicShell wide>
        <StatePanel title={result.mode === 'view' ? 'Your paper' : 'Download started'} tone="success">
          {paper && <p className="m-0 font-medium">{paper.title}</p>}
          {result.mode === 'view' ? (
            result.fileUrl ? (
              <iframe
                title={paper?.title ?? 'Paper'}
                src={result.fileUrl}
                className="mt-4 h-[70vh] w-full rounded-xl border border-white/15 bg-white"
              />
            ) : (
              <p className="mb-0 mt-3 text-white/75">The paper will be shown here once the file is connected.</p>
            )
          ) : (
            <p className="mb-0 mt-3 text-white/75">
              Your download will start automatically. This link has now been used.
            </p>
          )}
          <Link to="/gallery" className={`${outlineBtn} mt-6`}>Back to gallery</Link>
        </StatePanel>
      </PublicShell>
    )
  }

  const blocked = BLOCKED[result?.state ?? data.state]
  if (blocked) {
    return (
      <PublicShell>
        <StatePanel title={blocked[0]} tone="warn">
          <p className="m-0">{blocked[1]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {paper && <Link to={`/paper/${paper.slug}`} className={primaryBtn}>Request again</Link>}
            <Link to="/gallery" className={outlineBtn}>Browse the gallery</Link>
          </div>
        </StatePanel>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <StatePanel title="Your access link">
        {paper && <p className="m-0 font-medium">{paper.title}</p>}
        <p className="mb-0 mt-3">
          This link works once. After you choose how to open the paper, it can’t be used again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={Boolean(busy)} onClick={() => open('view')} className={`${primaryBtn} disabled:opacity-60`}>
            {busy === 'view' ? 'Opening…' : 'View in browser'}
          </button>
          <button type="button" disabled={Boolean(busy)} onClick={() => open('download')} className={`${outlineBtn} disabled:opacity-60`}>
            {busy === 'download' ? 'Preparing…' : 'Download'}
          </button>
        </div>
      </StatePanel>
    </PublicShell>
  )
}