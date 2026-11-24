import { useEffect, useState } from 'react'
import { getMyPapers } from '../services/paperService'
import { useNotifications } from './useNotifications'

export function useStudentDashboard() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { unread, past, error: notificationError } = useNotifications()
  const notifications = [...unread, ...past].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getMyPapers()
        if (!cancelled) setPapers(data)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Could not load your research. Check that the API address is set.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { papers, notifications, loading, error, notificationError }
}
