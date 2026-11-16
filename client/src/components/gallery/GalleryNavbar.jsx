import { Link } from 'react-router-dom'
import Logo from '../Logo'
import useAuth from '../../context/useAuth'
import UserMenu from './UserMenu'

export default function GalleryNavbar() {
  const { user } = useAuth()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-4 sm:py-6">
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/gallery" aria-label="CORE V gallery" className="flex text-gold">
          <Logo className="size-10 sm:size-11" />
        </Link>
        <nav aria-label="Main" className="hidden sm:block">
          <Link
            to="/gallery"
            aria-current="page"
            className="inline-flex min-h-11 items-center rounded-full border-[0.094rem] border-gold bg-gold/10 px-5 text-base font-semibold text-gold"
          >
            Gallery
          </Link>
        </nav>
      </div>
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
    </header>
  )
}