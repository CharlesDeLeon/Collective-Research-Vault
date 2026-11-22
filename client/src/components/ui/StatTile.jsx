import { glass } from '../dashboard/constants'

export default function StatTile({ label, value, onClick, active = false, note, className = '' }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gold">{value}</p>
      {note && <p className="mt-1 text-[0.6875rem] leading-snug text-white/45">{note}</p>}
    </>
  )
  const base = `${glass} p-4 text-left ${className}`
  if (!onClick) return <div className={base}>{body}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} transition ${active ? 'border-gold/60' : 'hover:border-white/25'}`}
    >
      {body}
    </button>
  )
}