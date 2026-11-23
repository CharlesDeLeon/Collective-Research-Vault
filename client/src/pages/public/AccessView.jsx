import { useState, useEffect, useMemo } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { outlineBtn } from '../../components/public/StatePanel'
import AccessBlocked, { AccessLoading } from '../../components/public/AccessBlocked'
import { useAccessGate } from '../../hooks/useAccessGate'
import { getGalleryPaper } from '../../services/galleryService'
import { readAccessGrant } from '../../utils/accessGrant'

export default function AccessView() {
  const { token } = useParams()
  const { state } = useLocation()
  const grant = useMemo(() => {
    if (state?.paperSlug || state?.fileUrl) return state
    return readAccessGrant(token)
  }, [state, token])
  const gate = useAccessGate(token, grant)
  const [paperResult, setPaperResult] = useState({ slug: '', paper: null })
  const grantSlug = grant?.paperSlug || ''
  const fileUrl = grant?.fileUrl || ''

  useEffect(() => {
    if (!grantSlug) return undefined
    let cancelled = false
    getGalleryPaper(grantSlug).then((p) => {
      if (!cancelled) setPaperResult({ slug: grantSlug, paper: p })
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [grantSlug])

  const paper = paperResult.slug === grantSlug ? paperResult.paper : null

  if (gate.phase === 'loading') return <AccessLoading />
  if (gate.phase === 'confirm') return <Navigate to={`/access/${token}`} replace />
  if (gate.phase === 'blocked') return <AccessBlocked state={gate.state} paper={paper} />

  return (
    <PublicShell wide>
      <StatePanel title="Your paper" tone="success">
        {paper && <p className="m-0 font-medium">{paper.title}</p>}
        {fileUrl ? (
          <>
            <iframe
              title={paper?.title ?? 'Paper'}
              src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="mt-4 h-[70vh] w-full rounded-xl border border-white/15 bg-white"
            />
            <a href={fileUrl} download className={`${outlineBtn} mt-4`}>Download PDF</a>
          </>
        ) : (
          <p className="mb-0 mt-3 text-white/75">The paper will be shown here once the file is connected.</p>
        )}
        <p className="mb-0 mt-4 text-sm text-white/70">
          This link has been used. You can keep this tab open to view or download the file. Closing this tab ends your access.
        </p>
        <Link to="/gallery" className={`${outlineBtn} mt-5`}>Back to gallery</Link>
      </StatePanel>
    </PublicShell>
  )
}
