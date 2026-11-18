import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { galleryPapers, STRANDS, SECTIONS, SCHOOL_YEARS, KEYWORD_OPTIONS } from '../services/galleryData'

const PAGE_SIZE = 12
const SORTS = ['newest', 'oldest', 'az']
const FEATURED_COUNT = 3

const GROUPS = [
  { key: 'strand', label: 'Strand', field: 'strand', values: STRANDS },
  { key: 'section', label: 'Section', field: 'section', values: SECTIONS },
  { key: 'year', label: 'School year', field: 'schoolYear', values: SCHOOL_YEARS },
]

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
  const selected = Object.fromEntries(GROUPS.map((g) => [g.key, params.getAll(g.key)]))
  const keywords = params.getAll('kw')
  const sortParam = params.get('sort')
  const sort = SORTS.includes(sortParam) ? sortParam : 'newest'

  const write = (patch) => {
    const next = { query, selected, keywords, sort, ...patch }
    const out = new URLSearchParams()
    if (next.query) out.set('q', next.query)
    GROUPS.forEach((g) => next.selected[g.key].forEach((v) => out.append(g.key, v)))
    next.keywords.forEach((v) => out.append('kw', v))
    if (next.sort !== 'newest') out.set('sort', next.sort)
    setParams(out, { replace: true })
    setLimit(PAGE_SIZE)
  }

  const needle = query.trim().toLowerCase()
  const activeFilterCount =
    GROUPS.reduce((sum, g) => sum + selected[g.key].length, 0) + keywords.length
  const hasFilters = Boolean(needle) || activeFilterCount > 0

  const results = galleryPapers
    .filter((p) => {
      const haystack = `${p.title} ${p.authors.join(' ')} ${p.keywords.join(' ')}`.toLowerCase()
      if (needle && !haystack.includes(needle)) return false
      if (!GROUPS.every((g) => !selected[g.key].length || selected[g.key].includes(p[g.field]))) return false
      if (keywords.length && !p.keywords.some((k) => keywords.includes(k))) return false
      return true
    })
    .sort(sorters[sort])

  const groups = GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    options: g.values
      .map((value) => ({
        value,
        count: galleryPapers.filter((p) => p[g.field] === value).length,
        checked: selected[g.key].includes(value),
      }))
      .filter((o) => o.count > 0 || o.checked),
  })).filter((g) => g.options.length > 0)

  const chips = [
    ...GROUPS.flatMap((g) =>
      selected[g.key].map((value) => ({
        key: `${g.key}-${value}`,
        label: value,
        remove: () => write({ selected: { ...selected, [g.key]: flip(selected[g.key], value) } }),
      }))
    ),
    ...keywords.map((value) => ({
      key: `kw-${value}`,
      label: value,
      remove: () => write({ keywords: flip(keywords, value) }),
    })),
  ]

  return {
    query,
    setQuery: (value) => write({ query: value }),
    sort,
    setSort: (value) => write({ sort: value }),
    toggle: (key, value) => write({ selected: { ...selected, [key]: flip(selected[key], value) } }),
    toggleKeyword: (value) => write({ keywords: flip(keywords, value) }),
    clearAll: () =>
      write({
        query: '',
        selected: Object.fromEntries(GROUPS.map((g) => [g.key, []])),
        keywords: [],
      }),
    groups,
    keywordOptions: KEYWORD_OPTIONS.map((value) => ({ value, on: keywords.includes(value) })),
    chips,
    activeFilterCount,
    hasFilters,
    showFeatured: !hasFilters,
    featured: galleryPapers.filter((p) => p.featured).slice(0, FEATURED_COUNT),
    papers: results.slice(0, limit),
    total: results.length,
    hasMore: results.length > limit,
    loadMore: () => setLimit((n) => n + PAGE_SIZE),
  }
}