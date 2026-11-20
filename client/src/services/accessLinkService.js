import api from './api'

export async function getAccessLink(token) {
  try {
    const res = await api.get(`/public/access/${encodeURIComponent(token)}`)
    const d = res.data?.data
    if (!d) return { state: 'invalid', paperSlug: null }
    return { state: d.state, paperSlug: d.paperSlug }
  } catch {
    return { state: 'invalid', paperSlug: null }
  }
}

export async function consumeAccessLink(token) {
  try {
    const res = await api.get(`/public/access/${encodeURIComponent(token)}/view`)
    const d = res.data?.data
    if (!d) return { state: 'invalid', paperSlug: null, fileUrl: '' }
    return { state: d.state, paperSlug: d.paperSlug, fileUrl: d.fileUrl || '' }
  } catch {
    return { state: 'invalid', paperSlug: null, fileUrl: '' }
  }
}