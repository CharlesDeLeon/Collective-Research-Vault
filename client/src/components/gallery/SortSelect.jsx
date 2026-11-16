import { ChevronDownIcon } from '../dashboard/icons'

export default function SortSelect({ value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label="Sort by"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full appearance-none rounded-xl border-[0.094rem] border-white/35 bg-[#1b2653] py-0 pl-3.5 pr-10 text-sm text-white"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="az">Title A to Z</option>
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-white/80" />
    </div>
  )
}