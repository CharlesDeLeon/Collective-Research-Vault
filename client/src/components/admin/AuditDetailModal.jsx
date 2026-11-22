import ModalShell from '../ui/ModalShell'
import { ClockIcon } from '../dashboard/icons'
import { formatAction } from '../../utils/adminRoles'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

export const parseDetails = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const display = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-white/55">{label}</dt>
      <dd className="min-w-0 break-words text-white/90">{children}</dd>
    </div>
  )
}

export default function AuditDetailModal({ entry, onClose }) {
  const details = parseDetails(entry.details)
  const pairs = details && typeof details === 'object' && !Array.isArray(details) ? Object.entries(details) : null

  return (
    <ModalShell title="Audit entry" icon={ClockIcon} onClose={onClose}>
      <div className="mt-4 px-1 pb-1">
        <dl className="divide-y divide-white/10">
          <Row label="When">{entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}</Row>
          <Row label="Who">
            {entry.user_name || 'System'}
            {entry.user_email && <span className="block text-xs text-white/55">{entry.user_email}</span>}
          </Row>
          <Row label="Action">{formatAction(entry.action)}</Row>
          <Row label="Target">
            {entry.target_type ? `${entry.target_type}${entry.target_id ? ` #${entry.target_id}` : ''}` : '—'}
          </Row>
          <Row label="IP address">{entry.ip_address || '—'}</Row>
        </dl>

        <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gold">Details</h3>
        {!backendSupport.adminAuditDiff && (
          <p className="mb-3 text-xs text-white/55">{unsupportedNote.adminAuditDiff}</p>
        )}
        {pairs && pairs.length > 0 ? (
          <dl className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            {pairs.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-xs">
                <dt className="break-words text-white/55">{key.replace(/_/g, ' ')}</dt>
                <dd className="min-w-0">
                  <pre className="whitespace-pre-wrap break-words font-sans text-white/90">{display(value)}</pre>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
            {details ? display(details) : 'No details were saved for this entry.'}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}