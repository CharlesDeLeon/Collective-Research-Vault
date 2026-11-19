import { useEffect, useMemo, useState } from 'react'
import { getMyPaper, resubmitPaper, setConsent } from '../services/studentPapers'

export function usePaperDetail(paperId) {
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noteStates, setNoteStates] = useState({})

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getMyPaper(paperId)
        if (!cancelled) {
          setPaper(data)
          if (!data) setError('Paper not found.')
        }
      } catch {
        if (!cancelled) setError('Could not load this paper.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [paperId])

  const notes = useMemo(
    () =>
      (paper?.notes ?? [])
        .filter((n) => noteStates[n.id] !== 'dismissed')
        .map((n) => ({ ...n, resolved: noteStates[n.id] === 'resolved' })),
    [paper, noteStates]
  )

  const dismissNote = (id) => setNoteStates((s) => ({ ...s, [id]: 'dismissed' }))
  const toggleResolved = (id) =>
    setNoteStates((s) => ({ ...s, [id]: s[id] === 'resolved' ? undefined : 'resolved' }))

  const changeConsent = async (granted) => setPaper(await setConsent(paperId, granted))
  const resubmit = async () => setPaper(await resubmitPaper(paperId))

  return { paper, notes, loading, error, dismissNote, toggleResolved, changeConsent, resubmit }
}