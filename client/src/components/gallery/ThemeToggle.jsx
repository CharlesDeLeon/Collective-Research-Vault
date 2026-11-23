import useTheme from '../../context/useTheme'
import { MoonIcon, SunIcon } from '../dashboard/icons'

export default function ThemeToggle({ className = '' }) {
  const { theme, isMigratedRoute, toggleTheme } = useTheme()

  if (!isMigratedRoute) return null

  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const label = `Switch to ${nextTheme} mode`

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-control-line-soft bg-surface text-fg transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
    >
      {theme === 'light' ? (
        <MoonIcon className="size-5" />
      ) : (
        <SunIcon className="size-5" />
      )}
    </button>
  )
}
