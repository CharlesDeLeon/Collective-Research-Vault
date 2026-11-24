import { useEffect, useState } from 'react'
import { getAccessLink } from '../services/accessLinkService'

export function useAccessGate(token, granted) {
  const [res, setRes] = useState({ token: '', data: null })

  useEffect(() => {
    if (granted) return
    let live = true
    getAccessLink(token).then((data) => {
      if (live) setRes({ token, data })
    })
    return () => {
      live = false
    }
  }, [token, granted])

  if (granted) return { phase: 'ok', paperSlug: granted.paperSlug, paperTitle: granted.paperTitle || null }
  if (res.token !== token) return { phase: 'loading' }
  if (res.data.state === 'valid') return { phase: 'confirm', paperSlug: res.data.paperSlug, paperTitle: res.data.paperTitle || null }
  return { phase: 'blocked', state: res.data.state, paperSlug: res.data.paperSlug, paperTitle: res.data.paperTitle || null }
}