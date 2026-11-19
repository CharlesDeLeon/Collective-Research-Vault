const TONES = {
  Student: 'border-white/20 text-white/60',
  Adviser: 'border-gold/50 bg-gold/10 text-gold',
  Panelist: 'border-info/50 bg-info/10 text-info-ink',
  Admin: 'border-danger/50 bg-danger/10 text-danger-ink',
}

export default function RoleBadge({ role }) {
  if (!role) return null
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${
        TONES[role] ?? TONES.Student
      }`}
    >
      {role}
    </span>
  )
}