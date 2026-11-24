import { useState } from 'react'
import ModalShell from '../ui/ModalShell'
import Select, { Option } from '../ui/Select'
import { AlertIcon } from '../dashboard/icons'
import { ROLE_OPTIONS, ROLE_LABELS, canonicalRole, roleLabel } from '../../utils/adminRoles'

export default function ChangeRoleModal({ user, onSubmit, onClose }) {
  const current = canonicalRole(user.role)
  const [role, setRole] = useState(current)
  const [saving, setSaving] = useState(false)
  const unchanged = role === current

  const submit = async (e) => {
    e.preventDefault()
    if (unchanged) return
    setSaving(true)
    await onSubmit(role)
    setSaving(false)
  }

  return (
    <ModalShell title="Change role" icon={AlertIcon} onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-5 px-1 pb-1">
        <p className="text-sm text-white/75">
          <span className="max-w-full wrap-break-word font-semibold text-white">{user.name}</span> is currently {roleLabel(user.role)}.
        </p>
        <div>
          <span className="block text-sm font-bold uppercase tracking-wide text-gold">New role</span>
          <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="New role" className="border-white/20">
            {ROLE_OPTIONS.map((value) => (
              <Option key={value} value={value}>
                {ROLE_LABELS[value]}
              </Option>
            ))}
          </Select>
        </div>
        <p className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-xs leading-relaxed text-warn-ink">
          The new role takes effect right away and changes which screens this person can open. Their posts and history stay as they are. The change is recorded in the audit log.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={unchanged || saving}
            className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Change role'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}