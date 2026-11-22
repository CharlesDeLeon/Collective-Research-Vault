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
        className="absolute inset-0 bg-sheet-overlay"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl border border-b-0 border-line-strong bg-sheet-bg sheet-shadow"
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-fg/35" />
        </div>
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="m-0 text-xl font-semibold text-heading">Filters</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full bg-fg/10 text-fg"
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>
        <div className="overflow-auto px-5 pb-2">
          <FilterFields
            groups={g.groups}
            onToggle={g.toggle}
            keywords={g.keywordOptions}
            onKeyword={g.toggleKeyword}
            rowClass="min-h-12 text-base"
            boxClass="size-5.5"
          />
        </div>
        <div className="flex gap-3 border-t border-line-soft px-5 pb-6 pt-3">
          <button
            type="button"
            onClick={g.clearAll}
            className="min-h-13 shrink-0 rounded-xl border-[0.094rem] border-control-line bg-transparent px-5 text-[0.9375rem] font-medium text-fg"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-13 flex-1 rounded-xl bg-cta text-base font-semibold text-cta-fg"
          >
            Show {g.total} {g.total === 1 ? 'paper' : 'papers'}
          </button>
        </div>
      </section>
    </div>
  )
}
