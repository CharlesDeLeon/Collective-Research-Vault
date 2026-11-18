import { useState } from 'react'
import { PaperclipIcon } from '../dashboard/icons'

const normalize = (item) => (typeof item === 'string' ? { id: item, name: item, kind: 'file' } : item)
const isMedia = (a) => Boolean(a.url) && (a.kind === 'video' || a.kind === 'image')

function FileChip({ item, note }) {
  const inner = (
    <>
      <PaperclipIcon className="size-3.5 shrink-0" />
      <span className="truncate">{item.name}</span>
      {note && <span className="shrink-0 text-white/50">· {note}</span>}
    </>
  )
  const cls =
    'flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70'
  if (!item.url) return <span className={cls}>{inner}</span>
  const pdf = item.type === 'application/pdf'
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      download={pdf ? undefined : item.name}
      className={`${cls} transition hover:border-gold/60 hover:text-white`}
    >
      {inner}
    </a>
  )
}

function VideoPlayer({ item }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/70">
        <FileChip item={item} note="can’t be played here" />
      </div>
    )
  }
  return (
    <figure className="m-0">
      <video
        src={item.url}
        controls
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        aria-label={item.name}
        className="aspect-video max-h-[28rem] w-full rounded-xl bg-black object-contain"
      />
      <figcaption className="mt-1 truncate text-xs text-white/50">{item.name}</figcaption>
    </figure>
  )
}

export default function AttachmentList({ attachments }) {
  const items = (attachments ?? []).map(normalize)
  if (items.length === 0) return null
  const media = items.filter(isMedia)
  const files = items.filter((a) => !isMedia(a))

  return (
    <div className="mt-3 space-y-3">
      {media.map((item) =>
        item.kind === 'video' ? (
          <VideoPlayer key={item.id} item={item} />
        ) : (
          <img
            key={item.id}
            src={item.url}
            alt={item.name}
            loading="lazy"
            className="max-h-80 w-full rounded-xl object-cover"
          />
        )
      )}
      {files.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {files.map((item) => (
            <li key={item.id} className="min-w-0 max-w-full">
              <FileChip item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}