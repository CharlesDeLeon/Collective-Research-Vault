import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicShell from '../../components/public/PublicShell'
import StatePanel, { primaryBtn, outlineBtn } from '../../components/public/StatePanel'
import { copyText } from '../../utils/clipboard'

export default function RequestSubmitted() {
  const [params] = useSearchParams()
  const ref = params.get('ref') ?? ''
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(ref)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!ref) {
    return (
      <PublicShell>
        <StatePanel title="Nothing to show">
          <p className="m-0">We couldn’t find a request here.</p>
          <Link to="/gallery" className={`${primaryBtn} mt-5`}>Browse the gallery</Link>
        </StatePanel>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <StatePanel title="Request sent" tone="success">
        <p className="m-0">Your request was sent to the paper’s adviser. Save this reference code to check its status.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="max-w-full min-w-0 rounded-xl border border-gold/50 bg-field/60 px-5 py-3 text-xl font-bold tracking-[0.08em] text-gold">
            {ref}
          </span>
          <button type="button" onClick={copy} className={outlineBtn}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/access/status/${encodeURIComponent(ref)}`} className={primaryBtn}>Check status</Link>
          <Link to="/gallery" className={outlineBtn}>Back to gallery</Link>
        </div>
      </StatePanel>
    </PublicShell>
  )
}