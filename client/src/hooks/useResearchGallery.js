import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchGalleryPapers, normalizeGalleryPaper, STRANDS } from '../services/galleryService'

const PAGE_SIZE = 12
const SORTS = ['newest', 'oldest', 'az']
const FEATURED_COUNT = 3

export { STRANDS }

export const SECTIONS = []
export const SCHOOL_YEARS = []
export const KEYWORD_OPTIONS = []

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
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchGalleryPapers()
      .then((rows) => {
        if (!cancelled) setPapers(rows.map(normalizeGalleryPaper))
      })
      .catch(() => { if (!cancelled) setError('Failed to load gallery') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const query = params.get('q') ?? ''
  const selected = {
    strand: params.getAll('strand'),
    section: params.getAll('section'),
    year: params.getAll('year'),
  }
  const keywords = params.getAll('kw')
  const sortParam = params.get('sort')
  const sort = SORTS.includes(sortParam) ? sortParam : 'newest'

  const write = (patch) => {
    const next = { query, selected, keywords, sort, ...patch }
    const out = new URLSearchParams()
    if (next.query) out.set('q', next.query)
    ;['strand', 'section', 'year'].forEach((k) => next.selected[k].forEach((v) => out.append(k, v)))
    next.keywords.forEach((v) => out.append('kw', v))
    if (next.sort !== 'newest') out.set('sort', next.sort)
    setParams(out, { replace: true })
    setLimit(PAGE_SIZE)
  }

  const GROUPS = [
    { key: 'strand', label: 'Strand', field: 'strand', values: [...new Set(papers.map((p) => p.strand).filter(Boolean))] },
    { key: 'section', label: 'Section', field: 'section', values: [...new Set(papers.map((p) => p.section).filter(Boolean))] },
    { key: 'year', label: 'School year', field: 'schoolYear', values: [...new Set(papers.map((p) => p.schoolYear).filter(Boolean))] },
  ]

  const needle = query.trim().toLowerCase()
  const activeFilterCount =
    GROUPS.reduce((sum, g) => sum + selected[g.key].length, 0) + keywords.length
  const hasFilters = Boolean(needle) || activeFilterCount > 0

  const results = papers
    .filter((p) => {
      const haystack = `${p.title} ${(p.authors || []).join(' ')} ${(p.keywords || []).join(' ')}`.toLowerCase()
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
        count: papers.filter((p) => p[g.field] === value).length,
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

  const keywordCounts = papers
    .flatMap((p) => p.keywords || [])
    .reduce((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {})
  const keywordOptions = Object.keys(keywordCounts)
    .sort((a, b) => keywordCounts[b] - keywordCounts[a] || a.localeCompare(b))
    .slice(0, 8)
    .map((value) => ({ value, on: keywords.includes(value) }))

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
        selected: { strand: [], section: [], year: [] },
        keywords: [],
      }),
    groups,
    keywordOptions,
    chips,
    activeFilterCount,
    hasFilters,
    showFeatured: !hasFilters,
    featured: papers.filter((p) => p.featured).slice(0, FEATURED_COUNT),
    papers: results.slice(0, limit),
    total: results.length,
    hasMore: results.length > limit,
    loadMore: () => setLimit((n) => n + PAGE_SIZE),
    loading,
    error,
  }
}