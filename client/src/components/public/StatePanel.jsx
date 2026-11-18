export default function StatePanel({ title, children, tone = 'neutral' }) {
  const toneCls = {
    neutral: 'border-white/12 bg-field/40',
    success: 'border-emerald-400/40 bg-emerald-500/10',
    warn: 'border-amber-400/40 bg-amber-500/10',
    error: 'border-rose-400/40 bg-rose-500/10',
  }[tone]
  return (
    <section className={`rounded-[1.25rem] border p-6 sm:p-8 ${toneCls}`}>
      <h1 className="m-0 text-2xl font-semibold leading-tight">{title}</h1>
      <div className="mt-3 text-[0.9375rem] leading-relaxed text-white/85">{children}</div>
    </section>
  )
}

export const primaryBtn =
  'inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-br from-gold to-gold-soft px-7 text-base font-semibold text-ink'

export const outlineBtn =
  'inline-flex min-h-12 items-center justify-center rounded-xl border-[0.094rem] border-gold bg-transparent px-6 text-[0.9375rem] font-medium text-gold hover:bg-gold/10'