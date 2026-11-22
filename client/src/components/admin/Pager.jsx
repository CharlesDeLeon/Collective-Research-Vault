const btn =
  'rounded-lg border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export default function Pager({ page, hasNext, onPage, summary }) {
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
      <p>{summary}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn}>
          Previous
        </button>
        <span>Page {page}</span>
        <button type="button" onClick={() => onPage(page + 1)} disabled={!hasNext} className={btn}>
          Next
        </button>
      </div>
    </nav>
  )
}