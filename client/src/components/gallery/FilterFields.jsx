const label = 'mb-1 block p-0 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-link'

export default function FilterFields({
  groups,
  onToggle,
  searches,
  onSearch,
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
                type="radio"
                name={group.key}
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
        <h3 className={`${label} mb-2.5`}>Popular searches</h3>
        <div className="flex flex-wrap gap-2">
          {searches.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSearch(value)}
              className="min-h-10 rounded-full border border-white/40 bg-transparent px-3.5 text-[0.8125rem] text-white/90 hover:bg-white/10 sm:min-h-9"
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
