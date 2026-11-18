import { useState } from 'react'

const PROVIDERS = {
  youtube: {
    label: 'YouTube',
    host: 'youtube.com',
    src: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
  },
  vimeo: {
    label: 'Vimeo',
    host: 'vimeo.com',
    src: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
  },
}

export default function VideoEmbed({ link }) {
  const [playing, setPlaying] = useState(false)
  const provider = PROVIDERS[link.provider]

  if (playing) {
    return (
      <iframe
        src={provider.src(link.id)}
        title={`${provider.label} video`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-xl border-0 bg-black"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${provider.label} video`}
      className="group grid aspect-video w-full place-items-center rounded-xl border border-white/15 bg-linear-to-br from-field to-navy-900 transition hover:border-gold/60"
    >
      <span className="flex flex-col items-center gap-2 px-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-gold text-ink shadow-lg transition group-hover:scale-105">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 size-6" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        <span className="text-sm font-medium text-white">Play {provider.label} video</span>
        <span className="text-xs text-white/50">Loads from {provider.host} when you press play</span>
      </span>
    </button>
  )
}   