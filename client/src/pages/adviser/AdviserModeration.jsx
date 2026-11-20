import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import { FlagIcon, CheckIcon } from '../../components/dashboard/icons'

export default function AdviserModeration() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('reported')

  const fetchReported = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/forum/posts', { params: { reported: 'true', limit: 100 } })
      setPosts(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (e) {
      console.error(e)
      setError('Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReported() }, [fetchReported])

  const hide = async (id, hidden) => {
    try {
      await api.post(`/forum/posts/${id}/hide`, { hidden })
      fetchReported()
    } catch (e) {
      console.error(e)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this post? This cannot be undone.')) return
    try {
      await api.post(`/forum/posts/${id}/remove`)
      fetchReported()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Moderation</h1>
        <p className="text-sm text-white/60">Review reported posts from your groups.</p>
      </header>

      <div className="flex gap-1 border-b border-white/10 pb-1">
        <button
          type="button"
          onClick={() => setTab('reported')}
          className={`shrink-0 rounded-t-xl px-4 py-2 text-sm font-semibold transition ${tab === 'reported' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          Reported ({posts.length})
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          No reported posts. Your groups are clean.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className={`${glass} p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{p.authorName}</span>
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[0.65rem] font-semibold text-gold">{p.strand}</span>
                    <span className="text-xs text-white/40">{p.groupName}</span>
                  </div>
                  <p className="mb-0 mt-2 text-sm text-white/80 whitespace-pre-line">{p.text}</p>
                  {p.paperTitle && (
                    <p className="mb-0 mt-2 text-xs text-white/50">Paper: {p.paperTitle}</p>
                  )}
                  <p className="mb-0 mt-2 text-[0.65rem] text-white/40">
                    Reported · {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => hide(p.id, !p.hidden)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-gold"
                  >
                    {p.hidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}