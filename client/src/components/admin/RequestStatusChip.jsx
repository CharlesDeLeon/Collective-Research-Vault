const TONES = {
  pending: 'border-warn/40 bg-warn/10 text-warn-ink',
  verified: 'border-warn/40 bg-warn/10 text-warn-ink',
  approved: 'border-success/40 bg-success/10 text-success-ink',
  declined: 'border-danger/40 bg-danger/10 text-danger-ink',
  accessed: 'border-info/40 bg-info/10 text-info-ink',
  expired: 'border-white/15 bg-white/5 text-white/55',
}

export function RequestStatusChip({ status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        TONES[status] ?? 'border-white/15 bg-white/5 text-white/60'
      }`}
    >
      {String(status || 'unknown').replace(/_/g, ' ')}
    </span>
  )
}