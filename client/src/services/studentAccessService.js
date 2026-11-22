import api from './api'
import { getFileDownloadUrl } from '../utils/helpers'

export async function listMyAccessRequests() {
  const res = await api.get('/student/access-requests')
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function consumeMyAccessRequest(id) {
  const res = await api.post(`/student/access-requests/${id}/consume`)
  const d = res.data?.data
  if (!d) return { state: 'invalid', paperSlug: null, fileUrl: '' }
  const fileUrl = d.fileUrl ? getFileDownloadUrl(d.fileUrl) : ''
  return { state: d.state, paperSlug: d.paperSlug, fileUrl }
}