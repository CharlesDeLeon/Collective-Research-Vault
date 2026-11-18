const ROLE_ALIASES = {
  adviser: 'faculty',
  admin: 'sysadmin',
}

export const normalizeRole = (role) => {
  const key = role?.toLowerCase()
  return ROLE_ALIASES[key] ?? key
}