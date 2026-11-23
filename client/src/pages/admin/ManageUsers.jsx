import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import useToast from '../../context/useToast'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import {
  getAdminUsers,
  getUserRoleStats,
  createAdminUser,
  updateAdminUser,
  changeAdminUserRole,
  deactivateAdminUser,
  reactivateAdminUser,
  apiMessage,
} from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import { SearchIcon, PlusIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import ConfirmModal from '../../components/ui/ConfirmModal'
import UserFormModal from '../../components/admin/UserFormModal'
import ChangeRoleModal from '../../components/admin/ChangeRoleModal'
import ResetPasswordModal from '../../components/admin/ResetPasswordModal'
import { Avatar, RoleBadge, StatusBadge } from '../../components/admin/UserBits'
import { ROLE_OPTIONS, ROLE_LABELS, canonicalRole } from '../../utils/adminRoles'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const PAGE_SIZE = 20

const shortDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const isActive = (u) => (u.status ? u.status === 'active' : Boolean(u.is_active))

const groupLabel = (u) => {
  const groups = u.groups ?? []
  if (groups.length === 0) return '—'
  const names = groups.map((g) => g.group_name ?? g.name).filter(Boolean)
  return names.length > 0 ? names.join(', ') : `${groups.length} group${groups.length === 1 ? '' : 's'}`
}

const smallBtn =
  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const ghostBtn = `${smallBtn} border-white/15 text-white/75 enabled:hover:bg-white/10 enabled:hover:text-white`
const dangerBtn = `${smallBtn} border-danger/50 text-danger-ink enabled:hover:bg-danger/15`

function RowActions({ user, isSelf, onEdit, onRole, onToggle, onReset }) {
  const active = isActive(user)
  const selfHint = isSelf ? 'You cannot change your own access.' : undefined
  const resetHint = !backendSupport.adminResetPassword ? unsupportedNote.adminResetPassword : selfHint
  return (
    <div className="flex flex-wrap gap-2 md:flex-nowrap">
      <Link to={`/admin/users/${user.user_id}`} className={ghostBtn}>
        View
      </Link>
      <button type="button" onClick={() => onEdit(user)} className={ghostBtn}>
        Edit
      </button>
      <button type="button" onClick={() => onRole(user)} disabled={isSelf} title={selfHint} className={ghostBtn}>
        Change role
      </button>
      <button
        type="button"
        onClick={() => onReset(user)}
        disabled={!backendSupport.adminResetPassword || isSelf}
        title={resetHint}
        className={ghostBtn}
      >
        Reset password
      </button>
      {active ? (
        <button type="button" onClick={() => onToggle(user)} disabled={isSelf} title={selfHint} className={dangerBtn}>
          Deactivate
        </button>
      ) : (
        <button type="button" onClick={() => onToggle(user)} className={ghostBtn}>
          Reactivate
        </button>
      )}
    </div>
  )
}

export default function ManageUsers() {
  const { user: me } = useAuth()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [group, setGroup] = useState('')
  const [form, setForm] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const requestId = useRef(0)

  const debouncedSearch = useDebouncedValue(search.trim())
  const myId = me?.user_id ?? me?.id
  const hasFilters = Boolean(search || role || status || group)

  const loadStats = useCallback(async () => {
    try {
      setStats(await getUserRoleStats())
    } catch {
      setStats(null)
    }
  }, [])

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await getAdminUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: role || undefined,
        status: status || undefined,
        groupId: group || undefined,
      })
      if (id !== requestId.current) return
      setUsers(result.data)
      setTotal(result.total)
    } catch (e) {
      if (id !== requestId.current) return
      setError(apiMessage(e, 'Could not load users.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, debouncedSearch, role, status, group])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (params.get('create') === '1') {
      setForm({ user: null })
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const refresh = () => {
    load()
    loadStats()
  }

  const clearFilters = () => {
    setSearch('')
    setRole('')
    setStatus('')
    setGroup('')
    setPage(1)
  }

  const submitForm = async (payload) => {
    const editing = form?.user
    try {
      if (editing) {
        await updateAdminUser(editing.user_id, payload)
        toast('User updated.')
      } else {
        await createAdminUser(payload)
        toast('User created.')
      }
      setForm(null)
      refresh()
      return null
    } catch (e) {
      const message = apiMessage(e, 'Could not save this user.')
      if (e.response?.status === 409) return { email: message }
      toast(message, 'error')
      return {}
    }
  }

  const submitRole = async (nextRole) => {
    try {
      await changeAdminUserRole(roleTarget.user_id, nextRole)
      toast(`${roleTarget.name} is now ${ROLE_LABELS[nextRole]}.`)
      setRoleTarget(null)
      refresh()
    } catch (e) {
      toast(apiMessage(e, 'Could not change the role.'), 'error')
    }
  }

  const confirmToggle = async () => {
    const target = toggleTarget
    const activate = !isActive(target)
    setToggleTarget(null)
    try {
      if (activate) await reactivateAdminUser(target.user_id)
      else await deactivateAdminUser(target.user_id)
      toast(activate ? `${target.name} can sign in again.` : `${target.name} was deactivated.`)
      refresh()
    } catch (e) {
      toast(apiMessage(e, 'Could not update this account.'), 'error')
    }
  }

  const counts = (stats ?? []).reduce((acc, row) => {
    const key = canonicalRole(row.role)
    acc[key] = (acc[key] ?? 0) + Number(row.count)
    return acc
  }, {})
  const totalUsers = Object.values(counts).reduce((a, b) => a + b, 0)
  const kpis = [
    ['Total users', totalUsers],
    ...ROLE_OPTIONS.map((r) => [`${ROLE_LABELS[r]}s`.replace('System Admins', 'Admins'), counts[r] ?? 0]),
  ]

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const actions = {
    onEdit: (u) => setForm({ user: u }),
    onRole: setRoleTarget,
    onToggle: setToggleTarget,
    onReset: setResetTarget,
  }

  return (
    <div className="space-y-6 font-display">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-white/60">Create accounts, change roles and deactivate people. Deactivating keeps their posts and history.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ user: null })}
          className="flex h-11 items-center gap-2 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105"
        >
          <PlusIcon className="size-4" />
          Create user
        </button>
      </header>

      {stats && (
        <section aria-label="Users by role" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {kpis.map(([label, value], index) => (
            <div key={label} className={`${glass} p-4 ${index === 0 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{label}</p>
              <p className="mt-1 text-3xl font-bold text-gold">{value}</p>
            </div>
          ))}
        </section>
      )}

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_12rem_12rem_auto]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search users</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name or email"
              className="h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
          </label>
          <div className="-mt-1">
            <Select
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by role"
              className="border-white/20"
            >
              <Option value="">All roles</Option>
              {ROLE_OPTIONS.map((r) => (
                <Option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </Option>
              ))}
            </Select>
          </div>
          <div className="-mt-1">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="border-white/20"
            >
              <Option value="">All statuses</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>
          <div className="-mt-1">
            <Select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by group"
              disabled={!backendSupport.adminUserGroups}
              className="border-white/20"
            >
              <Option value="">All groups</Option>
            </Select>
            {!backendSupport.adminUserGroups && <p className="mt-1 text-xs text-white/45">{unsupportedNote.adminUserGroups}</p>}
          </div>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className={`${ghostBtn} h-11 px-4 text-sm`}>
            Clear filters
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={dangerBtn}>
            Try again
          </button>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : users.length === 0 && !error ? (
        <div className={`${glass} px-6 py-12 text-center`}>
          <p className="font-semibold">{hasFilters ? 'No users match these filters.' : 'No users yet.'}</p>
          <p className="mt-1 text-sm text-white/60">
            {hasFilters ? 'Try a different search or clear the filters.' : 'Create the first account to get started.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className={`${ghostBtn} mt-4`}>
              Clear filters
            </button>
          )}
        </div>
      ) : (users.length === 0 ? null : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  {backendSupport.adminUserGroups && <th scope="col" className="px-5 py-3 font-semibold">Groups</th>}
                  <th scope="col" className="px-5 py-3 font-semibold">Program</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last sign-in</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <Link to={`/admin/users/${u.user_id}`} className="block truncate font-semibold hover:text-gold">{u.name}</Link>
                          <p className="truncate text-xs text-white/55">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3"><StatusBadge active={isActive(u)} /></td>
                    {backendSupport.adminUserGroups && (
                      <td className="px-5 py-3 text-white/75">
                        <span className="block max-w-[12rem] truncate" title={groupLabel(u)}>{groupLabel(u)}</span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-white/75">{u.program || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/75">{shortDate(u.created_at) || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/75">
                      {backendSupport.adminLastLogin ? shortDate(u.last_login_at ?? u.last_login) || '—' : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <RowActions user={u} isSelf={u.user_id === myId} {...actions} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
            {users.map((u) => (
              <li key={u.user_id} className={`${glass} p-4`}>
                <div className="flex items-start gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{u.name}</p>
                    <p className="truncate text-xs text-white/55">{u.email}</p>
                  </div>
                  <StatusBadge active={isActive(u)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <RoleBadge role={u.role} />
                  {backendSupport.adminUserGroups && <span>{groupLabel(u)}</span>}
                  {u.program && <span>{u.program}</span>}
                  {u.created_at && <span>Joined {shortDate(u.created_at)}</span>}
                  {backendSupport.adminLastLogin && (u.last_login_at ?? u.last_login) && (
                    <span>Last sign-in {shortDate(u.last_login_at ?? u.last_login)}</span>
                  )}
                </div>
                <div className="mt-4">
                  <RowActions user={u} isSelf={u.user_id === myId} {...actions} />
                </div>
              </li>
            ))}
          </ul>

          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
            <p>
              Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`${ghostBtn} px-4`}>
                Previous
              </button>
              <span>Page {page}</span>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= total} className={`${ghostBtn} px-4`}>
                Next
              </button>
            </div>
          </nav>
        </>
      ))}

      {form && <UserFormModal user={form.user} onSubmit={submitForm} onClose={() => setForm(null)} />}
      {roleTarget && <ChangeRoleModal user={roleTarget} onSubmit={submitRole} onClose={() => setRoleTarget(null)} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} onDone={refresh} />}
      {toggleTarget && (
        <ConfirmModal
          title={isActive(toggleTarget) ? 'Deactivate user' : 'Reactivate user'}
          message={
            isActive(toggleTarget)
              ? `${toggleTarget.name} will no longer be able to sign in. Their posts and history stay as they are, and you can reactivate the account later.`
              : `${toggleTarget.name} will be able to sign in again.`
          }
          confirmLabel={isActive(toggleTarget) ? 'Deactivate' : 'Reactivate'}
          danger={isActive(toggleTarget)}
          onConfirm={confirmToggle}
          onClose={() => setToggleTarget(null)}
        />
      )}
    </div>
  )
}