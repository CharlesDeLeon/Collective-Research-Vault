import { useEffect, useState } from 'react'
import ModalShell from '../ui/ModalShell'
import Select, { Option } from '../ui/Select'
import Field, { inputCls } from '../upload/Field'
import { UsersIcon } from '../dashboard/icons'
import { listAdminGroups } from '../../services/adminService'
import { ROLE_OPTIONS, ROLE_LABELS } from '../../utils/adminRoles'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const generatePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const values = crypto.getRandomValues(new Uint32Array(12))
  return `${Array.from(values, (v) => alphabet[v % alphabet.length]).join('')}!`
}

export default function UserFormModal({ user, onSubmit, onClose }) {
  const editing = Boolean(user)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: 'student',
    program: user?.program ?? '',
    groupIds: (user?.groups ?? []).map((g) => Number(g.group_id ?? g.id)),
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState([])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleGroup = (id) => {
    const gid = Number(id)
    setForm((f) => ({
      ...f,
      groupIds: f.groupIds.includes(gid) ? f.groupIds.filter((g) => g !== gid) : [...f.groupIds, gid],
    }))
  }
  const showProgram = editing ? Boolean(user.program) || user.role === 'student' : form.role === 'student'

  useEffect(() => {
    if (!backendSupport.adminUserGroups) return undefined
    let active = true
    listAdminGroups()
      .then((rows) => {
        if (active) setGroups(rows)
      })
      .catch(() => {
        if (active) setGroups([])
      })
    return () => {
      active = false
    }
  }, [])

  const invalid = (key) => ({
    'aria-invalid': Boolean(errors[key]),
    className: `${inputCls} ${errors[key] ? 'border-danger' : 'border-white/20'}`,
  })

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!editing && form.password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    const groupFields = backendSupport.adminUserGroups ? { groupIds: form.groupIds } : {}
    const payload = editing
      ? { name: form.name.trim(), email: form.email.trim(), program: form.program.trim(), ...groupFields }
      : {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          program: form.role === 'student' ? form.program.trim() : '',
          ...groupFields,
        }
    const fieldError = await onSubmit(payload)
    setSaving(false)
    if (fieldError) setErrors(fieldError)
  }

  return (
    <ModalShell title={editing ? 'Edit user' : 'Create user'} icon={UsersIcon} onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-5 space-y-5 px-1 pb-1">
        <Field label="Full name" error={errors.name}>
          <input value={form.name} onChange={set('name')} maxLength={100} autoComplete="off" {...invalid('name')} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} maxLength={150} autoComplete="off" {...invalid('email')} />
        </Field>

        {!editing && (
          <>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wide text-gold">Role</span>
              <Select value={form.role} onChange={set('role')} aria-label="Role" className="border-white/20">
                {ROLE_OPTIONS.map((role) => (
                  <Option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Field label="Temporary password" error={errors.password}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  {...invalid('password')}
                />
              </Field>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, password: generatePassword() }))
                    setShowPassword(true)
                  }}
                  className="font-semibold text-gold underline-offset-2 hover:underline"
                >
                  Generate
                </button>
                <span className="text-white/50">Share it with the person yourself.</span>
              </div>
            </div>
          </>
        )}

        {showProgram && (
          <Field label="Program / strand">
            <input value={form.program} onChange={set('program')} maxLength={100} placeholder="e.g. STEM" className={`${inputCls} border-white/20`} />
          </Field>
        )}

        {backendSupport.adminUserGroups && (
          <div>
            <span className="block text-sm font-bold uppercase tracking-wide text-gold">Groups</span>
            {groups.length === 0 ? (
              <p className="mt-2 text-xs text-white/55">No groups are available yet.</p>
            ) : (
              <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
                {groups.map((g) => (
                  <label key={g.group_id} className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.groupIds.includes(Number(g.group_id))}
                      onChange={() => toggleGroup(g.group_id)}
                      className="size-4 accent-gold"
                    />
                    {g.group_name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {editing && !backendSupport.adminResetPassword && (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
            {unsupportedNote.adminResetPassword}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}