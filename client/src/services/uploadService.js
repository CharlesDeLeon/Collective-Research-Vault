import api from './api'

export const FILE_FIELD = 'file'
export const MAX_FILE_MB = 20
export const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx']

export async function getMyGroups() {
  const res = await api.get('/papers/my-groups')
  const rows = res.data?.data ?? res.data
  if (!Array.isArray(rows)) throw new Error('Unexpected response from the server.')
  return rows
}

export async function uploadPaper({ title, authors, program, year, schoolYear, groupId, abstract, keywords, videoUrl, file }) {
  const body = new FormData()
  body.append('title', title)
  body.append('authors', authors)
  body.append('program', program)
  if (year) body.append('year', year)
  if (schoolYear) body.append('school_year', schoolYear)
  if (abstract) body.append('abstract', abstract)
  if (keywords) body.append('keywords', keywords)
  if (videoUrl) body.append('video_url', videoUrl)
  body.append('group_id', groupId)
  body.append(FILE_FIELD, file)
  const res = await api.post('/papers/upload', body)
  return res.data
}

// Replaces the current file in place — no new version is created (handoff: no versioning).
export async function replacePaperFile(paperId, file) {
  const body = new FormData()
  body.append(FILE_FIELD, file)
  const res = await api.post(`/papers/${paperId}/file`, body)
  return res.data
}
