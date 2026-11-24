import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService'

const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

const backendReason = (err) => {
  const value = err?.response?.data?.message ?? err?.response?.data?.error
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[.!]+$/, '')
}

const failureMessage = (subject, err) => {
  const reason = backendReason(err)
  return reason ? `${subject}: ${reason}. Please try again.` : `${subject}. Please try again.`
}

export function useNotifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const signalRef = useRef({ cancelled: false })
  const actionBusyRef = useRef(false)

  const refresh = useCallback(async () => {
    const signal = signalRef.current
    if (signal.cancelled || actionBusyRef.current) return
    setRefreshing(true)
    try {
      const data = await fetchNotifications()
      if (!signal.cancelled) {
        setItems(data)
        setError(null)
      }
    } catch (err) {
      if (!signal.cancelled) setError(err.response?.data?.message || 'Could not load your notifications.')
    } finally {
      if (!signal.cancelled) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    signalRef.current = { cancelled: false }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      signalRef.current.cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  const unread = useMemo(() => items.filter((n) => !n.isRead).sort(newestFirst), [items])
  const past = useMemo(() => items.filter((n) => n.isRead).sort(newestFirst), [items])

  const setRead = (ids, isRead) =>
    setItems((list) => list.map((n) => (ids.has(n.id) ? { ...n, isRead } : n)))

  const markRead = async (id) => {
    const ids = new Set([id])
    setActionError(null)
    actionBusyRef.current = true
    try {
      await markNotificationRead(id)
      setRead(ids, true)
    } catch (err) {
      setActionError(failureMessage('Could not update that notification', err))
    } finally {
      actionBusyRef.current = false
    }
  }

  const markAllRead = async () => {
    const ids = new Set(unread.map((n) => n.id))
    if (ids.size === 0) return
    setActionError(null)
    actionBusyRef.current = true
    try {
      await markAllNotificationsRead()
      setRead(ids, true)
    } catch (err) {
      setActionError(failureMessage('Could not mark all as seen', err))
    } finally {
      actionBusyRef.current = false
    }
  }

  return { unread, past, loading, refreshing, error, actionError, markRead, markAllRead, refresh }
}
