import { useState } from 'react'
import ModalShell from '../ui/ModalShell'
import { CheckIcon } from '../dashboard/icons'

export default function ResubmitModal({ paper, onConfirm, onClose, error }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const confirm = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await onConfirm(paper)
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Resubmit for review" icon={CheckIcon} onClose={onClose}>
      <div className="px-1 pb-1 pt-4">
        <p className="m-0 line-clamp-2 text-sm font-medium">{paper.title}</p>
        <p className="mb-0 mt-3 text-sm leading-relaxed text-white/75">
          Your adviser will be notified. You won’t be able to edit this paper while it is under review.
        </p>
        {failed && (
          <p role="alert" className="mb-0 mt-3 text-sm text-danger-ink">
            {error || 'Could not resubmit. Please try again.'}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-white/25 px-6 text-base font-medium text-white/85 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-7 text-base font-semibold text-ink disabled:opacity-60"
          >
            {busy ? 'Resubmitting…' : 'Resubmit'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}