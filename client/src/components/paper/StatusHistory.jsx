import { glass } from '../dashboard/constants'
import { ClockIcon } from '../dashboard/icons'
import StatusPill from '../dashboard/StatusPill'
import SectionHeading from './SectionHeading'
import { fullDate } from '../../utils/formatDate'

export default function StatusHistory({ history = [] }) {
  const items = [...history].reverse()

  return (
    <section aria-labelledby="history-heading">
      <div id="history-heading">
        <SectionHeading icon={ClockIcon} title="Status history" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-white/50">No status changes yet.</p>
      ) : (
        <ol className={`${glass} m-0 list-none p-4`}>
          {items.map((h, i) => (
            <li key={`${h.status}-${h.at}`} className="relative flex gap-3 pb-5 last:pb-0">
              {i < items.length - 1 && (
                <span aria-hidden="true" className="absolute left-1.25 top-4 h-full w-px bg-white/15" />
              )}
              <span aria-hidden="true" className={`relative mt-1.5 size-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-gold' : 'bg-white/40'}`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusPill status={h.status} />
                  <span className="text-xs text-white/50">{fullDate(h.at)}</span>
                </div>
                {h.note && <p className="mb-0 mt-2 wrap-break-word text-sm text-white/80">{h.note}</p>}
                <p className="mb-0 mt-1 text-xs text-white/40">{h.by}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}