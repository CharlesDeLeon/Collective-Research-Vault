export function BarList({ rows, empty = 'Nothing to show yet.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="mt-3 text-sm text-white/55">{empty}</p>
  return (
    <ul className="mt-3 space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate capitalize text-white/85">{r.label}</span>
            <span className="font-semibold text-gold">{r.value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ColumnChart({ points, ariaLabel, empty = 'Nothing to show yet.' }) {
  const max = Math.max(1, ...points.map((p) => p.value))
  const total = points.reduce((sum, p) => sum + p.value, 0)
  if (points.length === 0 || total === 0) return <p className="mt-3 text-sm text-white/55">{empty}</p>
  return (
    <figure className="m-0 mt-3">
      <div className="flex items-baseline justify-between text-xs text-white/55">
        <span>Most in one period: {max}</span>
        <span>Total: {total}</span>
      </div>
      <div role="img" aria-label={ariaLabel} className="mt-2 flex h-40 items-end gap-1 border-b border-white/15">
        {points.map((p) => (
          <div key={p.label} className="flex h-full min-w-0 flex-1 items-end" title={`${p.label}: ${p.value}`}>
            <div
              className="w-full rounded-t bg-gold"
              style={{ height: `${p.value === 0 ? 0 : Math.max(4, (p.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-white/55">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </figcaption>
    </figure>
  )
}