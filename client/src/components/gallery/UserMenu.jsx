import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import { getRoleHome } from '../../utils/roleHome'
import { initials } from '../../utils/avatarColors'
import { ChevronDownIcon, HomeIcon } from '../dashboard/icons'

const itemClass =
  'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[0.9375rem] hover:bg-white/10 focus-visible:bg-white/10'

export default function UserMenu({ user }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false)
    }
    const esc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-12 items-center gap-2.5 rounded-full border-[0.094rem] border-white/30 bg-field/35 py-0 pl-1.5 pr-3 text-[0.9375rem] text-white sm:pr-3.5"
      >
        <span className="grid size-9 place-items-center rounded-full bg-gold-edge text-sm font-bold text-navy-700">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
        <ChevronDownIcon className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-20 w-56 rounded-2xl border border-white/15 bg-[#1b2653] p-2 shadow-[0_0.75rem_2rem_rgba(0,0,0,0.35)]"
        >
          <Link to={getRoleHome(user.role)} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <HomeIcon className="size-4.5 text-gold" />
            Back to dashboard
          </Link>
          <button type="button" role="menuitem" onClick={logout} className={`${itemClass} text-[#F2D0D0]`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4.5"
              aria-hidden="true"
            >
              <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}