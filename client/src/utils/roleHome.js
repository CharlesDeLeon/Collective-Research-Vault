import { normalizeRole } from './roles'

const ROLE_HOME = {
  student: '/student',
  adviser: '/adviser/dashboard',
  external_panelist: '/panelist/dashboard',
  sysadmin: '/admin/dashboard',
}

export const getRoleHome = (role) => ROLE_HOME[normalizeRole(role)] ?? '/login'