import { useEffect, useState } from 'react'
import ModalShell from '../ui/ModalShell'
import Select, { Option } from '../ui/Select'
import { UsersIcon } from '../dashboard/icons'
import { apiMessage, listAdvisers, updateAdminGroup } from '../../services/adminService'

export default function ReassignAdviserModal({ group, onClose, onDone }) {
  const [advisers, setAdvisers] = useState([])
  const [adviserId, setAdviserId] = useState(group.adviser_id ? String(group.adviser_id) : '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    listAdvisers()
      .then((rows) => {
        if (live) setAdvisers(rows)
      })
      .catch((e) => {
        if (live) setError(apiMessage(e, 'Could not load the list of advisers.'))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!adviserId) {
      setError('Choose an adviser first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await updateAdminGroup(group.group_id, { adviser_id: Number(adviserId) })
      onDone()
    } catch (e) {
      setError(apiMessage(e, 'Could not reassign this adviser.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Reassign adviser" icon={UsersIcon} onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-5 px-1 pb-1">
        <p className="text-sm text-white/75">
          Choose the new adviser for <span className="max-w-full wrap-break-word font-semibold text-white">{group.group_name}</span>.
        </p>
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/60">
          The adviser approves access requests and publishes this group&apos;s papers. This change is recorded in the audit log.
        </p>
        <div>
          <span className="block text-sm font-bold uppercase tracking-wide text-gold">Adviser</span>
          {loading ? (
            <p className="mt-2 text-sm text-white/60">Loading advisers…</p>
          ) : advisers.length === 0 ? (
            <p className="mt-2 text-sm text-warn-ink">No accounts have the Adviser role yet.</p>
          ) : (
            <Select value={adviserId} onChange={(e) => setAdviserId(e.target.value)} aria-label="New adviser" className="border-white/20">
              <Option value="">Choose an adviser</Option>
              {advisers.map((a) => (
                <Option key={a.user_id} value={String(a.user_id)}>
                  {a.name}{a.email ? ` · ${a.email}` : ''}
                </Option>
              ))}
            </Select>
          )}
        </div>
        {error && <p role="alert" className="m-0 wrap-break-word text-sm text-danger-ink">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || loading || !adviserId}
            className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Reassign adviser'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
