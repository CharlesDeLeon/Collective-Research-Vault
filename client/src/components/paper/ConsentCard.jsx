import { useState } from 'react'
import { glass } from '../dashboard/constants'
import { CheckIcon } from '../dashboard/icons'
import SectionHeading from './SectionHeading'
import { longDate } from '../../utils/formatDate'
import { normalizeStatus } from '../../utils/paperRules'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

function stateText(paper, locked) {
  const { status, at } = paper.consent ?? { status: 'pending' }
  const dated = (word) => (at ? `${word} on ${longDate(at)}.` : `${word}.`)
  if (locked) return 'This paper is published. Ask your adviser to unpublish it before you withdraw consent.'
  if (status === 'granted') return `${dated('Granted')} You can withdraw until the paper is published.`
  if (status === 'declined') return `${dated('Withdrawn')} Your adviser can’t publish this paper.`
  return 'Not granted yet. Your adviser can’t publish this paper without it.'
}

export default function ConsentCard({ paper, onChange }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const granted = paper.consent?.status === 'granted'
  const locked = normalizeStatus(paper.status) === 'published'
  const unsupported = !backendSupport.studentConsent

  const toggle = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await onChange(!granted)
    } catch {
      setFailed(true)
    }
    setBusy(false)
  }

  return (
    <section aria-labelledby="consent-heading">
      <div id="consent-heading">
        <SectionHeading icon={CheckIcon} title="Public release" />
      </div>
      <div className={`${glass} p-4`}>
        <div className="flex items-center justify-between gap-4">
          <span id="consent-label" className="text-sm font-semibold">
            Allow public release
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={granted}
            aria-labelledby="consent-label"
            disabled={busy || locked || unsupported}
            onClick={toggle}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
              granted ? 'border-gold bg-gold' : 'border-white/30 bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all ${
                granted ? 'left-5.5 bg-ink' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <p className="mb-0 mt-3 text-xs leading-relaxed text-white/60">
          If your adviser publishes this paper, the public will see its title, abstract, citation and details
          (authors, keywords, strand, section, school year and adviser). The full paper stays private until your
          adviser approves an access request.
        </p>

        <p className={`mb-0 mt-3 text-sm ${granted ? 'text-emerald-300' : 'text-white/75'}`}>
          {stateText(paper, locked)}
        </p>
        {unsupported ? (
          <p className="mb-0 mt-2 text-xs text-white/50">{unsupportedNote.studentConsent}</p>
        ) : (
          <p className="mb-0 mt-2 text-xs text-white/50">Your adviser is notified when you change this.</p>
        )}

        {failed && (
          <p role="alert" className="mb-0 mt-3 text-sm text-danger-ink">
            Could not save your choice. Please try again.
          </p>
        )}
      </div>
    </section>
  )
}