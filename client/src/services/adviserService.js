import api from './api'
import { backendSupport } from './backendSupport'

const rows = (res) => (Array.isArray(res.data?.data) ? res.data.data : [])

export async function getDashboard() {
  const res = await api.get('/coordinator/groups/dashboard')
  return res.data?.data ?? null
}

export async function listMyGroups() {
  const res = await api.get('/groups')
  return rows(res)
}

export async function getGroup(id) {
  const res = await api.get(`/groups/${id}`)
  return res.data?.data ?? null
}

export async function createGroup(payload) {
  const res = await api.post('/groups', payload)
  const direct = res.data?.data?.group_id ?? res.data?.group_id
  if (direct || backendSupport.groupCreateReturnsId) return direct ?? null
  const list = await listMyGroups()
  const name = String(payload.group_name).trim().toLowerCase()
  const matches = list
    .filter((g) => String(g.group_name).trim().toLowerCase() === name)
    .sort((a, b) => Number(b.group_id) - Number(a.group_id))
  return matches[0]?.group_id ?? null
}

export async function updateGroup(id, payload) {
  await api.put(`/groups/${id}`, payload)
}

export async function addGroupMember(groupId, userId) {
  await api.post(`/groups/${groupId}/members`, { user_id: userId })
}

export async function removeGroupMember(groupId, userId) {
  await api.delete(`/groups/${groupId}/members/${userId}`)
}

export async function searchStudents(search) {
  const res = await api.get('/groups/search/students', { params: { search } })
  return rows(res)
}

export async function revokePanelAssignment(assignmentId) {
  await api.delete(`/coordinator/panel/${assignmentId}`)
}

export async function createPanelistInvite({ email, name }) {
  const res = await api.post('/invites', { email, name })
  return res.data
}

export async function listSubmissions(params = {}) {
  const res = await api.get('/coordinator/submissions', { params })
  return { data: rows(res), total: res.data?.pagination?.total ?? 0 }
}

export async function getSubmission(id) {
  const res = await api.get(`/coordinator/submissions/${id}`)
  return res.data?.data ?? null
}

export async function setSubmissionStage(id, stage) {
  await api.patch(`/coordinator/submissions/${id}/stage`, { stage })
}

export async function setSubmissionStatus(id, status) {
  await api.patch(`/coordinator/submissions/${id}/status`, { status })
}

export async function addFeedbackComment(id, text) {
  await api.post(`/faculty/submissions/${id}/comment`, { comment_text: text })
}

export async function uploadSubmissionFile(id, file) {
  const body = new FormData()
  body.append('file', file)
  await api.post(`/coordinator/submissions/${id}/files`, body)
}

export async function setSubmissionConsent(id, granted) {
  await api.post(`/coordinator/submissions/${id}/consent`, { granted })
}

export async function publishSubmission(id, { citation, consentGranted }) {
  await api.post(`/coordinator/submissions/${id}/publish`, { citation: citation || null, consentGranted })
}

export async function unpublishSubmission(id, reason) {
  await api.post(`/coordinator/submissions/${id}/unpublish`, { reason })
}