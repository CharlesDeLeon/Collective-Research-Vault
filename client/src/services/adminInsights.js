import { getUserRoleStats, listAdminGroups, listAdminPosts, listAccessRequests } from './adminService'

export const POST_LIMIT = 500

export async function loadInsights() {
  const names = ['users', 'groups', 'posts', 'access requests']
  const results = await Promise.allSettled([
    getUserRoleStats(),
    listAdminGroups(),
    listAdminPosts({ page: 1, limit: POST_LIMIT }),
    listAccessRequests({}),
  ])
  const value = (i) => (results[i].status === 'fulfilled' ? results[i].value : null)
  return {
    roles: value(0),
    groups: value(1),
    posts: value(2),
    access: value(3)?.counts ?? null,
    failed: names.filter((_, i) => results[i].status === 'rejected'),
  }
}