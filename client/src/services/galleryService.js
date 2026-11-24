import api from './api'

// --- Lightweight client cache (SWR-style) ---------------------------------
// Public gallery data changes rarely. Caching it in memory for a short TTL
// makes route navigation feel instant and avoids hammering the (free-tier)
// backend on every mount. The cache lives for the SPA session.
const CACHE_TTL_MS = 30_000
const cache = new Map()

function cacheKey(prefix, value) {
  return prefix + ':' + JSON.stringify(value ?? null)
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }
  return entry.data
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

export function invalidateGalleryCache() {
  cache.clear()
}

export async function fetchGalleryPapers(params = {}) {
  const key = cacheKey('list', params)
  const cached = getCached(key)
  if (cached !== undefined) return cached
  const res = await api.get('/public/papers', { params })
  const data = Array.isArray(res.data?.data) ? res.data.data : []
  setCached(key, data)
  return data
}

export function normalizeGalleryPaper(row) {
  return {
    id: row.id ?? row.submission_id,
    slug: row.slug,
    title: row.title,
    authors: Array.isArray(row.authors) ? row.authors : (row.authors ? String(row.authors).split(/[,;]/).map(s => s.trim()).filter(Boolean) : []),
    strand: row.strand || row.program || '',
    section: row.section || '',
    schoolYear: row.schoolYear ?? row.school_year ?? '',
    adviser: row.adviser ?? row.adviser_name ?? '',
    publishedAt: row.publishedAt ?? row.published_at ?? row.updated_at ?? row.created_at,
    featured: !!row.featured,
    keywords: Array.isArray(row.keywords) ? row.keywords : (row.keywords ? String(row.keywords).split(/[,;]/).map(s => s.trim()).filter(Boolean) : []),
    abstract: row.abstract || '',
    citation: row.citation || null,
  }
}

export async function getGalleryPaper(slug) {
  const key = cacheKey('paper', slug)
  const cached = getCached(key)
  if (cached !== undefined) return cached
  const res = await api.get(`/public/papers/${slug}`)
  const data = res.data?.data ? normalizeGalleryPaper(res.data.data) : null
  setCached(key, data)
  return data
}

export function getRelatedPapers(papers, paper, limit = 3) {
  return (papers || [])
    .filter((p) => p.id !== paper.id)
    .map((p) => ({
      paper: p,
      score:
        (p.keywords || []).filter((k) => (paper.keywords || []).includes(k)).length * 2 +
        (p.strand === paper.strand ? 1 : 0) +
        (p.schoolYear === paper.schoolYear ? 1 : 0),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.paper)
}

export const STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS']