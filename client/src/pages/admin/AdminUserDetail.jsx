import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import useToast from '../../context/useToast'
import {
  getAdminUser,
  updateAdminUser,
  changeAdminUserRole,
  deactivateAdminUser,
  reactivateAdminUser,
  listAdminPosts,
  apiMessage,
} from '../../services/adminService'
import { glass } from '../../components/dashboard/constants'
import ConfirmModal from '../../components/ui/ConfirmModal'
import UserFormModal from '../../components/admin/UserFormModal'
import ChangeRoleModal from '../../components/admin/ChangeRoleModal'
import ResetPasswordModal from '../../components/admin/ResetPasswordModal'
import UserActivity from '../../components/admin/UserActivity'
import { Avatar, RoleBadge, StatusBadge } from '../../components/admin/UserBits'
import { ROLE_LABELS, canonicalRole } from '../../utils/adminRoles'
import { groupPermissions, permissionLabel } from '../../utils/permissionLabels'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const longDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const smallBtn = 'rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const ghostBtn = `${smallBtn} border-white/15 text-white/75 enabled:hover:bg-white/10 enabled:hover:text-white`
const dangerBtn = `${smallBtn} border-danger/50 text-danger-ink enabled:hover:bg-danger/15`

function Row({ label, children, note }) {
  return (
    <div className="py-2.5 text-sm">
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
        <dt className="text-white/55">{label}</dt>
        <dd className="min-w-0 wrap-break-word text-white/90">{children}</dd>
      </div>
      {note && <p className="mt-1 pl-[7.25rem] text-xs text-white/45">{note}</p>}
    </div>
  )
}

export default function AdminUserDetail() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const { toast } = useToast()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [toggleOpen, setToggleOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotFound(false)
    try {
      setPerson(await getAdminUser(userId))
    } catch (e) {
      if (e.response?.status === 404) setNotFound(true)
      else setError(apiMessage(e, 'Could not load this user.'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!backendSupport.adminUserPosts || !person?.user_id) return undefined
    let active = true
    setPostsLoading(true)
    listAdminPosts({ authorId: person.user_id, limit: 5 })
      .then((rows) => {
        if (active) setPosts(rows)
      })
      .catch(() => {
        if (active) setPosts([])
      })
      .finally(() => {
        if (active) setPostsLoading(false)
      })
    return () => {
      active = false
    }
  }, [person?.user_id, refreshKey])

  const myId = me?.user_id ?? me?.id
  const isSelf = person ? Number(person.user_id) === Number(myId) : false
  const active = person ? (person.status ? person.status === 'active' : Boolean(person.is_active)) : false
  const selfHint = isSelf ? 'You cannot change your own access.' : undefined

  const granted = useMemo(() => {
    const perms = person?.permissions ?? {}
    return groupPermissions({ self: perms })
      .map((g) => ({ title: g.title, keys: g.keys.filter((k) => perms[k]) }))
      .filter((g) => g.keys.length > 0)
  }, [person])

  const after = (message) => {
    toast(message)
    setRefreshKey((k) => k + 1)
    load()
  }

  const submitForm = async (payload) => {
    try {
      await updateAdminUser(person.user_id, payload)
      setForm(false)
      after('User updated.')
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
      await changeAdminUserRole(person.user_id, nextRole)
      setRoleOpen(false)
      after(`${person.name} is now ${ROLE_LABELS[nextRole]}.`)
    } catch (e) {
      toast(apiMessage(e, 'Could not change the role.'), 'error')
    }
  }

  const confirmToggle = async () => {
    setToggleOpen(false)
    try {
      if (active) await deactivateAdminUser(person.user_id)
      else await reactivateAdminUser(person.user_id)
      after(active ? `${person.name} was deactivated.` : `${person.name} can sign in again.`)
    } catch (e) {
      toast(apiMessage(e, 'Could not update this account.'), 'error')
    }
  }

  const back = (
    <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition hover:text-white">
      <span aria-hidden="true">←</span> Users
    </Link>
  )

  if (loading && !person) {
    return (
      <div className="space-y-6 font-display" aria-busy="true">
        {back}
        <div className="h-28 animate-pulse rounded-2xl bg-panel" />
        <div className="h-64 animate-pulse rounded-2xl bg-panel" />
      </div>
    )
  }

  if (notFound || error || !person) {
    return (
      <div className="space-y-6 font-display">
        {back}
        <div className={`${glass} px-6 py-12 text-center`} role={error ? 'alert' : undefined}>
          <p className="font-semibold">{notFound ? 'This user does not exist.' : error || 'Could not load this user.'}</p>
          <p className="mt-1 text-sm text-white/60">{notFound ? 'It may have been removed, or the link is wrong.' : 'Check your connection and try again.'}</p>
          {!notFound && (
            <button type="button" onClick={load} className={`${ghostBtn} mt-4`}>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-display">
      {back}

      <header className={`${glass} flex flex-wrap items-center gap-4 p-4 sm:p-6`}>
        <Avatar name={person.name} large />
        <div className="min-w-0 flex-1">
          <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{person.name}</h1>
          <p className="wrap-break-word text-sm text-white/60">{person.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge role={person.role} />
            <StatusBadge active={active} />
            {isSelf && <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/65">This is you</span>}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" onClick={() => setForm(true)} className={ghostBtn}>
            Edit
          </button>
          <button type="button" onClick={() => setRoleOpen(true)} disabled={isSelf} title={selfHint} className={ghostBtn}>
            Change role
          </button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            disabled={!backendSupport.adminResetPassword || isSelf}
            title={!backendSupport.adminResetPassword ? unsupportedNote.adminResetPassword : selfHint}
            className={ghostBtn}
          >
            Reset password
          </button>
          {active ? (
            <button type="button" onClick={() => setToggleOpen(true)} disabled={isSelf} title={selfHint} className={dangerBtn}>
              Deactivate
            </button>
          ) : (
            <button type="button" onClick={() => setToggleOpen(true)} className={ghostBtn}>
              Reactivate
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          <section className={`${glass} p-4 sm:p-5`}>
            <h2 className="text-base font-bold">Recent posts</h2>
            {!backendSupport.adminUserPosts ? (
              <p className="mt-2 text-xs text-white/50">{unsupportedNote.adminUserPosts}</p>
            ) : postsLoading ? (
              <p className="mt-2 text-sm text-white/60">Loading posts…</p>
            ) : posts.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">This person has not made any posts yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {posts.map((post) => (
                  <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="wrap-break-word text-sm text-white/90">
                      {post.type === 'paper' && post.paperTitle ? post.paperTitle : post.text || '—'}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50">
                      {post.groupName && <span className="truncate">{post.groupName}</span>}
                      {post.createdAt && <span>{longDate(post.createdAt)}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <UserActivity userId={person.user_id} refreshKey={refreshKey} />
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <section className={`${glass} p-4 sm:p-5`}>
            <h2 className="text-base font-bold">Profile</h2>
            <dl className="mt-2 divide-y divide-white/10">
              <Row label="Role">{ROLE_LABELS[canonicalRole(person.role)] ?? '—'}</Row>
              <Row label="Program">{person.program || '—'}</Row>
              <Row label="Joined">{longDate(person.created_at)}</Row>
              <Row label="Updated">{longDate(person.updated_at)}</Row>
              <Row label="Last sign-in" note={!backendSupport.adminLastLogin ? unsupportedNote.adminLastLogin : undefined}>
                {(person.last_login_at ?? person.last_login) ? longDate(person.last_login_at ?? person.last_login) : '—'}
              </Row>
              <Row label="Groups" note={!backendSupport.adminUserGroups ? unsupportedNote.adminUserGroups : undefined}>
                {Array.isArray(person.groups) && person.groups.length > 0 ? person.groups.map((g) => g.group_name ?? g.name).join(', ') : '—'}
              </Row>
            </dl>
          </section>

          <section className={`${glass} p-4 sm:p-5`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold">What this role can do</h2>
              <Link to="/admin/roles" className="text-xs font-semibold text-gold underline-offset-2 hover:underline">
                Compare roles
              </Link>
            </div>
            {granted.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No permissions were returned for this role.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {granted.map((g) => (
                  <div key={g.title}>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-white/55">{g.title}</h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {g.keys.map((k) => (
                        <li key={k} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                          {permissionLabel(k)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {form && <UserFormModal user={person} onSubmit={submitForm} onClose={() => setForm(false)} />}
      {roleOpen && <ChangeRoleModal user={person} onSubmit={submitRole} onClose={() => setRoleOpen(false)} />}
      {resetOpen && (
        <ResetPasswordModal
          user={person}
          onClose={() => setResetOpen(false)}
          onDone={() => after('Password reset.')}
        />
      )}
      {toggleOpen && (
        <ConfirmModal
          title={active ? 'Deactivate user' : 'Reactivate user'}
          message={
            active
              ? `${person.name} will no longer be able to sign in. Their posts and history stay as they are, and you can reactivate the account later.`
              : `${person.name} will be able to sign in again.`
          }
          confirmLabel={active ? 'Deactivate' : 'Reactivate'}
          danger={active}
          onConfirm={confirmToggle}
          onClose={() => setToggleOpen(false)}
        />
      )}
    </div>
  )
}