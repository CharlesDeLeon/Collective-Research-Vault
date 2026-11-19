import { AlertIcon } from '../dashboard/icons'
import ModalShell from './ModalShell'

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <ModalShell title={title} icon={AlertIcon} onClose={onClose}>
      <p className="mt-4 px-1 text-sm leading-relaxed text-white/75">{message}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-11 rounded-xl text-sm font-semibold transition ${
            danger
              ? 'border border-danger bg-danger/20 text-danger-ink hover:bg-danger/30'
              : 'bg-linear-to-br/srgb from-gold to-gold-soft text-ink hover:brightness-105'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}