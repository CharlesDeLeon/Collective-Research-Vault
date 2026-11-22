import api from './api'

export async function listPanelistInvites() {
  const res = await api.get('/invites')
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function createPanelistInvite({ email, name }) {
  const res = await api.post('/invites', { email, name })
  return res.data
}

export async function validatePanelistInvite(token) {
  const res = await api.get(`/invites/${token}`)
  return res.data
}

export async function acceptPanelistInvite(token, { tempPassword, name, password }) {
  const res = await api.post(`/invites/${token}/accept`, { tempPassword, name, password })
  return res.data
}
