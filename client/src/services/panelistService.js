import { listMyGroups, getGroup } from './adviserService'

export async function listAssignedGroups(userId) {
  if (userId === undefined || userId === null) return []
  const list = await listMyGroups()
  const details = await Promise.all(list.map((g) => getGroup(g.group_id).catch(() => null)))
  return list
    .map((g, i) => ({ ...g, ...(details[i] ?? {}) }))
    .filter((g) => (g.panel ?? []).some((p) => Number(p.user_id) === Number(userId)))
}
