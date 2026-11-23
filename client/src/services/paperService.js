import api from './api'

function normalizeConsent(value, row = {}) {
  const nested = value && typeof value === 'object' ? value : {}
  let status =
    (typeof value === 'string' ? value : nested.status) ??
    row.consent_status ??
    row.author_consent_status ??
    nested.consent_status

  // The adviser endpoints expose consent timing as `author_consent_at` on the row.
  if (!status) {
    if (nested.granted === true || row.author_consent_at) status = 'granted'
    else if (nested.granted === false || nested.declined === true || row.consent_withdrawn_at) status = 'declined'
  }
  if (status === 'withdrawn' || status === 'revoked') status = 'declined'

  return {
    status: ['granted', 'declined', 'pending'].includes(status) ? status : 'pending',
    at:
      nested.at ??
      nested.author_consent_at ??
      nested.consent_at ??
      row.consent_at ??
      row.author_consent_at ??
      null,
  }
}

function normalizeCurrentFile(d) {
  const f = d.file ?? d.currentFile ?? d.current_file
  const filePath = f?.filePath ?? f?.file_path ?? f?.path ?? ''
  if (!filePath) return null
  return { fileName: f.fileName ?? f.file_name ?? 'Paper file', filePath }
}

function normalizeStatusHistory(value) {
  if (!Array.isArray(value)) return []
  return value.map((h) => ({
    status: h.status,
    at: h.at ?? h.created_at ?? h.changed_at ?? h.timestamp ?? null,
    note: h.note ?? h.notes ?? '',
    by: h.by ?? h.changed_by ?? h.actor ?? h.actor_name ?? '',
  }))
}

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
    consent: normalizeConsent(row.consent ?? row.consent_status, row),
    videoUrl: row.video_url ?? row.videoUrl ?? '',
  }
}

export async function getMyPapers() {
  const res = await api.get('/papers/my')
  const rows = Array.isArray(res.data) ? res.data : res.data?.data
  if (!Array.isArray(rows)) throw new Error('Unexpected response from the server.')
  return rows.map(normalizePaper)
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
    id: d.submission_id ?? d.paper_id,
    groupId: d.group_id ?? null,
    title: d.title,
    status: d.status,
    abstract: d.abstract,
    keywords: d.keywords ? String(d.keywords).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : [],
    program: d.program,
    strand: d.strand || d.program,
    section: d.section,
    schoolYear: d.school_year,
    groupName: d.group_name,
    createdAt: d.created_at,
    updatedAt: d.updated_at ?? d.created_at,
    authors: splitAuthors(d.authors),
    consent: normalizeConsent(d.consent ?? d.consent_status, d),
    statusHistory: normalizeStatusHistory(d.statusHistory ?? d.status_history ?? d.history),
    videoUrl: d.video_url ?? d.videoUrl ?? '',
    file: normalizeCurrentFile(d),
    notes: (d.reviews ?? []).flatMap((r) =>
      (r.comments ?? []).map((c) => ({
        id: c.comment_id,
        authorName: c.author_name,
        text: c.comment_text,
        createdAt: c.created_at,
        resolved: c.resolved ?? false,
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
    video_url: payload.videoUrl ?? payload.video_url,
  }
  const res = await api.patch(`/papers/${paperId}`, body)
  return res.data
}

export async function setPaperConsent(paperId, granted) {
  const res = await api.post(`/papers/${paperId}/consent`, { granted })
  return res.data
}

export async function resolveFeedbackNote(paperId, noteId) {
  const res = await api.post(`/papers/${paperId}/feedback/${noteId}/resolve`)
  return res.data
}

export async function dismissFeedbackNote(paperId, noteId) {
  const res = await api.post(`/papers/${paperId}/feedback/${noteId}/dismiss`)
  return res.data
}

export async function resubmitPaper(paperId) {
  const res = await api.post(`/papers/${paperId}/resubmit`)
  return res.data
}