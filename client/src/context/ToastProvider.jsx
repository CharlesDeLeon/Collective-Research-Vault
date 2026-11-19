import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'
import { CheckIcon, AlertIcon, CloseIcon } from '../components/dashboard/icons'

const LIFETIME = 4000

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, tone = 'success') => {
      counter.current += 1
      const id = counter.current
      setToasts((list) => [...list.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), LIFETIME)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast: push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-60 flex flex-col items-center gap-2 font-display lg:bottom-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === 'error' ? AlertIcon : CheckIcon
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl shadow-black/30 backdrop-blur-md ${
                t.tone === 'error'
                  ? 'border-danger bg-modal text-danger-ink'
                  : 'border-gold/40 bg-modal text-white'
              }`}
            >
              <Icon className={`size-4 shrink-0 ${t.tone === 'error' ? 'text-danger' : 'text-gold'}`} />
              <span className="min-w-0 wrap-break-word">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 text-white/50 transition hover:text-white"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}