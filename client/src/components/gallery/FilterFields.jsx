const label = 'mb-1 block p-0 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-gold'

export default function FilterFields({ years, keywords, onYear, onKeyword, rowClass = 'min-h-11 text-[0.9375rem]', boxClass = 'size-5' }) {
  return (
    <>
      <fieldset className="m-0 mb-3 border-0 p-0">
        <legend className={label}>School year</legend>
        {years.map((o) => (
          <label key={o.value} className={`flex cursor-pointer items-center gap-3 ${rowClass}`}>
            <input
              type="checkbox"
              checked={o.checked}
              onChange={() => onYear(o.value)}
              className={`m-0 accent-gold ${boxClass}`}
            />
            <span className="flex-1">{o.value}</span>
            <span className="text-[0.8125rem] text-white/70">{o.count}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <h3 className={`${label} mb-2.5`}>Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={k.on}
              onClick={() => onKeyword(k.value)}
              className={`min-h-10 rounded-full border px-3.5 text-[0.8125rem] sm:min-h-9 ${
                k.on
                  ? 'border-gold bg-gold/20 text-[#FFD27F]'
                  : 'border-white/40 bg-transparent text-white/90 hover:bg-white/10'
              }`}
            >
              {k.value}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}