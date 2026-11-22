import { NavLink, useLocation } from 'react-router-dom'
import useForum from '../../context/useForum'
import useAuth from '../../context/useAuth'
import ProfileTrigger from '../profile/ProfileTrigger'
import { ROUTES } from './constants'
import Logo from '../Logo'
import { HomeIcon, UsersIcon, BookIcon, BellIcon, PlusIcon, DocIcon, CommentIcon, UserIcon, FilterIcon, FlagIcon, AlertIcon } from './icons'

export const STUDENT_NAV = [
  { label: 'Home', to: ROUTES.home, icon: HomeIcon, end: true },
  { label: 'Feed', to: ROUTES.forum, icon: CommentIcon },
  { label: 'My Papers', to: ROUTES.myPapers, icon: DocIcon },
  { label: 'Groups', to: ROUTES.groups, icon: UsersIcon },
  { label: 'Gallery', to: ROUTES.gallery, icon: BookIcon },
  { label: 'Notifications', to: ROUTES.history, icon: BellIcon },
]

export const STUDENT_BOTTOM = [
  { label: 'Feed', to: ROUTES.forum, icon: CommentIcon },
  { label: 'My Papers', to: ROUTES.myPapers, icon: DocIcon },
  { label: 'Groups', to: ROUTES.groups, icon: UsersIcon },
  { label: 'Alerts', to: ROUTES.history, icon: BellIcon },
  { label: 'Profile', to: ROUTES.profile, icon: UserIcon },
]

// Backwards-compat aliases
export const NAV = STUDENT_NAV
export const BOTTOM = STUDENT_BOTTOM

export const ADVISER_NAV = [
  { label: 'Dashboard', to: '/adviser/dashboard', icon: HomeIcon, end: true },
  { label: 'Groups', to: '/adviser/groups', icon: UsersIcon },
  { label: 'Reviews', to: '/adviser/reviews', icon: DocIcon },
  { label: 'Access Inbox', to: '/adviser/inbox', icon: BellIcon },
  { label: 'Moderation', to: '/adviser/moderation', icon: CommentIcon },
  { label: 'Reports', to: '/adviser/reports', icon: BookIcon },
  { label: 'Analytics', to: '/adviser/analytics', icon: FilterIcon },
  { label: 'Notifications', to: '/adviser/notifications', icon: BellIcon },
  { label: 'Profile', to: '/adviser/profile', icon: UserIcon },
]

export const ADVISER_BOTTOM = [
  { label: 'Dashboard', to: '/adviser/dashboard', icon: HomeIcon },
  { label: 'Groups', to: '/adviser/groups', icon: UsersIcon },
  { label: 'Reviews', to: '/adviser/reviews', icon: DocIcon },
  { label: 'Inbox', to: '/adviser/inbox', icon: BellIcon },
  { label: 'Profile', to: '/adviser/profile', icon: UserIcon },
]

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

const itemBase =
  'flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-[0.9375rem] transition-colors'

const linkCls = ({ isActive }) =>
  `${itemBase} ${
    isActive
      ? 'border-r-4 border-r-gold-edge bg-gold/10 text-gold'
      : 'text-white/75 hover:bg-white/5 hover:text-white'
  }`

export default function Sidebar({ user, onLogout, navItems = STUDENT_NAV, roleLabel = 'Student', showComposer = true, profileTo = ROUTES.profile }) {
  const name = user?.name ?? user?.full_name ?? 'Student'
  const { pathname } = useLocation()
  const { openComposer } = useForum()
  const onForum = pathname.startsWith(ROUTES.forum)

  return (
    <aside className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-64 shrink-0 self-start flex-col overflow-y-auto rounded-3xl border border-white/10 bg-panel p-6 font-display shadow-lg shadow-black/20 backdrop-blur-sm lg:flex xl:w-72">
      <div className="flex items-center gap-3 pb-10 pt-1">
        <Logo className="size-12 shrink-0 text-gold" />
        <span className="text-2xl font-bold tracking-wide">
          CORE <span className="text-gold">V</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1.5">
        {navItems.map(({ label, to, icon: Icon, end, disabled }) =>
          disabled ? (
            <span
              key={label}
              aria-disabled="true"
              title="Coming soon"
              className={`${itemBase} cursor-not-allowed text-white/30`}
            >
              <Icon className="size-5" />
              {label}
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                linkCls({ isActive: isActive || (to === ROUTES.myPapers && pathname.startsWith(ROUTES.upload)) })
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          )
        )}
      </nav>

      <div className="mt-auto pt-6">
        {showComposer && onForum && (
          <button
            type="button"
            onClick={() => openComposer({})}
            className={`${itemBase} mb-8 w-full text-white/75 hover:bg-white/5 hover:text-white`}
          >
            <span className="grid size-6 place-items-center rounded-full bg-white/10">
              <PlusIcon className="size-4" />
            </span>
            Add New Post
          </button>
        )}
        <ProfileTrigger to={profileTo} className="flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left transition hover:bg-white/5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-ink">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-white/50">{roleLabel}</p>
          </div>
        </ProfileTrigger>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export function MobileNav({ homeTo = ROUTES.home }) {
  return (
    <div className="flex items-center justify-between font-display lg:hidden">
      <NavLink to={homeTo} end className="flex items-center gap-2" aria-label="Home">
        <Logo className="size-9 shrink-0 text-gold" />
        <span className="text-lg font-bold tracking-wide">
          CORE <span className="text-gold">V</span>
        </span>
      </NavLink>
      <NavLink
        to={ROUTES.gallery}
        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
      >
        Gallery
      </NavLink>
    </div>
  )
}

export function BottomNav({ items = STUDENT_BOTTOM }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-white/10 bg-navy-900/95 px-1 pb-[env(safe-area-inset-bottom)] font-display backdrop-blur-md lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition ${
              isActive ? 'text-gold' : 'text-white/60'
            }`
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}