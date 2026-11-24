import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPanelistInvites, createPanelistInvite } from '../../services/inviteService'
import { glass } from '../../components/dashboard/constants'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { timeAgo } from '../../utils/formatDate'

export default function AdviserPanelists() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setInvites(await listPanelistInvites())
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load invitations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    setResult(null)
    if (!email.trim()) {
      setFormError('Email is required.')
      return
    }
    setSubmitting(true)
    try {
      const data = await createPanelistInvite({ email: email.trim(), name: name.trim() })
      setResult(data)
      setEmail('')
      setName('')
      await load()
    } catch (e) {
      setFormError(e?.response?.data?.message || 'Could not create invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copy(value, key) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('')
    }
  }

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Panelists</h1>
        <p className="mt-1 text-sm text-white/60">
          Create invitations for external panelists. They get platform-wide access to the forum and student paper metadata.
        </p>
      </header>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <section className={`${glass} p-5 sm:p-6 space-y-4`}>
        <h2 className="text-lg font-bold">Create invitation</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="panelist@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold"
              />
            </label>
          </div>
          {formError && <p className="text-xs text-rose-300">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create invitation'}
          </button>
        </form>

        {result && (
          <div className="space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="m-0 wrap-break-word text-sm font-semibold text-gold">Invitation created for {result.email}</p>
            <p className="m-0 text-xs text-white/60">
              Share the link and temporary password with the panelist yourself. Email delivery is not confirmed automatically.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/80">{result.inviteUrl}</code>
              <button type="button" onClick={() => copy(result.inviteUrl, 'link')} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5">
                {copied === 'link' ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-white/80">{result.tempPassword}</code>
              <button type="button" onClick={() => copy(result.tempPassword, 'pw')} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5">
                {copied === 'pw' ? 'Copied' : 'Copy password'}
              </button>
            </div>
            <p className="m-0 text-xs text-white/50">
              Expires {new Date(result.expiresAt).toLocaleString()}. Single use.
            </p>
          </div>
        )}
      </section>

      <section className={`${glass} p-5 sm:p-6 space-y-4`}>
        <h2 className="text-lg font-bold">Invitations</h2>
        {loading ? (
          <p className="text-sm text-white/50">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-white/50">No invitations yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{inv.name || inv.email}</p>
                  <p className="truncate text-xs text-white/55">{inv.email} · {inv.status}</p>
                </div>
                <div className="text-xs text-white/40">
                  {inv.acceptedAt ? `Accepted ${timeAgo(inv.acceptedAt)}` : `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-white/50">
        Looking for group-specific panel assignments? Use the Panelists tab inside a group.
      </p>
    </div>
  )
}
