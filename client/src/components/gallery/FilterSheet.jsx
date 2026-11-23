import { useEffect } from 'react'
import { CloseIcon } from '../dashboard/icons'
import FilterFields from './FilterFields'

export default function FilterSheet({ open, onClose, g }) {
  useEffect(() => {
    if (!open) return undefined
    const esc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(10_16_48/0.55)]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl border border-b-0 border-white/15 bg-[#1b2653] shadow-[0_-0.75rem_2.5rem_rgba(0,0,0,0.4)]"
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-white/35" />
        </div>
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="m-0 text-xl font-semibold">Filters</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full bg-white/10 text-white"
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>
        <div className="overflow-auto px-5 pb-2">
          <FilterFields
            groups={g.groups}
            onToggle={g.toggle}
            searches={g.popularSearches}
            onSearch={g.applySearch}
            rowClass="min-h-12 text-base"
            boxClass="size-5.5"
          />
        </div>
        <div className="flex gap-3 border-t border-white/10 px-5 pb-6 pt-3">
          <button
            type="button"
            onClick={g.clearAll}
            className="min-h-13 shrink-0 rounded-xl border-[0.094rem] border-white/35 bg-transparent px-5 text-[0.9375rem] font-medium"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-13 flex-1 rounded-xl bg-linear-to-br from-gold to-gold-soft text-base font-semibold text-ink"
          >
            Show results
          </button>
        </div>
      </section>
    </div>
  )
}