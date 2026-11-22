import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRolePermissions, apiMessage } from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import { CheckIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import { ROLE_OPTIONS, ROLE_LABELS } from '../../utils/adminRoles'
import { groupPermissions, permissionLabel } from '../../utils/permissionLabels'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

function Mark({ allowed, label }) {
  return allowed ? (
    <span className="inline-grid size-6 place-items-center rounded-full bg-success/15 text-success-ink" role="img" aria-label={`${label}: allowed`}>
      <CheckIcon className="size-3.5" />
    </span>
  ) : (
    <span className="text-white/30" role="img" aria-label={`${label}: not allowed`}>
      —
    </span>
  )
}

export default function AdminRoles() {
  const [matrix, setMatrix] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState(ROLE_OPTIONS[0])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setMatrix(await getRolePermissions())
    } catch (e) {
      setError(apiMessage(e, 'Could not load roles.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo(() => groupPermissions(matrix), [matrix])
  const allowed = (r, key) => Boolean(matrix?.[r]?.[key])
  const countFor = (r) => groups.reduce((sum, g) => sum + g.keys.filter((k) => allowed(r, k)).length, 0)

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Roles</h1>
        <p className="mt-1 text-sm text-white/60">
          What each role can do. To change someone&apos;s role, open them from{' '}
          <Link to="/admin/users" className="font-semibold text-gold underline-offset-2 hover:underline">
            Users
          </Link>
          .
        </p>
      </header>

      {!backendSupport.adminEditRoles && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/60">
          {unsupportedNote.adminEditRoles}
        </p>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-semibold transition hover:bg-danger/15">
            Try again
          </button>
        </div>
      )}

      {loading && !matrix ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">No roles to show.</p>
            <p className="mt-1 text-sm text-white/60">The server did not return any permissions.</p>
          </div>
        )
      ) : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block`}>
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Permission</th>
                  {ROLE_OPTIONS.map((r) => (
                    <th key={r} scope="col" className="px-3 py-3 text-center font-semibold">
                      {ROLE_LABELS[r]}
                      <span className="mt-0.5 block text-[0.7rem] font-medium normal-case tracking-normal text-white/45">{countFor(r)} allowed</span>
                    </th>
                  ))}
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.title}>
                  <tr>
                    <th colSpan={ROLE_OPTIONS.length + 1} scope="colgroup" className="bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-wide text-gold">
                      {g.title}
                    </th>
                  </tr>
                  {g.keys.map((key) => (
                    <tr key={key} className="border-b border-white/5 last:border-0">
                      <th scope="row" className="px-5 py-2.5 font-medium text-white/85">{permissionLabel(key)}</th>
                      {ROLE_OPTIONS.map((r) => (
                        <td key={r} className="px-3 py-2.5 text-center">
                          <Mark allowed={allowed(r, key)} label={`${ROLE_LABELS[r]}, ${permissionLabel(key)}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wide text-gold">Role</span>
              <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" className="border-white/20">
                {ROLE_OPTIONS.map((r) => (
                  <Option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </Option>
                ))}
              </Select>
            </div>
            <p className="text-sm text-white/60">
              {ROLE_LABELS[role]} can do {countFor(role)} of {groups.reduce((s, g) => s + g.keys.length, 0)} things.
            </p>
            {groups.map((g) => (
              <section key={g.title} className={`${glass} p-4`}>
                <h2 className="text-xs font-bold uppercase tracking-wide text-gold">{g.title}</h2>
                <ul className="mt-2 divide-y divide-white/5">
                  {g.keys.map((key) => (
                    <li key={key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className={allowed(role, key) ? 'text-white/90' : 'text-white/45'}>{permissionLabel(key)}</span>
                      <Mark allowed={allowed(role, key)} label={permissionLabel(key)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}