import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ModalShell from '../ui/ModalShell'
import AdviserChip from './AdviserChip'
import { BellIcon } from '../dashboard/icons'
import { getAccessRequest } from '../../services/adminService'
import { RequestStatusChip } from './RequestStatusChip'

const stamp = (value) => (value ? new Date(value).toLocaleString() : '—')

const linkState = (l) => {
  if (l.revoked_at) return ['Revoked', 'border-danger/40 bg-danger/10 text-danger-ink']
  if (l.used_at) return ['Used', 'border-info/40 bg-info/10 text-info-ink']
  if (new Date(l.expires_at) < new Date()) return ['Expired', 'border-white/15 bg-white/5 text-white/55']
  return ['Active', 'border-success/40 bg-success/10 text-success-ink']
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-white/55">{label}</dt>
      <dd className="min-w-0 break-words text-white/90">{children}</dd>
    </div>
  )
}

export default function AccessRequestModal({ request, names, onClose }) {
  const [full, setFull] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    getAccessRequest(request.request_id)
      .then((data) => live && setFull(data))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [request.request_id])

  const r = full ?? request
  const adviserName = r.adviser_id ? names[r.adviser_id] ?? `User #${r.adviser_id}` : null
  const decidedBy = r.decided_by ? names[r.decided_by] ?? `User #${r.decided_by}` : null
  const links = full?.links ?? []

  return (
    <ModalShell title="Access request" icon={BellIcon} onClose={onClose}>
      <div className="mt-4 space-y-5 px-1 pb-1">
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          Handled by the group adviser. Admins can review requests here but cannot approve, decline or revoke them.
        </p>

        <dl className="divide-y divide-white/10">
          <Row label="Requester">
            {r.name}
            <span className="block text-xs text-white/55">{r.email}</span>
          </Row>
          <Row label="Institution">{r.institution || '—'}</Row>
          <Row label="Reference"><span className="font-mono text-gold">{r.reference_code || '—'}</span></Row>
          <Row label="Requested">{stamp(r.created_at)}</Row>
          <Row label="Status"><RequestStatusChip status={r.status} /></Row>
          <Row label="Paper">{r.paper_title}</Row>
          <Row label="Group">{r.group_name || '—'}</Row>
          <Row label="Adviser"><AdviserChip name={adviserName} /></Row>
        </dl>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">Purpose</h3>
          <p className="wrap-break-word whitespace-pre-line text-sm text-white/80">{r.purpose || '—'}</p>
        </section>

        {(r.decision_note || decidedBy) && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">Decision</h3>
            {decidedBy && <p className="text-sm text-white/80">Decided by {decidedBy}</p>}
            {r.decision_note && <p className="mt-1 wrap-break-word whitespace-pre-line text-sm text-white/70">{r.decision_note}</p>}
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">Links</h3>
          {failed ? (
            <p className="text-sm text-danger-ink">Could not load the links.</p>
          ) : !full ? (
            <div className="h-12 animate-pulse rounded-xl bg-white/5" aria-busy="true" />
          ) : links.length === 0 ? (
            <p className="text-sm text-white/55">No link has been issued.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => {
                const [label, cls] = linkState(l)
                return (
                  <li key={l.link_id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-white/70">#{l.link_id}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${cls}`}>{label}</span>
                    </div>
                    <p className="mt-1 text-white/55">
                      Expires {stamp(l.expires_at)}
                      {l.used_at ? ` · Used ${stamp(l.used_at)}` : ''}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {r.group_id && (
          <p className="text-xs text-white/55">
            Stuck because the adviser is unavailable?{' '}
            <Link to={`/admin/groups/${r.group_id}`} onClick={onClose} className="font-semibold text-gold underline-offset-2 hover:underline">
              Open the group
            </Link>{' '}
            to see who advises it.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}