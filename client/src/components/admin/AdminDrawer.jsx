import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import Logo from '../Logo'
import { CloseIcon } from '../dashboard/icons'
import { ADMIN_NAV } from './adminNav'

const itemBase = 'flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-[0.9375rem] transition-colors'

export default function AdminDrawer({ open, onClose, user, onLogout }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 font-display text-white lg:hidden">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-white/10 bg-navy-900 p-5 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between pb-6">
          <span className="flex items-center gap-2">
            <Logo className="size-9 shrink-0 text-gold" />
            <span className="text-lg font-bold tracking-wide">
              CORE <span className="text-gold">V</span>
            </span>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            return item.disabled ? (
              <span key={item.label} aria-disabled="true" className={`${itemBase} cursor-not-allowed text-white/30`}>
                <Icon className="size-5" />
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `${itemBase} ${
                    isActive
                      ? 'border-r-4 border-r-gold-edge bg-gold/10 text-gold'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="size-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <p className="truncate text-sm font-medium">{user?.name ?? user?.full_name ?? 'Admin'}</p>
          <p className="text-xs text-white/50">System Admin</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>,
    document.body
  )
}