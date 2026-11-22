const label = 'mb-1 block p-0 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-link'

export default function FilterFields({
  groups,
  onToggle,
  keywords,
  onKeyword,
  rowClass = 'min-h-11 text-[0.9375rem]',
  boxClass = 'size-5',
}) {
  return (
    <>
      {groups.map((group) => (
        <fieldset key={group.key} className="m-0 mb-3 border-0 p-0">
          <legend className={label}>{group.label}</legend>
          {group.options.map((o) => (
            <label key={o.value} className={`flex cursor-pointer items-center gap-3 ${rowClass}`}>
              <input
                type="checkbox"
                checked={o.checked}
                onChange={() => onToggle(group.key, o.value)}
                className={`m-0 accent-primary ${boxClass}`}
              />
              <span className="flex-1">{o.value}</span>
              <span className="text-[0.8125rem] text-fg-subtle">{o.count}</span>
            </label>
          ))}
        </fieldset>
      ))}
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
                  ? 'border-chip-line bg-chip-bg text-chip-fg'
                  : 'border-chip-off-line bg-chip-off-bg text-chip-off-fg hover:bg-fg/10'
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
