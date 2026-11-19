import api from './api'

export const FILE_FIELD = 'file'
export const MAX_FILE_MB = 20
export const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx']

export async function getMyGroups() {
  const res = await api.get('/papers/my-groups')
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function uploadPaper({ title, authors, program, year, schoolYear, groupId, abstract, keywords, file }) {
  const body = new FormData()
  body.append('title', title)
  body.append('authors', authors)
  body.append('program', program)
  if (year) body.append('year', year)
  if (schoolYear) body.append('school_year', schoolYear)
  if (abstract) body.append('abstract', abstract)
  if (keywords) body.append('keywords', keywords)
  body.append('group_id', groupId)
  body.append(FILE_FIELD, file)
  const res = await api.post('/papers/upload', body)
  return res.data
}

export async function uploadPaperVersion({ paperId, file }) {
  const body = new FormData()
  body.append(FILE_FIELD, file)
  const res = await api.post(`/papers/${paperId}/versions`, body)
  return res.data
}