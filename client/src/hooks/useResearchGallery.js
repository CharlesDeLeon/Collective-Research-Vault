import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchGalleryPapers, normalizeGalleryPaper, STRANDS } from '../services/galleryService'

const PAGE_SIZE = 12
const FEATURED_COUNT = 3

export { STRANDS }

export const SECTIONS = []
export const SCHOOL_YEARS = []
export const KEYWORD_OPTIONS = []

export function useResearchGallery() {
  const [params, setParams] = useSearchParams()
  const [pageState, setPageState] = useState({ key: '', page: 0 })
  const [result, setResult] = useState({ key: '', rows: [], error: null })
  const [catalog, setCatalog] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchGalleryPapers({ limit: 500 }),
      fetchGalleryPapers({ featured: 'true', limit: FEATURED_COUNT }),
    ])
      .then(([all, featuredRows]) => {
        if (!cancelled) {
          setCatalog(all.map(normalizeGalleryPaper))
          setFeatured(featuredRows.map(normalizeGalleryPaper).slice(0, FEATURED_COUNT))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const query = params.get('q') ?? ''
  const term = query.trim()
  const strand = params.get('strand') || ''
  const section = params.get('section') || ''
  const year = params.get('year') || ''
  const selected = { strand, section, year }

  const viewKey = [term, strand, section, year].join('|')
  const page = pageState.key === viewKey ? pageState.page : 0
  const visibleLimit = (page + 1) * PAGE_SIZE
  const requestLimit = visibleLimit + 1
  const requestKey = [term, strand, section, year, requestLimit].join('|')

  useEffect(() => {
    let cancelled = false
    const request = {}
    if (term) request.q = term
    if (strand) request.strand = strand
    if (section) request.section = section
    if (year) request.year = year
    request.limit = requestLimit
    request.offset = 0
    fetchGalleryPapers(request)
      .then((rows) => {
        if (!cancelled) setResult({ key: requestKey, rows: rows.map(normalizeGalleryPaper), error: null })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, rows: [], error: 'Failed to load gallery' })
      })
    return () => {
      cancelled = true
    }
  }, [term, strand, section, year, requestLimit, requestKey])

  const loading = result.key !== requestKey
  const rows = result.rows
  const error = result.key === requestKey ? result.error : null

  const write = (patch) => {
    const next = { query, selected, ...patch }
    const out = new URLSearchParams()
    if (next.query) out.set('q', next.query)
    if (next.selected.strand) out.set('strand', next.selected.strand)
    if (next.selected.section) out.set('section', next.selected.section)
    if (next.selected.year) out.set('year', next.selected.year)
    setParams(out, { replace: true })
  }

  const GROUPS = [
    { key: 'strand', label: 'Strand', field: 'strand', values: [...new Set(catalog.map((p) => p.strand).filter(Boolean))] },
    { key: 'section', label: 'Section', field: 'section', values: [...new Set(catalog.map((p) => p.section).filter(Boolean))] },
    { key: 'year', label: 'School year', field: 'schoolYear', values: [...new Set(catalog.map((p) => p.schoolYear).filter(Boolean))] },
  ]

  const activeFilterCount = GROUPS.filter((g) => selected[g.key]).length + (term ? 1 : 0)
  const hasFilters = activeFilterCount > 0

  const results = rows
    .slice(0, visibleLimit)
    .filter((p) => {
      if (strand && p.strand !== strand) return false
      if (section && p.section !== section) return false
      if (year && p.schoolYear !== year) return false
      return true
    })

  const groups = GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    options: g.values
      .map((value) => ({
        value,
        count: catalog.filter((p) => p[g.field] === value).length,
        checked: selected[g.key] === value,
      }))
      .filter((o) => o.count > 0 || o.checked),
  })).filter((g) => g.options.length > 0)

  const chips = [
    ...(term ? [{ key: 'query', label: `Search: ${term}`, remove: () => write({ query: '' }) }] : []),
    ...GROUPS.filter((g) => selected[g.key]).map((g) => ({
      key: g.key,
      label: `${g.label}: ${selected[g.key]}`,
      remove: () => write({ selected: { ...selected, [g.key]: '' } }),
    })),
  ]

  const searchCounts = catalog
    .flatMap((p) => p.keywords || [])
    .reduce((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {})
  const popularSearches = Object.keys(searchCounts)
    .sort((a, b) => searchCounts[b] - searchCounts[a] || a.localeCompare(b))
    .slice(0, 8)

  return {
    query,
    setQuery: (value) => write({ query: value }),
    applySearch: (value) => write({ query: value }),
    toggle: (key, value) => write({ selected: { ...selected, [key]: selected[key] === value ? '' : value } }),
    clearAll: () =>
      write({
        query: '',
        selected: { strand: '', section: '', year: '' },
      }),
    groups,
    popularSearches,
    chips,
    activeFilterCount,
    hasFilters,
    showFeatured: !hasFilters,
    featured,
    papers: results,
    total: results.length,
    hasMore: rows.length > visibleLimit,
    loadMore: () => setPageState({ key: viewKey, page: page + 1 }),
    loading,
    error,
  }
}
