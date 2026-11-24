import api from './api'

export async function submitAccessRequest(paperSlug, payload) {
  const res = await api.post('/public/access-requests', {
    paperSlug,
    name: payload.name,
    email: payload.email,
    institution: payload.institution,
    purpose: payload.purpose,
    consent: payload.consent === true,
  })
  return { ref: res.data?.data?.ref }
}

export async function getRequestStatus(ref) {
  const res = await api.get(`/public/access/status/${encodeURIComponent(ref)}`)
  const d = res.data?.data
  if (!d) return null
  return {
    ref: d.ref,
    paperSlug: d.paperSlug,
    paperTitle: d.paperTitle ?? null,
    status: d.status,
    createdAt: d.createdAt,
    decidedAt: d.decidedAt ?? d.decided_at ?? d.updatedAt ?? d.updated_at ?? null,
    reason: d.decisionNote || '',
    linkStatus: d.linkStatus ?? null,
  }
}
