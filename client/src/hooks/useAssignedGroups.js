import { useCallback, useEffect, useState } from 'react'
import useAuth from '../context/useAuth'
import { listAssignedGroups } from '../services/panelistService'

export default function useAssignedGroups() {
  const { user } = useAuth()
  const userId = user?.user_id ?? user?.id
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setGroups(await listAssignedGroups(userId))
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load your groups.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { groups, loading, error, reload: load }
}