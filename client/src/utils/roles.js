const ROLE_ALIASES = {
  admin: 'sysadmin',
  coordinator: 'adviser',
}

export const normalizeRole = (role) => {
  const key = role?.toLowerCase()
  return ROLE_ALIASES[key] ?? key
}