import api from './api'

export function normalizePaper(row) {
  return {
    id: row.paper_id ?? row.submission_id,
    title: row.title,
    status: row.status,
    groupName: row.group_name,
    program: row.program,
    schoolYear: row.school_year,
    strand: row.strand || row.program,
    section: row.section,
    updatedAt: row.uploaded_at ?? row.updated_at ?? row.created_at,
    createdAt: row.created_at,
  }
}

export async function getMyPapers() {
  const res = await api.get('/papers/my')
  if (!Array.isArray(res.data)) throw new Error('Unexpected response from the server.')
  return res.data.map(normalizePaper)
}

export function splitAuthors(value) {
  if (!value) return []
  const separator = value.includes(';') || value.includes('\n') ? /[;\n]/ : ','
  return value
    .split(separator)
    .map((name) => name.trim())
    .filter(Boolean)
}

export function normalizePaperDetail(d) {
  return {
    id: d.submission_id,
    title: d.title,
    status: d.status,
    abstract: d.abstract,
    keywords: d.keywords ? String(d.keywords).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [],
    program: d.program,
    strand: d.strand || d.program,
    section: d.section,
    schoolYear: d.school_year,
    groupName: d.group_name,
    createdAt: d.created_at,
    updatedAt: d.updated_at ?? d.created_at,
    authors: splitAuthors(d.authors),
    versions: (d.versions ?? []).map((v) => ({
      number: v.version_number,
      fileName: v.file_name,
      filePath: v.file_path,
      uploadedAt: v.uploaded_at,
    })),
    notes: (d.reviews ?? []).flatMap((r) =>
      (r.comments ?? []).map((c) => ({
        id: c.comment_id,
        authorName: c.author_name,
        text: c.comment_text,
        createdAt: c.created_at,
      }))
    ),
  }
}

export async function getPaperDetail(paperId) {
  const res = await api.get(`/papers/${paperId}`)
  return normalizePaperDetail(res.data)
}

export async function updatePaper(paperId, payload) {
  const body = {
    title: payload.title,
    abstract: payload.abstract,
    keywords: Array.isArray(payload.keywords) ? payload.keywords.join(', ') : payload.keywords,
    authors: Array.isArray(payload.authors) ? payload.authors.join(', ') : payload.authors,
    program: payload.program,
    school_year: payload.schoolYear ?? payload.school_year,
  }
  const res = await api.patch(`/papers/${paperId}`, body)
  return res.data
}

export async function resubmitPaper(paperId) {
  const res = await api.post(`/papers/${paperId}/resubmit`)
  return res.data
}