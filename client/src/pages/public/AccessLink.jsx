import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { primaryBtn, outlineBtn } from '../../components/public/StatePanel'
import AccessBlocked, { AccessLoading } from '../../components/public/AccessBlocked'
import { useAccessGate } from '../../hooks/useAccessGate'
import { consumeAccessLink } from '../../services/accessLinkService'
import { getGalleryPaper } from '../../services/galleryService'

export default function AccessLink() {
  const { token } = useParams()
  const navigate = useNavigate()
  const gate = useAccessGate(token)
  const [busy, setBusy] = useState('')
  const [failed, setFailed] = useState('')
  const [paper, setPaper] = useState(null)

  useEffect(() => {
    if (!gate.paperSlug) { setPaper(null); return }
    let cancelled = false
    getGalleryPaper(gate.paperSlug).then((p) => { if (!cancelled) setPaper(p) }).catch(() => {})
    return () => { cancelled = true }
  }, [gate.paperSlug])

  const open = async (mode) => {
    setBusy(mode)
    const res = await consumeAccessLink(token)
    if (res.state === 'success') {
      navigate(`/access/${token}/${mode}`, { replace: true, state: { paperSlug: res.paperSlug, fileUrl: res.fileUrl } })
      return
    }
    setBusy('')
    setFailed(res.state)
  }

  if (gate.phase === 'loading') return <AccessLoading />
  if (failed) return <AccessBlocked state={failed} paper={paper} />
  if (gate.phase === 'blocked') return <AccessBlocked state={gate.state} paper={paper} />

  return (
    <PublicShell>
      <StatePanel title="Your access link">
        {paper && <p className="m-0 font-medium">{paper.title}</p>}
        <p className="mb-0 mt-3">
          This link works once. After you choose how to open the paper, it can’t be used again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={Boolean(busy)} onClick={() => open('view')} className={`${primaryBtn} disabled:opacity-60`}>
            {busy === 'view' ? 'Opening…' : 'Open Full Paper'}
          </button>
          <button type="button" disabled={Boolean(busy)} onClick={() => open('download')} className={`${outlineBtn} disabled:opacity-60`}>
            {busy === 'download' ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </StatePanel>
    </PublicShell>
  )
}