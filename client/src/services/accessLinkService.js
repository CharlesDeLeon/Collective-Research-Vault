import api from './api'
import { getFileDownloadUrl } from '../utils/helpers'

export async function getAccessLink(token) {
  try {
    const res = await api.get(`/public/access/${encodeURIComponent(token)}`)
    const d = res.data?.data
    if (!d) return { state: 'invalid', paperSlug: null, paperTitle: null }
    return { state: d.state, paperSlug: d.paperSlug, paperTitle: d.paperTitle || null }
  } catch {
    return { state: 'invalid', paperSlug: null, paperTitle: null }
  }
}

export async function consumeAccessLink(token) {
  try {
    const res = await api.get(`/public/access/${encodeURIComponent(token)}/view`)
    const d = res.data?.data
    if (!d) return { state: 'invalid', paperSlug: null, paperTitle: null, fileUrl: '' }
    const fileUrl = d.fileUrl ? getFileDownloadUrl(d.fileUrl) : ''
    return { state: d.state, paperSlug: d.paperSlug, paperTitle: d.paperTitle || null, fileUrl }
  } catch {
    return { state: 'invalid', paperSlug: null, paperTitle: null, fileUrl: '' }
  }
}