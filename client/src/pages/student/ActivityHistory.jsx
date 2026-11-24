import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationSection from '../../components/notifications/NotificationSection'
import NotificationRow from '../../components/notifications/NotificationRow'
import { BellIcon, ClockIcon, CloseIcon } from '../../components/dashboard/icons'

function EmptyState({ children }) {
  return <p className="py-4 text-center text-sm text-white/50">{children}</p>
}

function Alert({ children }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
    >
      {children}
    </p>
  )
}

export default function ActivityHistory() {
  const { unread, past, loading, refreshing, error, actionError, markRead, markAllRead, refresh } = useNotifications()
  const [filter, setFilter] = useState('all')

  const all = [...unread, ...past].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const visible = filter === 'unread' ? unread : filter === 'read' ? past : all
  const title = filter === 'unread' ? 'Unread Notifications' : filter === 'read' ? 'Past notifications' : 'All notifications'
  const empty = filter === 'unread' ? "You're all caught up." : filter === 'read' ? 'No past notifications yet.' : 'No notifications yet.'
  const HeadingIcon = filter === 'unread' ? BellIcon : ClockIcon

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Notifications</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread.length === 0}
            className="flex items-center gap-2 rounded-xl border border-danger bg-danger/20 px-5 py-2.5 text-sm font-bold text-danger-ink transition enabled:hover:bg-danger/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CloseIcon className="size-4 text-danger" strokeWidth={2.4} />
            Mark all as seen
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Filter notifications" className="flex gap-2">
        {[
          ['all', 'All'],
          ['unread', `Unread${unread.length ? ` (${unread.length})` : ''}`],
          ['read', 'Read'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              filter === id ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-white/70 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {loading ? (
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl bg-panel" />
          <div className="h-32 animate-pulse rounded-2xl bg-panel" />
        </div>
      ) : (
        <NotificationSection id="notifications-heading" icon={HeadingIcon} title={title}>
          {visible.length === 0 ? (
            <EmptyState>{empty}</EmptyState>
          ) : (
            <ul className="space-y-8">
              {visible.map((n) => (
                <NotificationRow
                  key={n.id ?? `${n.createdAt}-${n.message}`}
                  notification={n}
                  onDismiss={n.isRead ? undefined : markRead}
                />
              ))}
            </ul>
          )}
        </NotificationSection>
      )}
    </div>
  )
}
