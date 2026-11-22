import { avatarTone, initials } from '../../utils/avatarColors'
import { roleLabel } from '../../utils/adminRoles'

export function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active ? 'border-success/40 bg-success/10 text-success-ink' : 'border-white/15 bg-white/5 text-white/55'
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? 'bg-success' : 'bg-white/40'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function RoleBadge({ role }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
      {roleLabel(role)}
    </span>
  )
}

export function Avatar({ name, large = false }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold ${large ? 'size-16 text-xl' : 'size-10 text-sm'} ${avatarTone(name)}`}
    >
      {initials(name)}
    </span>
  )
}