import { useState } from 'react'
import useAuth from '../../context/useAuth'
import useToast from '../../context/useToast'
import { changePassword, updateProfile } from '../../services/authService'
import { glass } from '../../components/dashboard/constants'
import Field, { inputCls } from '../../components/upload/Field'
import { initials } from '../../utils/avatarColors'
import { roleLabel } from '../../utils/adminRoles'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PREF_KEY = 'corev.prefs'

const PREFS = [
  { id: 'comments', label: 'Comments on my posts and papers' },
  { id: 'status', label: 'Status changes on my papers' },
  { id: 'access', label: 'Access request updates' },
]

function loadPrefs() {
  const defaults = { comments: true, status: true, access: true }
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY))
    const safe = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
    return { ...defaults, ...safe }
  } catch {
    return defaults
  }
}

function Card({ title, children }) {
  return (
    <section className={`${glass} p-5 sm:p-6`}>
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

const submitCls =
  'h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-8 text-base font-semibold text-ink transition hover:brightness-105'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name ?? user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [infoErrors, setInfoErrors] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoError, setInfoError] = useState('')

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')

  const [prefs, setPrefs] = useState(loadPrefs)

  const saveInfo = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.'
    setInfoErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSavingInfo(true)
    setInfoError('')
    try {
      const result = await updateProfile({ name: name.trim(), email: email.trim() })
      const saved = result?.user ?? result?.data ?? result ?? {}
      const nextName = saved.name ?? saved.full_name ?? name.trim()
      const nextEmail = saved.email ?? email.trim()
      setName(nextName)
      setEmail(nextEmail)
      updateUser({ name: nextName, full_name: nextName, email: nextEmail })
      toast('Profile updated.')
    } catch (err) {
      setInfoError(err?.response?.data?.message || 'Could not save your profile. Please try again.')
    } finally {
      setSavingInfo(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pw.current) errs.current = 'Enter your current password.'
    if (pw.next.length < 8) errs.next = 'Use at least 8 characters.'
    if (pw.confirm !== pw.next) errs.confirm = 'Passwords do not match.'
    setPwErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSavingPw(true)
    setPwError('')
    try {
      await changePassword({ current: pw.current, next: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      toast('Password changed.')
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Could not change your password. Please try again.')
    } finally {
      setSavingPw(false)
    }
  }

  const togglePref = (id) => {
    const next = { ...prefs, [id]: !prefs[id] }
    setPrefs(next)
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next))
    } catch {
      toast('Could not save preferences on this device.', 'error')
    }
  }

  const invalid = (key, errs) => ({
    'aria-invalid': Boolean(errs[key]),
    className: `${inputCls} ${errs[key] ? 'border-danger' : 'border-white/20'}`,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-display">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card title="Your details">
        <form onSubmit={saveInfo} noValidate className="space-y-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-16 shrink-0 place-items-center rounded-full bg-gold-edge font-sans text-2xl font-bold text-navy-700"
            >
              {initials(name || user?.name)}
            </span>
            <p className="text-sm text-white/60">{roleLabel(user?.role)}</p>
          </div>
          <Field label="Name" error={infoErrors.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" {...invalid('name', infoErrors)} />
          </Field>
          <Field label="Email" error={infoErrors.email}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} autoComplete="email" {...invalid('email', infoErrors)} />
          </Field>
          {infoError && (
            <p role="alert" className="m-0 text-sm text-danger-ink">{infoError}</p>
          )}
          <button type="submit" disabled={savingInfo} className={`${submitCls} disabled:cursor-not-allowed disabled:opacity-60`}>
            {savingInfo ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <Field label="Current password" error={pwErrors.current}>
            <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" {...invalid('current', pwErrors)} />
          </Field>
          <Field label="New password" error={pwErrors.next}>
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" {...invalid('next', pwErrors)} />
          </Field>
          <Field label="Confirm new password" error={pwErrors.confirm}>
            <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" {...invalid('confirm', pwErrors)} />
          </Field>
          {pwError && (
            <p role="alert" className="m-0 text-sm text-danger-ink">{pwError}</p>
          )}
          <button type="submit" disabled={savingPw} className={`${submitCls} disabled:cursor-not-allowed disabled:opacity-60`}>
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>

      <Card title="Notification preferences">
        <ul className="space-y-4">
          {PREFS.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4">
              <span className="text-sm">{p.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[p.id]}
                aria-label={p.label}
                onClick={() => togglePref(p.id)}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                  prefs[p.id] ? 'border-gold bg-gold' : 'border-white/30 bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all ${
                    prefs[p.id] ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}