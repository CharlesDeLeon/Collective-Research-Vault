import ModalShell from '../ui/ModalShell'
import { ClockIcon } from '../dashboard/icons'
import { formatAction } from '../../utils/adminRoles'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { parseDetails } from '../../utils/parseDetails'

const display = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const pairsOf = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : null

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
  const pairs = pairsOf(details)
  const before = parseDetails(entry.before_values)
  const after = parseDetails(entry.after_values)

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
          <Row label="Request ID">{entry.request_id ?? entry.requestId ?? '—'}</Row>
        </dl>

        <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gold">Details</h3>
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

        <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gold">Before and after</h3>
        {!backendSupport.adminAuditDiff ? (
          <p className="text-xs text-white/55">{unsupportedNote.adminAuditDiff}</p>
        ) : before == null && after == null ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
            No before or after values were saved for this entry.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Before', before],
              ['After', after],
            ].map(([label, value]) => {
              const valuePairs = pairsOf(value)
              return (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/55">{label}</p>
                  {valuePairs && valuePairs.length > 0 ? (
                    <dl className="mt-2 space-y-2">
                      {valuePairs.map(([key, item]) => (
                        <div key={key} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 text-xs">
                          <dt className="break-words text-white/55">{key.replace(/_/g, ' ')}</dt>
                          <dd className="min-w-0 whitespace-pre-wrap break-words text-white/90">{display(item)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs text-white/90">
                      {value == null ? '—' : display(value)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
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
