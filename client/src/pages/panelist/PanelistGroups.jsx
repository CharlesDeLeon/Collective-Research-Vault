import { useMemo, useState } from 'react'
import useAssignedGroups from '../../hooks/useAssignedGroups'
import { glass } from '../../components/dashboard/constants'
import { SearchIcon } from '../../components/dashboard/icons'
import GroupCard from '../../components/group/GroupCard'
import ErrorBanner from '../../components/ui/ErrorBanner'

export default function PanelistGroups() {
  const { groups, loading, error, reload } = useAssignedGroups()
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => [g.group_name, g.strand, g.program, g.section, g.school_year].some((v) => String(v ?? '').toLowerCase().includes(q)))
  }, [groups, search])

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Groups</h1>
        <p className="mt-1 text-sm text-white/60">Groups you were invited to review.</p>
      </header>

      {groups.length > 3 && (
        <label className="relative block max-w-xl">
          <span className="sr-only">Search groups</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups"
            className="h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
          />
        </label>
      )}

      <ErrorBanner message={error} onRetry={reload} />

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{search ? 'No groups match your search.' : 'No groups yet'}</p>
            <p className="mt-1 text-sm text-white/60">{search ? 'Try a different word.' : 'A System Admin assigns panelists to groups.'}</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
          {visible.map((g) => (
            <GroupCard key={g.group_id} group={g} to={`/panelist/groups/${g.group_id}`} />
          ))}
        </div>
      )}
    </div>
  )
}