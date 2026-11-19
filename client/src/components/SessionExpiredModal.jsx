import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useAuth from '../context/useAuth'
import { SESSION_EXPIRED_EVENT } from '../services/api'
import { AlertIcon } from './dashboard/icons'

export default function SessionExpiredModal() {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(SESSION_EXPIRED_EVENT, show)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, show)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    buttonRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  if (!open) return null

  const confirm = () => {
    setOpen(false)
    logout()
  }

  return createPortal(
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-navy-900/70 p-4 font-display text-white backdrop-blur-xl">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-text"
        className="w-full max-w-[28rem] rounded-2xl border border-white/10 bg-modal p-6 text-center shadow-2xl shadow-black/30"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-warn/20 text-warn-ink">
          <AlertIcon className="size-6" />
        </span>
        <h2 id="session-expired-title" className="mt-4 text-xl font-bold">
          Your session expired
        </h2>
        <p id="session-expired-text" className="mt-2 text-sm leading-relaxed text-white/70">
          For your security you were signed out. Log in again to continue where you left off.
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={confirm}
          className="mt-6 h-12 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-base font-semibold text-ink transition hover:brightness-105"
        >
          Log in
        </button>
      </div>
    </div>,
    document.body
  )
}