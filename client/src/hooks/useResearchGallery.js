import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { galleryPapers, SCHOOL_YEARS, KEYWORD_OPTIONS } from '../services/galleryData'

const PAGE_SIZE = 12
const SORTS = ['newest', 'oldest', 'az']
const FEATURED_COUNT = 3

const flip = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

const sorters = {
  newest: (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  oldest: (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt),
  az: (a, b) => a.title.localeCompare(b.title),
}

export function useResearchGallery() {
  const [params, setParams] = useSearchParams()
  const [limit, setLimit] = useState(PAGE_SIZE)

  const query = params.get('q') ?? ''
  const years = params.getAll('year')
  const keywords = params.getAll('kw')
  const sortParam = params.get('sort')
  const sort = SORTS.includes(sortParam) ? sortParam : 'newest'

  const write = (next) => {
    const merged = { query, years, keywords, sort, ...next }
    const out = new URLSearchParams()
    if (merged.query) out.set('q', merged.query)
    merged.years.forEach((v) => out.append('year', v))
    merged.keywords.forEach((v) => out.append('kw', v))
    if (merged.sort !== 'newest') out.set('sort', merged.sort)
    setParams(out, { replace: true })
    setLimit(PAGE_SIZE)
  }

  const needle = query.trim().toLowerCase()
  const hasFilters = Boolean(needle || years.length || keywords.length)

  const results = galleryPapers
    .filter((p) => {
      const haystack = `${p.title} ${p.authors} ${p.keywords.join(' ')}`.toLowerCase()
      if (needle && !haystack.includes(needle)) return false
      if (years.length && !years.includes(p.schoolYear)) return false
      if (keywords.length && !p.keywords.some((k) => keywords.includes(k))) return false
      return true
    })
    .sort(sorters[sort])

  const yearOptions = SCHOOL_YEARS.map((value) => ({
    value,
    count: galleryPapers.filter((p) => p.schoolYear === value).length,
    checked: years.includes(value),
  }))

  const keywordOptions = KEYWORD_OPTIONS.map((value) => ({ value, on: keywords.includes(value) }))

  const chips = [
    ...years.map((value) => ({ key: `year-${value}`, label: value, remove: () => write({ years: flip(years, value) }) })),
    ...keywords.map((value) => ({ key: `kw-${value}`, label: value, remove: () => write({ keywords: flip(keywords, value) }) })),
  ]

  return {
    query,
    setQuery: (value) => write({ query: value }),
    sort,
    setSort: (value) => write({ sort: value }),
    toggleYear: (value) => write({ years: flip(years, value) }),
    toggleKeyword: (value) => write({ keywords: flip(keywords, value) }),
    clearAll: () => write({ query: '', years: [], keywords: [] }),
    yearOptions,
    keywordOptions,
    chips,
    activeFilterCount: years.length + keywords.length,
    hasFilters,
    showFeatured: !hasFilters,
    featured: galleryPapers.filter((p) => p.featured).slice(0, FEATURED_COUNT),
    papers: results.slice(0, limit),
    total: results.length,
    hasMore: results.length > limit,
    loadMore: () => setLimit((n) => n + PAGE_SIZE),
  }
}