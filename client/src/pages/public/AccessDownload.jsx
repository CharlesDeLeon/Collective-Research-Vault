import { useMemo } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { outlineBtn } from '../../components/public/StatePanel'
import AccessBlocked, { AccessLoading } from '../../components/public/AccessBlocked'
import { useAccessGate } from '../../hooks/useAccessGate'
import { readAccessGrant } from '../../utils/accessGrant'

export default function AccessDownload() {
  const { token } = useParams()
  const { state } = useLocation()
  const grant = useMemo(() => {
    if (state?.paperSlug || state?.fileUrl) return state
    return readAccessGrant(token)
  }, [state, token])
  const gate = useAccessGate(token, grant)
  const grantSlug = grant?.paperSlug || ''
  const paperTitle = grant?.paperTitle || gate?.paperTitle || ''
  const fileUrl = grant?.fileUrl || ''

  const paper = paperTitle ? { title: paperTitle, slug: grantSlug } : null

  if (gate.phase === 'loading') return <AccessLoading />
  if (gate.phase === 'confirm') return <Navigate to={`/access/${token}`} replace />
  if (gate.phase === 'blocked') return <AccessBlocked state={gate.state} paper={paper} />

  return (
    <PublicShell>
      <StatePanel title="Your paper is ready" tone="success">
        {paper && <p className="m-0 max-w-full min-w-0 font-medium">{paper.title}</p>}
        <p className="mb-0 mt-3 text-white/75">
          Use Download PDF below. Your browser may ask where to save the file.
        </p>
        <p className="mb-0 mt-3 text-sm text-white/70">
          This link has been used. You can keep this tab open to download the file. Closing this tab ends your access.
        </p>
        {fileUrl ? (
          <a href={fileUrl} download className={`${outlineBtn} mt-5`}>Download PDF</a>
        ) : (
          <p className="mb-0 mt-5 text-white/75">
            The file is not available yet. Please contact the office or your adviser.
          </p>
        )}
        <Link to="/gallery" className={`${outlineBtn} mt-3`}>Back to gallery</Link>
      </StatePanel>
    </PublicShell>
  )
}
