import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { outlineBtn } from '../../components/public/StatePanel'
import AccessBlocked, { AccessLoading } from '../../components/public/AccessBlocked'
import { useAccessGate } from '../../hooks/useAccessGate'
import { getGalleryPaper } from '../../services/galleryService'

export default function AccessDownload() {
  const { token } = useParams()
  const { state } = useLocation()
  const gate = useAccessGate(token, state)
  const [paper, setPaper] = useState(null)

  useEffect(() => {
    if (!gate.paperSlug) { setPaper(null); return }
    let cancelled = false
    getGalleryPaper(gate.paperSlug).then((p) => { if (!cancelled) setPaper(p) }).catch(() => {})
    return () => { cancelled = true }
  }, [gate.paperSlug])

  if (gate.phase === 'loading') return <AccessLoading />
  if (gate.phase === 'confirm') return <Navigate to={`/access/${token}`} replace />
  if (gate.phase === 'blocked') return <AccessBlocked state={gate.state} paper={paper} />

  return (
    <PublicShell>
      <StatePanel title="Download started" tone="success">
        {paper && <p className="m-0 font-medium">{paper.title}</p>}
        <p className="mb-0 mt-3 text-white/75">
          Your download will start automatically. This link has now been used.
        </p>
        {state.fileUrl && (
          <a href={state.fileUrl} download className={`${outlineBtn} mt-5`}>Download again</a>
        )}
        <Link to="/gallery" className={`${outlineBtn} mt-3`}>Back to gallery</Link>
      </StatePanel>
    </PublicShell>
  )
}