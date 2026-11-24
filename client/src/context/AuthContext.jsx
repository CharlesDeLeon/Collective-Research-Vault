import { createContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginService } from '../services/authService'


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const readStoredUser = () => {
    try {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const [user, setUser] = useState(readStoredUser())
  const navigate = useNavigate()

  const login = async (email, password, remember = true) => {
    const data = await loginService(email, password)
    if (data.user?.is_active === 0) {
      throw new Error('INACTIVE_ACCOUNT')
    }
    const store = remember ? localStorage : sessionStorage
    // clear the other store to avoid stale sessions
    localStorage.removeItem('token'); localStorage.removeItem('user')
    sessionStorage.removeItem('token'); sessionStorage.removeItem('user')
    store.setItem('token', data.token)
    store.setItem('user', JSON.stringify(data.user))
    setUser(data.user)

    const role = data.user?.role?.toLowerCase()

    if (role === 'student') navigate('/student')
    else if (role === 'adviser') navigate('/adviser/dashboard')
    else if (role === 'external_panelist') navigate('/panelist/dashboard')
    else if (role === 'sysadmin' || role === 'admin') navigate('/admin')
    else navigate('/login')
  }

  const setSession = (token, user, remember = true) => {
    const store = remember ? localStorage : sessionStorage
    localStorage.removeItem('token'); localStorage.removeItem('user')
    sessionStorage.removeItem('token'); sessionStorage.removeItem('user')
    store.setItem('token', token)
    store.setItem('user', JSON.stringify(user))
    setUser(user)
    const role = user?.role?.toLowerCase()
    if (role === 'student') navigate('/student')
    else if (role === 'adviser') navigate('/adviser/dashboard')
    else if (role === 'external_panelist') navigate('/panelist/dashboard')
    else if (role === 'sysadmin' || role === 'admin') navigate('/admin')
    else navigate('/login')
  }

  const updateUser = (patch) => {
    setUser((current) => {
      const next = { ...current, ...patch }
      if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(next))
      if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, setSession }}>
      {children}
    </AuthContext.Provider>
  )
}