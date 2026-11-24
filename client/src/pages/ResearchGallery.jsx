import { useState } from 'react'
import { useResearchGallery } from '../hooks/useResearchGallery'
import GalleryNavbar from '../components/gallery/GalleryNavbar'
import GalleryCard from '../components/gallery/GalleryCard'
import FeaturedRow from '../components/gallery/FeaturedRow'
import FilterFields from '../components/gallery/FilterFields'
import FilterSheet from '../components/gallery/FilterSheet'
import { SearchIcon, CloseIcon } from '../components/dashboard/icons'

export default function ResearchGallery() {
  const g = useResearchGallery()
  const [sheet, setSheet] = useState(false)
  const countText = `Showing ${g.total} ${g.total === 1 ? 'paper' : 'papers'}`

  return (
    <div className="min-h-screen bg-page font-display text-fg">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />

        <section className="pb-2 pt-4 sm:pt-6">
          <h1 className="m-0 text-[1.625rem] font-semibold leading-tight text-heading sm:text-4xl">
            Finished research from our students
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-fg/80 sm:mt-3 sm:text-[1.0625rem]">
            Browse published theses and capstone projects. No account needed.
          </p>
          <div className="relative mt-5 max-w-2xl sm:mt-6">
            <SearchIcon className="pointer-events-none absolute left-4 top-3.5 size-5 text-fg-muted sm:left-5 sm:top-4" />
            <input
              type="search"
              value={g.query}
              onChange={(e) => g.setQuery(e.target.value)}
              aria-label="Search title, author or keyword"
              placeholder="Search title, author or keyword"
              className="h-12 w-full rounded-full border-[0.094rem] border-input-line bg-input-bg pl-12 pr-5 text-[0.9375rem] text-input-fg placeholder:text-placeholder sm:h-13 sm:pl-13 sm:text-base"
            />
          </div>
        </section>

        {g.showFeatured && <FeaturedRow papers={g.featured} />}

        <div className="mt-8 flex flex-col items-start gap-8 sm:mt-10 lg:flex-row">
          <aside
            aria-label="Filters"
            className="hidden w-68 shrink-0 rounded-card border border-panel-line bg-sidebar p-5 panel-shadow lg:block"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 text-lg font-semibold text-heading">Filters</h2>
              {g.hasFilters && (
                <button
                  type="button"
                  onClick={g.clearAll}
                  className="min-h-11 px-1 text-sm font-medium text-link"
                >
                  Clear all
                </button>
              )}
            </div>
            <FilterFields
              groups={g.groups}
              onToggle={g.toggle}
              searches={g.popularSearches}
              onSearch={g.applySearch}
            />
          </aside>

          <section aria-label="Results" className="w-full min-w-0 flex-1">
            <div className="mb-3 flex gap-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => setSheet(true)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[0.094rem] border-link text-[0.9375rem] font-medium text-link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                Filters
                {g.activeFilterCount > 0 && (
                  <span className="grid h-5.5 min-w-5.5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-fg">
                    {g.activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p aria-live="polite" className="m-0 text-base font-semibold text-fg">
                  {countText}
                </p>
                <p className="m-0 mt-1 text-xs text-fg/60">
                  This count reflects the papers loaded here, not a full vault total.
                </p>
              </div>
            </div>

            {g.chips.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {g.chips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex max-w-full min-w-0 min-h-9 items-center gap-1 rounded-full bg-filter-chip-bg py-0 pl-3.5 pr-1.5 text-sm font-medium text-filter-chip-fg ring-1 ring-inset ring-filter-chip-line"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={c.remove}
                      aria-label={`Remove ${c.label}`}
                      className="grid size-7 place-items-center rounded-full text-filter-chip-fg"
                    >
                      <CloseIcon className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {g.total > 0 ? (
              <>
                <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
                  {g.papers.map((p) => (
                    <GalleryCard key={p.id} paper={p} />
                  ))}
                </div>
                {g.hasMore && (
                  <div className="mt-7 flex justify-center">
                    <button
                      type="button"
                      onClick={g.loadMore}
                      className="min-h-12 rounded-xl border-[0.094rem] border-link px-8 text-base font-medium text-link hover:bg-link/10"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 rounded-card border-[0.094rem] border-dashed border-control-line-soft px-6 py-12 text-center">
                <p className="m-0 text-lg font-semibold text-heading">No research matches your search</p>
                <p className="mb-5 mt-2 text-[0.9375rem] text-fg/80">Try different words, or remove a filter.</p>
                <button
                  type="button"
                  onClick={g.clearAll}
                  className="min-h-12 rounded-xl bg-cta px-7 text-base font-semibold text-cta-fg"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      <FilterSheet open={sheet} onClose={() => setSheet(false)} g={g} />
    </div>
  )
}
