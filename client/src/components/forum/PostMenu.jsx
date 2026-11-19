import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from '../dashboard/icons'

export default function PostMenu({ items, label = 'More actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const visible = items.filter(Boolean)
  if (visible.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid size-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <DotsIcon className="size-4" />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-modal py-1 text-sm shadow-xl shadow-black/30"
        >
          {visible.map(({ label: text, icon: Icon, onSelect, danger, disabled }) => (
            <li key={text} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  setOpen(false)
                  onSelect()
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                  danger ? 'text-danger-ink' : 'text-white/85'
                }`}
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}