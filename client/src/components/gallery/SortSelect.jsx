import { ChevronDownIcon } from '../dashboard/icons'

export default function SortSelect({ value, onChange, className = '' }) {
  return (
    <div className={`grid items-center ${className}`}>
      <select
        aria-label="Sort by"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="col-start-1 row-start-1 min-h-11 w-full appearance-none rounded-xl border-[0.094rem] border-control-line bg-sheet-bg py-0 pl-[0.875rem] pr-[2.5rem] text-sm text-input-fg"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="az">Title A to Z</option>
      </select>
      <ChevronDownIcon className="pointer-events-none col-start-1 row-start-1 mr-[0.875rem] size-[1rem] justify-self-end text-fg-soft" />
    </div>
  )
}
