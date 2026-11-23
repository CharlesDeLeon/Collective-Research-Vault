import { listMyGroups, getGroup } from './adviserService'

export async function listAssignedGroups() {
  const list = await listMyGroups()
  const details = await Promise.all(list.map((g) => getGroup(g.group_id).catch(() => null)))
  return list.map((g, i) => ({ ...g, ...(details[i] ?? {}) }))
}
