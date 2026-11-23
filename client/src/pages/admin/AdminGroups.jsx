import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAdminGroups, getUserNames, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import { SearchIcon, PlusIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import AdviserChip from '../../components/admin/AdviserChip'
import CreateGroupModal from '../../components/admin/CreateGroupModal'
import { STRANDS } from '../../utils/strands'

const ghost =
  'rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export default function AdminGroups() {
  const [groups, setGroups] = useState([])
  const [names, setNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [strand, setStrand] = useState('')
  const [adviser, setAdviser] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, userNames] = await Promise.all([listAdminGroups(), getUserNames().catch(() => ({}))])
      setGroups(list)
      setNames(userNames)
    } catch (e) {
      setError(apiMessage(e, 'Could not load groups.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const adviserOptions = useMemo(() => {
    const ids = [...new Set(groups.map((g) => g.adviser_id).filter(Boolean))]
    return ids.map((id) => [String(id), names[id] ?? `User #${id}`]).sort((a, b) => a[1].localeCompare(b[1]))
  }, [groups, names])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return groups.filter((g) => {
      if (term && !String(g.group_name).toLowerCase().includes(term)) return false
      if (strand && g.strand !== strand) return false
      if (adviser === 'none' && g.adviser_id) return false
      if (adviser && adviser !== 'none' && String(g.adviser_id) !== adviser) return false
      return true
    })
  }, [groups, search, strand, adviser])

  const hasFilters = Boolean(search || strand || adviser)
  const clearFilters = () => {
    setSearch('')
    setStrand('')
    setAdviser('')
  }

  return (
    <div className="space-y-6 font-display">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Groups</h1>
          <p className="mt-1 text-sm text-white/60">Every research group and who advises it.</p>
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white/80 transition enabled:hover:bg-white/10"
          >
            <PlusIcon className="size-4" />
            Create group
          </button>
        </div>
      </header>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_11rem_15rem_auto]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search groups</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by group name"
              className="h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
          </label>
          <div className="-mt-1">
            <Select value={strand} onChange={(e) => setStrand(e.target.value)} aria-label="Filter by strand" className="border-white/20">
              <Option value="">All strands</Option>
              {STRANDS.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </div>
          <div className="-mt-1">
            <Select value={adviser} onChange={(e) => setAdviser(e.target.value)} aria-label="Filter by adviser" className="border-white/20">
              <Option value="">All advisers</Option>
              <Option value="none">No adviser</Option>
              {adviserOptions.map(([id, name]) => (
                <Option key={id} value={id}>
                  {name}
                </Option>
              ))}
            </Select>
          </div>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className={`${ghost} h-11 px-4 text-sm`}>
            Clear filters
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={ghost}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{hasFilters ? 'No groups match these filters.' : 'No groups yet.'}</p>
            <p className="mt-1 text-sm text-white/60">{hasFilters ? 'Try clearing the filters.' : 'Advisers create their own groups from their dashboard.'}</p>
          </div>
        )
      ) : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block`}>
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Group</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Strand</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Section</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Adviser</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Members</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Papers</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.group_id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/admin/groups/${g.group_id}`} className="font-semibold transition hover:text-gold">
                        {g.group_name}
                      </Link>
                      {g.school_year && <p className="text-xs text-white/50">{g.school_year}</p>}
                    </td>
                    <td className="px-5 py-3 text-white/75">{g.strand || '—'}</td>
                    <td className="px-5 py-3 text-white/75">
                      {[g.section, g.year_level && `Grade ${g.year_level}`].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-5 py-3"><AdviserChip name={g.adviser_id ? names[g.adviser_id] ?? `User #${g.adviser_id}` : null} /></td>
                    <td className="px-5 py-3 text-white/75">{g.member_count ?? 0}</td>
                    <td className="px-5 py-3 text-white/75">{g.submission_count ?? 0}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/admin/groups/${g.group_id}`} className={ghost}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((g) => (
              <li key={g.group_id}>
                <Link to={`/admin/groups/${g.group_id}`} className={`${glass} block p-4 transition hover:bg-white/5`}>
                  <p className="font-semibold">{g.group_name}</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {[g.strand, g.section, g.year_level && `Grade ${g.year_level}`, g.school_year].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
                    <AdviserChip name={g.adviser_id ? names[g.adviser_id] ?? `User #${g.adviser_id}` : null} />
                    <span>
                      {g.member_count ?? 0} members · {g.submission_count ?? 0} papers
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/60">
            {visible.length} {visible.length === 1 ? 'group' : 'groups'}
          </p>
        </>
      )}
      {creating && (
        <CreateGroupModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            load()
          }}
        />
      )}
    </div>
  )
}