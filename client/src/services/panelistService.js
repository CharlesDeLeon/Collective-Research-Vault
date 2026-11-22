import { listMyGroups, getGroup } from './adviserService'
import { backendSupport } from './backendSupport'

export async function listAssignedGroups(userId) {
  const list = await listMyGroups()
  if (backendSupport.panelistScopedGroups) return list
  const details = await Promise.all(list.map((g) => getGroup(g.group_id).catch(() => null)))
  return list
    .map((g, i) => ({ ...g, ...(details[i] ?? {}) }))
    .filter((g) => (g.panel ?? []).some((p) => Number(p.user_id) === Number(userId)))
}