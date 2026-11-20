import api from './api'

export async function fetchGalleryPapers(params = {}) {
  const res = await api.get('/public/papers', { params })
  return Array.isArray(res.data?.data) ? res.data.data : []
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
  const res = await api.get(`/public/papers/${slug}`)
  return res.data?.data ? normalizeGalleryPaper(res.data.data) : null
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