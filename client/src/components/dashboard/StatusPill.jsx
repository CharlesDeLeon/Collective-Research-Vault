import { STATUS_STYLES } from './constants'

export default function StatusPill({ status, className = '' }) {
  const s = STATUS_STYLES[status] ?? {
    label: status?.replace(/_/g, ' ') ?? 'Unknown',
    cls: 'bg-white/10 text-white/70 border-white/20',
  }
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center justify-center rounded-full border px-3 py-1 text-center text-[0.625rem] font-bold uppercase leading-tight tracking-wider wrap-break-word ${s.cls} ${className}`}
    >
      {s.label}
    </span>
  )
}