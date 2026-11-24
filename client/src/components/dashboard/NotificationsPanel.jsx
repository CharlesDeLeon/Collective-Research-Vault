import { glass } from './constants'
import { ClockIcon, CommentIcon, CheckIcon, AlertIcon } from './icons'
import { timeAgo } from '../../utils/formatDate'

const TYPE_STYLES = {
  new_comment: { Icon: CommentIcon, cls: 'bg-sky-500/20 text-sky-300' },
  status_change: { Icon: CheckIcon, cls: 'bg-emerald-500/20 text-emerald-300' },
  assignment: { Icon: CheckIcon, cls: 'bg-emerald-500/20 text-emerald-300' },
  system: { Icon: AlertIcon, cls: 'bg-amber-500/20 text-amber-300' },
}

export default function NotificationsPanel({ notifications, limit = 3, onViewAll, error }) {
  const items = [...notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)

  return (
    <section aria-labelledby="notif-heading" className="min-w-0">
      <h2
        id="notif-heading"
        className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70"
      >
        <ClockIcon /> Notifications
      </h2>

      <div className={`${glass} p-4 sm:p-5`}>
        {error && (
          <p role="alert" className="m-0 mb-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/50">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((n) => {
              const { Icon, cls } = TYPE_STYLES[n.type] ?? TYPE_STYLES.system
              return (
                <li key={n.id} className="flex gap-3 py-3 first:pt-0">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${cls}`}>
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="wrap-break-word text-sm leading-snug text-white/90">{n.message}</p>
                    <p className="mt-1 text-xs text-white/40">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-gold"
                      aria-label="Unread"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onViewAll}
          className="mt-2 w-full rounded-full border border-white/15 py-2 text-xs font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
        >
          View All Notifications
        </button>
      </div>
    </section>
  )
}