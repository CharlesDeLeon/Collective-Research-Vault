import { normalizeRole } from './roles'

const ROLE_HOME = {
  student: '/student',
  faculty: '/faculty/dashboard',
  coordinator: '/coordinator/dashboard',
  sysadmin: '/admin/dashboard',
}

export const getRoleHome = (role) => ROLE_HOME[normalizeRole(role)] ?? '/login'