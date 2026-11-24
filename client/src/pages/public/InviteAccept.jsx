import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import { validatePanelistInvite, acceptPanelistInvite } from '../../services/inviteService'
import ErrorBanner from '../../components/ui/ErrorBanner'

export default function InviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState(null)
  const [expired, setExpired] = useState(false)

  const [tempPassword, setTempPassword] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await validatePanelistInvite(token)
        if (cancelled) return
        setInvite(data)
        setName(data.name || '')
      } catch (e) {
        if (cancelled) return
        const status = e?.response?.status
        if (status === 410) setExpired(true)
        setError(e?.response?.data?.message || 'This invitation is not valid.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!tempPassword) {
      setFormError('Temporary password is required.')
      return
    }
    if (password.length < 8) {
      setFormError('New password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const data = await acceptPanelistInvite(token, { tempPassword, name, password })
      setSession(data.token, data.user)
    } catch (e) {
      setFormError(e?.response?.data?.message || 'Failed to activate account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-white/60">
        Validating invitation…
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <ErrorBanner message={expired ? 'This invitation has expired or already been used.' : error} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-gold hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16 font-display">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Activate your panelist account</h1>
        <p className="text-sm text-white/60">
          You have been invited as an External Panelist for CORE-V.
        </p>
        {invite?.email && (
          <p className="truncate text-xs text-white/50">Account email: {invite.email}</p>
        )}
      </header>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Temporary password</span>
          <input
            type="password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            autoComplete="current-password"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            autoComplete="new-password"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Confirm password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            autoComplete="new-password"
          />
        </label>

        {formError && <p className="max-w-full min-w-0 text-xs text-rose-300">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Activating…' : 'Activate account'}
        </button>
      </form>
    </div>
  )
}
