const URL_RE = /https?:\/\/[^\s<>"']+/gi
const TRAILING = /[.,;:!?)\]]+$/
const YT_ID = /^[\w-]{11}$/
const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']

function parse(raw) {
  let url
  try {
    url = new URL(raw.replace(TRAILING, ''))
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1]
    return YT_ID.test(id ?? '') ? { provider: 'youtube', id, url: url.href } : null
  }
  if (YT_HOSTS.includes(host)) {
    const [, kind, tail] = url.pathname.split('/')
    const id = kind === 'watch' ? url.searchParams.get('v') : ['shorts', 'embed', 'live'].includes(kind) ? tail : null
    return YT_ID.test(id ?? '') ? { provider: 'youtube', id, url: url.href } : null
  }
  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part))
    return id ? { provider: 'vimeo', id, url: url.href } : null
  }
  return null
}

export function findVideoLink(text = '') {
  for (const match of text.match(URL_RE) ?? []) {
    const link = parse(match)
    if (link) return link
  }
  return null
}