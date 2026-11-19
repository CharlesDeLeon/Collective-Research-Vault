import { Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import Forbidden from '../pages/Forbidden'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth()
  const persistedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const activeUser = user || persistedUser

  if (!activeUser) return <Navigate to="/login" />

  if (allowedRole) {
    const currentRole = normalizeRole(activeUser.role)
    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]
    const normalizedRoles = allowedRoles.map(normalizeRole)

    if (!normalizedRoles.includes(currentRole)) return <Forbidden />
  }

  return children
}

export default ProtectedRoute