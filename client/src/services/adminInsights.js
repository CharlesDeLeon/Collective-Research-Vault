import { getUserRoleStats, listAdminGroups, listAdminPosts, listAccessRequests, getStorageSummary } from './adminService'
import { backendSupport } from './backendSupport'

export const POST_LIMIT = 500

export async function loadInsights() {
  const names = ['users', 'groups', 'posts', 'access requests']
  const tasks = [
    getUserRoleStats(),
    listAdminGroups(),
    listAdminPosts({ page: 1, limit: POST_LIMIT }),
    listAccessRequests({}),
  ]
  if (backendSupport.adminStorage) {
    names.push('storage')
    tasks.push(getStorageSummary())
  }
  const results = await Promise.allSettled(tasks)
  const value = (index) => (results[index].status === 'fulfilled' ? results[index].value : null)
  return {
    roles: value(0),
    groups: value(1),
    posts: value(2),
    access: value(3)?.counts ?? null,
    storage: value(4),
    failed: names.filter((_, index) => results[index].status === 'rejected'),
  }
}
