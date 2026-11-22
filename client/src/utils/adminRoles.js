export const ROLE_OPTIONS = ['student', 'adviser', 'external_panelist', 'sysadmin']

export const ROLE_LABELS = {
  student: 'Student',
  adviser: 'Adviser',
  external_panelist: 'Panelist',
  sysadmin: 'System Admin',
}

const LEGACY = {
  faculty: 'adviser',
  coordinator: 'adviser',
  admin: 'sysadmin',
}

export const canonicalRole = (role) => {
  const key = String(role || '').toLowerCase()
  return LEGACY[key] ?? key
}

export const roleLabel = (role) => ROLE_LABELS[canonicalRole(role)] ?? 'Unknown'

export const formatAction = (action) =>
  String(action || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

const BADGE = {
  student: 'Student',
  adviser: 'Adviser',
  external_panelist: 'Panelist',
  sysadmin: 'Admin',
}

export const badgeRole = (role) => BADGE[canonicalRole(role)] ?? null