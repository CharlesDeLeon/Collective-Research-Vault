import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import useToast from '../../context/useToast'
import { glass } from '../../components/dashboard/constants'
import Field, { inputCls } from '../../components/upload/Field'
import { apiMessage, changeOwnPassword } from '../../services/adminService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { initials } from '../../utils/avatarColors'
import { roleLabel } from '../../utils/adminRoles'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY_PW = { current: '', next: '', confirm: '' }
const submitCls =
  'h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-8 text-base font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'

function Card({ title, children }) {
  return (
    <section className={`${glass} p-4 sm:p-6`}>
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function AdminProfile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name ?? user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [infoErrors, setInfoErrors] = useState({})
  const [pw, setPw] = useState(EMPTY_PW)
  const [pwErrors, setPwErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const saveInfo = (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.'
    setInfoErrors(errs)
    if (Object.keys(errs).length > 0) return
    updateUser({ name: name.trim(), email: email.trim() })
    toast(backendSupport.profileSync ? 'Profile updated.' : 'Saved on this device.')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pw.current) errs.current = 'Enter your current password.'
    if (pw.next.length < 8) errs.next = 'Use at least 8 characters.'
    else if (pw.next === pw.current) errs.next = 'Choose a password you have not used just now.'
    if (pw.confirm !== pw.next) errs.confirm = 'Passwords do not match.'
    setPwErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      await changeOwnPassword(pw.current, pw.next)
      setPw(EMPTY_PW)
      toast('Password changed.')
    } catch (err) {
      setPwErrors({ current: apiMessage(err, 'Could not change the password.') })
    } finally {
      setSaving(false)
    }
  }

  const invalid = (key, errs) => ({
    'aria-invalid': Boolean(errs[key]),
    className: `${inputCls} ${errs[key] ? 'border-danger' : 'border-white/20'}`,
  })

  const canChange = backendSupport.changePassword

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-display">
      <h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>

      <Card title="Your details">
        <form onSubmit={saveInfo} noValidate className="space-y-5">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-full bg-gold-edge font-sans text-2xl font-bold text-navy-700">
              {initials(name || user?.name)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{roleLabel(user?.role)}</p>
              <Link to="/admin/roles" className="text-xs text-gold hover:underline">
                See what this role can do
              </Link>
            </div>
          </div>
          <Field label="Name" error={infoErrors.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" {...invalid('name', infoErrors)} />
          </Field>
          <Field label="Email" error={infoErrors.email}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} autoComplete="email" {...invalid('email', infoErrors)} />
          </Field>
          {!backendSupport.profileSync && <p className="text-xs text-white/60">{unsupportedNote.profileSync}</p>}
          <button type="submit" className={submitCls}>
            Save changes
          </button>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <Field label="Current password" error={pwErrors.current}>
            <input type="password" value={pw.current} disabled={!canChange} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" {...invalid('current', pwErrors)} />
          </Field>
          <Field label="New password" error={pwErrors.next}>
            <input type="password" value={pw.next} disabled={!canChange} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" {...invalid('next', pwErrors)} />
          </Field>
          <Field label="Confirm new password" error={pwErrors.confirm}>
            <input type="password" value={pw.confirm} disabled={!canChange} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" {...invalid('confirm', pwErrors)} />
          </Field>
          {!canChange && <p className="text-xs text-white/60">{unsupportedNote.changePassword}</p>}
          <button type="submit" disabled={!canChange || saving} className={submitCls}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>
    </div>
  )
}