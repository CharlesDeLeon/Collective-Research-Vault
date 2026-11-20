import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, CommentPlusIcon } from '../dashboard/icons'
import { listMyPapers } from '../../services/studentPapers'
import Select, { Option } from '../ui/Select'

const FOCUSABLE = 'button:not([disabled]), textarea, input, select'
const TYPES = [
  { id: 'update', label: 'Update' },
  { id: 'video', label: 'Video' },
  { id: 'paper', label: 'Paper' },
]
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i

const fieldCls =
  'mt-1 w-full rounded-lg border bg-field px-3 text-sm text-white outline-none placeholder:text-field-ink focus:border-gold/60 focus:ring-2 focus:ring-gold/20'

export default function AddPostModal({ firstName, preset = {}, onClose, onSubmit }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const textRef = useRef(null)
  const [type, setType] = useState(preset.type ?? 'update')
  const [text, setText] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [papers, setPapers] = useState([])
  const [paperId, setPaperId] = useState(preset.paperId ? String(preset.paperId) : '')
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    let cancelled = false
    listMyPapers().then((list) => {
      if (!cancelled) setPapers(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    textRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [onClose])

  const trimmed = text.trim()
  const url = mediaUrl.trim()
  const errors = {}
  if (type === 'update' && !trimmed) errors.text = 'Write something to share.'
  if (type === 'video') {
    if (!url) errors.url = 'Add the video link.'
    else if (!URL_RE.test(url)) errors.url = 'Use a link that starts with https://'
  }
  if (type === 'update' && url && !URL_RE.test(url)) errors.url = 'Use a link that starts with https://'
  if (type === 'paper' && !paperId) errors.paper = 'Choose one of your papers.'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    const paper = type === 'paper' ? papers.find((p) => String(p.id) === paperId) : null
    onSubmit({
      type,
      text: trimmed || (paper ? `Sharing our paper: ${paper.title}` : ''),
      mediaUrl: type === 'paper' ? '' : url,
      paper: paper ? { id: paper.id, title: paper.title, status: paper.status } : null,
    })
  }

  const placeholders = {
    update: `What’s on your mind, ${firstName}?`,
    video: 'Say something about the video (optional)',
    paper: 'Add a note about this paper (optional)',
  }

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 font-display text-white backdrop-blur-xl"
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[34rem] rounded-2xl border border-white/10 bg-modal p-4 shadow-2xl shadow-black/30"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="flex min-w-0 items-center gap-3 px-1 text-base font-medium text-white/75">
            <CommentPlusIcon className="size-5 shrink-0" />
            <span className="truncate">Add New Post</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center gap-2 rounded-full border border-danger bg-danger/15 px-4 py-1.5 text-sm text-danger-ink transition hover:bg-danger/25"
          >
            <CloseIcon className="size-3.5 text-danger" strokeWidth={2.4} />
            Close
          </button>
        </div>

        <div role="tablist" aria-label="Post type" className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={type === t.id}
              onClick={() => {
                setType(t.id)
                setShowErrors(false)
              }}
              className={`h-9 rounded-lg text-sm font-semibold transition ${
                type === t.id ? 'bg-gold text-ink' : 'text-white/70 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type === 'paper' && (
          <label className="mt-3 block text-xs font-semibold text-white/60">
            Paper
            <Select
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              aria-invalid={showErrors && !!errors.paper}
              className={showErrors && errors.paper ? 'border-danger' : 'border-field-line'}
            >
              <Option value="">Choose a paper</Option>
              {papers.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.title}
                </Option>
              ))}
            </Select>
            {showErrors && errors.paper && (
              <span role="alert" className="mt-1 block text-xs font-normal text-danger-ink">
                {errors.paper}
              </span>
            )}
          </label>
        )}

        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder={placeholders[type]}
          aria-label="Post content"
          aria-invalid={showErrors && !!errors.text}
          className={`mt-3 h-32 w-full resize-none rounded-lg border bg-field p-3 text-sm text-white outline-none placeholder:text-field-ink focus:border-gold/60 focus:ring-2 focus:ring-gold/20 sm:h-36 sm:p-4 ${
            showErrors && errors.text ? 'border-danger' : 'border-field-line'
          }`}
        />
        {showErrors && errors.text && (
          <p role="alert" className="mt-1 text-xs text-danger-ink">
            {errors.text}
          </p>
        )}

        {type !== 'paper' && (
          <label className="mt-3 block text-xs font-semibold text-white/60">
            {type === 'video' ? 'Video link' : 'Media link (optional)'}
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              inputMode="url"
              aria-invalid={showErrors && !!errors.url}
              className={`${fieldCls} h-11 ${showErrors && errors.url ? 'border-danger' : 'border-field-line'}`}
            />
            {showErrors && errors.url && (
              <span role="alert" className="mt-1 block text-xs font-normal text-danger-ink">
                {errors.url}
              </span>
            )}
          </label>
        )}

        <button
          type="submit"
          className="mt-5 h-12 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-base font-semibold text-ink transition hover:brightness-105"
        >
          Post
        </button>
      </form>
    </div>,
    document.body
  )
}