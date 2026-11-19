import api from './api'

export async function listAccessRequests(params = {}) {
  const res = await api.get('/adviser/access-requests', { params })
  return {
    data: Array.isArray(res.data?.data) ? res.data.data : [],
    counts: res.data?.counts || {},
  }
}

export async function getAccessRequest(id) {
  const res = await api.get(`/adviser/access-requests/${id}`)
  return res.data?.data || null
}

export async function approveAccessRequest(id, note = '') {
  const res = await api.post(`/adviser/access-requests/${id}/approve`, { note })
  return res.data?.data || null
}

export async function declineAccessRequest(id, note = '') {
  const res = await api.post(`/adviser/access-requests/${id}/decline`, { note })
  return res.data || null
}

export async function revokeAccessLink(linkId) {
  const res = await api.post(`/adviser/access-links/${linkId}/revoke`)
  return res.data || null
}