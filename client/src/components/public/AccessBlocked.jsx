import { Link } from 'react-router-dom'
import PublicShell from './PublicShell'
import StatePanel, { primaryBtn, outlineBtn } from './StatePanel'

const COPY = {
  invalid: ['Link not valid', 'This access link doesn’t exist. Check that you copied the whole link from your email.'],
  expired: ['Link expired', 'This link was only valid for 72 hours. You can send a new request.'],
  revoked: ['Link cancelled', 'This link is no longer active. You can send a new request.'],
  used: ['Link already used', 'Each access link works once. You can send a new request.'],
}

export default function AccessBlocked({ state, paper }) {
  const [title, text] = COPY[state] ?? COPY.invalid
  return (
    <PublicShell>
      <StatePanel title={title} tone="warn">
        <p className="m-0">{text}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {paper && <Link to={`/paper/${paper.slug}`} className={primaryBtn}>Request again</Link>}
          <Link to="/gallery" className={outlineBtn}>Browse the gallery</Link>
        </div>
      </StatePanel>
    </PublicShell>
  )
}

export function AccessLoading() {
  return (
    <PublicShell>
      <StatePanel title="Checking your link">
        <p className="m-0">One moment…</p>
      </StatePanel>
    </PublicShell>
  )
}