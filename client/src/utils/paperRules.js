export function normalizeStatus(status) {
  if (status === 'needs_revision') return 'for_revision'
  if (status === 'submitted') return 'under_review'
  return status
}

export const canEdit = (status) => ['proposal', 'for_revision'].includes(normalizeStatus(status))

export const canResubmit = (status) => normalizeStatus(status) === 'for_revision'

export function splitList(value = '') {
  return value
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter(Boolean)
}