import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ThemeContext } from './themeContext'
import { isMigratedThemeRoute } from '../theme/themeRoutes'

const STORAGE_KEY = 'theme'

const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const { pathname } = useLocation()
  const [preference, setPreference] = useState(readPreference)

  const isMigratedRoute = isMigratedThemeRoute(pathname)
  // Un-migrated pages are still dark-only, so force dark there.
  const theme = isMigratedRoute ? preference : 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (next) => {
    const value = next === 'dark' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Storage can be unavailable (private mode); keep the in-memory value.
    }
    setPreference(value)
  }

  const toggleTheme = () => setTheme(preference === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, preference, isMigratedRoute, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
