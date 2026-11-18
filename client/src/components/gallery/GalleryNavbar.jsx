import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from '../Logo'
import useAuth from '../../context/useAuth'
import UserMenu from './UserMenu'

const LINKS = [
  { to: '/gallery', label: 'Gallery', also: '/paper' },
  { to: '/about', label: 'About' },
  { to: '/access/status', label: 'Request Status' },
]

const pill =
  'inline-flex min-h-11 items-center whitespace-nowrap rounded-full border-[0.094rem] px-4 text-sm sm:px-5 sm:text-base'

export default function GalleryNavbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 sm:py-6">
      <Link to="/gallery" aria-label="CORE V gallery" className="flex text-gold">
        <Logo className="size-10 sm:size-11" />
      </Link>
      <nav aria-label="Main" className="order-last flex w-full gap-2 overflow-x-auto sm:order-none sm:w-auto">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/gallery'}
            className={({ isActive }) => {
              const on = isActive || (l.also && pathname.startsWith(l.also))
              return `${pill} ${
                on
                  ? 'border-gold bg-gold/10 font-semibold text-gold'
                  : 'border-transparent text-white/85 hover:bg-white/10'
              }`
            }}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-xl border-[0.094rem] border-gold px-6 text-base font-medium text-gold hover:bg-gold/10 sm:px-7"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  )
}