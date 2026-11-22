import { useCallback, useEffect, useMemo, useState } from 'react'
import { listAdminPosts, listAdminGroups, apiMessage } from '../../services/adminService'
import usePostActions from '../../hooks/usePostActions'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ErrorBanner from '../../components/ui/ErrorBanner'
import PostSummary from '../../components/admin/PostSummary'
import PostDetailModal from '../../components/admin/PostDetailModal'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const btn = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const ghost = `${btn} border-white/15 text-white/75 enabled:hover:bg-white/10 enabled:hover:text-white`
const danger = `${btn} border-danger/50 text-danger-ink enabled:hover:bg-danger/15`

export default function AdviserModeration() {
  const [posts, setPosts] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupId, setGroupId] = useState('')
  const [state, setState] = useState('')
  const [open, setOpen] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPosts(await listAdminPosts({ reported: 'true', limit: 100 }))
    } catch (e) {
      setError(apiMessage(e, 'Could not load the moderation queue.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    listAdminGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [])

  const { request, modalProps } = usePostActions(load)

  const visible = useMemo(
    () =>
      posts.filter((p) => {
        if (groupId && String(p.groupId) !== groupId) return false
        if (state === 'hidden' && !p.hidden) return false
        if (state === 'visible' && p.hidden) return false
        return true
      }),
    [posts, groupId, state]
  )
  const filtered = Boolean(groupId || state)

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Moderation</h1>
        <p className="mt-1 text-sm text-white/60">Posts reported in your groups. You decide what stays. Moderation is manual.</p>
      </header>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[14rem_12rem_auto] xl:justify-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Group</span>
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="Filter by group" className="border-white/20">
              <Option value="">All my groups</Option>
              {groups.map((g) => (
                <Option key={g.group_id} value={String(g.group_id)}>
                  {g.group_name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">State</span>
            <Select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by state" className="border-white/20">
              <Option value="">All</Option>
              <Option value="visible">Visible</Option>
              <Option value="hidden">Hidden</Option>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => {
              setGroupId('')
              setState('')
            }}
            disabled={!filtered}
            className={`${ghost} h-11 self-end px-4 text-sm`}
          >
            Clear filters
          </button>
        </div>
        {!backendSupport.adminModerationReason && <p className="mt-3 text-xs text-white/50">{unsupportedNote.adminModerationReason}</p>}
      </section>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{filtered ? 'No reported posts match these filters.' : 'No reported posts.'}</p>
            <p className="mt-1 text-sm text-white/60">{filtered ? 'Try clearing the filters.' : 'Nothing in your groups needs a decision right now.'}</p>
          </div>
        )
      ) : (
        <>
          <p className="text-sm text-white/60">
            {visible.length} reported {visible.length === 1 ? 'post' : 'posts'}
          </p>
          <ul className="space-y-3">
            {visible.map((p) => (
              <li key={p.id} className={`${glass} p-4 sm:p-5`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <PostSummary post={p} />
                  </div>
                  <div className="flex flex-wrap gap-2 lg:w-44 lg:shrink-0 lg:flex-col">
                    <button type="button" onClick={() => setOpen(p)} className={ghost}>
                      View
                    </button>
                    <button type="button" onClick={() => request(p, p.hidden ? 'show' : 'hide')} className={ghost}>
                      {p.hidden ? 'Make visible' : 'Hide'}
                    </button>
                    <button type="button" onClick={() => request(p, 'remove')} className={danger}>
                      Remove
                    </button>
                    <button type="button" disabled title={unsupportedNote.adminDismissReport} className={ghost}>
                      Dismiss report
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && <PostDetailModal post={open} onAction={request} onClose={() => setOpen(null)} />}
      {modalProps && <ConfirmModal {...modalProps} />}
    </div>
  )
}