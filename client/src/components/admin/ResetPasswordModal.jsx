import { useState } from 'react'
import ModalShell from '../ui/ModalShell'
import { AlertIcon, CheckIcon } from '../dashboard/icons'
import { apiMessage, resetAdminUserPassword } from '../../services/adminService'

export default function ResetPasswordModal({ user, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const reset = async () => {
    setBusy(true)
    setError('')
    try {
      const password = await resetAdminUserPassword(user.user_id)
      setTemporaryPassword(password)
      onDone?.()
    } catch (e) {
      setError(apiMessage(e, 'Could not reset this password.'))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <ModalShell title="Reset password" icon={AlertIcon} onClose={onClose}>
      {temporaryPassword ? (
        <div className="mt-4 space-y-4 px-1 pb-1">
          <p className="flex items-start gap-2 text-sm text-success-ink">
            <CheckIcon className="mt-0.5 size-4 shrink-0" />
            {user.name} now has a new temporary password.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Temporary password</p>
            <p className="mt-2 wrap-break-word font-mono text-lg text-white">{temporaryPassword}</p>
          </div>
          <p className="text-xs leading-relaxed text-white/55">
            Share this securely. It will not be shown again, and the account must change it at the next sign-in.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={copy} className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={onClose} className="h-11 rounded-xl bg-gold text-sm font-semibold text-ink transition hover:brightness-105">
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-5 px-1 pb-1">
          <p className="text-sm text-white/75">
            Reset the password for <span className="font-semibold text-white">{user.name}</span>? Their current password stops working right away.
          </p>
          <p className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-xs leading-relaxed text-warn-ink">
            The new temporary password is shown once after resetting. Share it through a secure channel. This change is recorded in the audit log.
          </p>
          {error && <p role="alert" className="m-0 text-sm text-danger-ink">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              Cancel
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Resetting…' : 'Reset password'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
