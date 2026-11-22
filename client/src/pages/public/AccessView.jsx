import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { outlineBtn } from '../../components/public/StatePanel'
import AccessBlocked, { AccessLoading } from '../../components/public/AccessBlocked'
import { useAccessGate } from '../../hooks/useAccessGate'
import { getGalleryPaper } from '../../services/galleryService'

export default function AccessView() {
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
    <PublicShell wide>
      <StatePanel title="Your paper" tone="success">
        {paper && <p className="m-0 font-medium">{paper.title}</p>}
        {state.fileUrl ? (
          <>
            <iframe
              title={paper?.title ?? 'Paper'}
              src={`${state.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="mt-4 h-[70vh] w-full rounded-xl border border-white/15 bg-white"
            />
            <a href={state.fileUrl} download className={`${outlineBtn} mt-4`}>Download PDF</a>
          </>
        ) : (
          <p className="mb-0 mt-3 text-white/75">The paper will be shown here once the file is connected.</p>
        )}
        <p className="mb-0 mt-4 text-sm text-white/70">This link has now been used. Leaving this page ends your access.</p>
        <Link to="/gallery" className={`${outlineBtn} mt-5`}>Back to gallery</Link>
      </StatePanel>
    </PublicShell>
  )
}