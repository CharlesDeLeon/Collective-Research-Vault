import api from './api'

const rows = (res) => (Array.isArray(res.data?.data) ? res.data.data : [])

export async function getAdminUsers(params = {}) {
  const res = await api.get('/admin/users', { params })
  return { data: rows(res), total: res.data?.pagination?.total ?? 0 }
}

export async function getAdminUser(id) {
  const res = await api.get(`/admin/users/${id}`)
  return res.data ?? null
}

export async function createAdminUser(payload) {
  const res = await api.post('/admin/users', payload)
  return res.data?.userId ?? null
}

export async function updateAdminUser(id, patch) {
  await api.put(`/admin/users/${id}`, patch)
}

export async function changeAdminUserRole(id, role) {
  await api.patch(`/admin/users/${id}/role`, { role })
}

export async function deactivateAdminUser(id) {
  await api.delete(`/admin/users/${id}`)
}

export async function reactivateAdminUser(id) {
  await api.put(`/admin/users/${id}`, { status: 'active' })
}

export async function getUserRoleStats() {
  const res = await api.get('/admin/stats/users')
  return Array.isArray(res.data) ? res.data : []
}

export async function getRolePermissions() {
  const res = await api.get('/admin/roles/permissions')
  return res.data ?? {}
}

export async function getAuditLogs(params = {}) {
  const res = await api.get('/admin/audit-logs', { params })
  return { data: rows(res), total: res.data?.pagination?.total ?? 0 }
}

export async function getUserAudit(userId, mode, page, limit) {
  const scope = mode === 'by' ? { userId } : { targetType: 'user', targetId: userId }
  return getAuditLogs({ ...scope, page, limit })
}

export async function getAuditSummary() {
  const res = await api.get('/admin/audit-summary')
  return {
    actions: Array.isArray(res.data?.actionsByType) ? res.data.actionsByType : [],
    targets: Array.isArray(res.data?.actionsByTarget) ? res.data.actionsByTarget : [],
    actors: Array.isArray(res.data?.actionsByUser) ? res.data.actionsByUser : [],
  }
}

export async function getHealth() {
  const res = await api.get('/health')
  return res.data ?? {}
}

export const apiMessage = (error, fallback) => error?.response?.data?.message || fallback

export async function listAdminPosts(params = {}) {
  const res = await api.get('/forum/posts', { params })
  return rows(res)
}

export async function getAdminPost(id) {
  const res = await api.get(`/forum/posts/${id}`)
  return res.data?.data ?? null
}

export async function hideAdminPost(id, hidden) {
  await api.post(`/forum/posts/${id}/hide`, { hidden })
}

export async function removeAdminPost(id) {
  await api.post(`/forum/posts/${id}/remove`)
}

export async function restoreAdminPost(id) {
  await api.post(`/forum/posts/${id}/restore`)
}

export async function dismissAdminReport(id) {
  await api.post(`/forum/posts/${id}/dismiss-report`)
}

export async function hideAdminComment(id, hidden) {
  await api.post(`/forum/comments/${id}/hide`, { hidden })
}

export async function removeAdminComment(id) {
  await api.post(`/forum/comments/${id}/remove`)
}

export async function listAdminGroups() {
  const res = await api.get('/groups')
  return rows(res)
}

export async function getAdminGroup(id) {
  const res = await api.get(`/groups/${id}`)
  return res.data?.data ?? null
}

export async function createAdminGroup(payload) {
  const res = await api.post('/groups', payload)
  return res.data?.data?.group_id ?? null
}

export async function updateAdminGroup(id, patch) {
  await api.put(`/groups/${id}`, patch)
}

export async function archiveAdminGroup(id) {
  await api.post(`/groups/${id}/archive`)
}

export async function listAdvisers() {
  const result = await getAdminUsers({ role: 'adviser', page: 1, limit: 500 })
  return result.data
}

export async function listAccessRequests(params = {}) {
  const res = await api.get('/adviser/access-requests', { params })
  return { data: rows(res), counts: res.data?.counts ?? {} }
}

export async function getAccessRequest(id) {
  const res = await api.get(`/adviser/access-requests/${id}`)
  return res.data?.data ?? null
}

export async function getUserNames() {
  const result = await getAdminUsers({ page: 1, limit: 500 })
  return Object.fromEntries(result.data.map((u) => [u.user_id, u.name]))
}

export async function listAnnouncements() {
  const res = await api.get('/admin/notifications')
  return rows(res)
}

export async function sendAnnouncement(payload) {
  const res = await api.post('/admin/notifications', payload)
  return res.data ?? null
}

export async function changeOwnPassword(currentPassword, newPassword) {
  await api.post('/auth/change-password', { currentPassword, newPassword })
}

export async function resetAdminUserPassword(userId) {
  const res = await api.post(`/admin/users/${userId}/reset-password`)
  return res.data?.temporaryPassword ?? res.data?.data?.temporaryPassword ?? ''
}

export async function getStorageSummary() {
  const res = await api.get('/admin/storage/summary')
  return res.data?.data ?? res.data ?? {}
}

export async function getLargestFiles(limit = 10) {
  const res = await api.get('/admin/storage/largest-files', { params: { limit } })
  return rows(res)
}

export async function getStorageOrphans() {
  const res = await api.get('/admin/storage/orphans')
  return res.data?.data ?? res.data ?? { missingFiles: [], orphanedRecords: [] }
}

export async function getBackupStatus() {
  const res = await api.get('/admin/storage/backup-status')
  return res.data?.data ?? res.data ?? {}
}

export async function exportTableData(table) {
  const res = await api.get(`/admin/storage/exports/${table}`)
  return rows(res)
}

export async function exportFileManifest() {
  const res = await api.get('/admin/storage/file-manifest')
  return rows(res)
}