// Every screen now supports both themes, so the saved preference applies
// everywhere. The route allowlist is kept as a no-op for backwards
// compatibility with components that still read `isMigratedRoute`.
export const MIGRATED_THEME_ROUTES = ['/']

export function isMigratedThemeRoute() {
  return true
}
