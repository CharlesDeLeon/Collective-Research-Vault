import { useState } from 'react'
import { apaCitation } from '../../utils/citation'
import { copyText } from '../../utils/clipboard'

export default function CitationCard({ paper }) {
  const [copied, setCopied] = useState(false)
  const storedCitation = typeof paper?.citation === 'string' ? paper.citation.trim() : ''
  const text = storedCitation || apaCitation(paper)

  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <div className="max-w-3xl rounded-[0.875rem] border border-white/15 bg-field/40 px-4 py-4 text-sm leading-[1.7] text-white/90">
        {text}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-3 min-h-11 rounded-xl border-[0.094rem] border-gold bg-transparent px-5 text-[0.9375rem] font-medium text-gold hover:bg-gold/10"
      >
        {copied ? 'Copied' : 'Copy citation'}
      </button>
    </>
  )
}