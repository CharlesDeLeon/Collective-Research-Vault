import { useCallback, useEffect, useMemo, useState } from 'react'
import { listAdminPosts, listAdminGroups, apiMessage } from '../../services/adminService'
import usePostActions from '../../hooks/usePostActions'
import { glass } from '../../components/dashboard/constants'
import Select, { Option } from '../../components/ui/Select'
import ConfirmModal from '../../components/ui/ConfirmModal'
import PostSummary from '../../components/admin/PostSummary'
import PostDetailModal from '../../components/admin/PostDetailModal'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const btn =
  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const ghost = `${btn} border-white/15 text-white/75 enabled:hover:bg-white/10 enabled:hover:text-white`
const danger = `${btn} border-danger/50 text-danger-ink enabled:hover:bg-danger/15`

const TYPES = [
  ['update', 'Update'],
  ['video', 'Video'],
  ['paper', 'Paper'],
]

const dateInputCls =
  'mt-1 h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 px-3 text-sm text-white outline-none transition scheme-dark focus:border-gold/60 focus:ring-2 focus:ring-gold/20'

export default function AdminModeration() {
  const [posts, setPosts] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupId, setGroupId] = useState('')
  const [state, setState] = useState('')
  const [type, setType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
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
        if (type && p.type !== type) return false
        const day = p.createdAt?.slice(0, 10)
        if (dateFrom && (!day || day < dateFrom)) return false
        if (dateTo && (!day || day > dateTo)) return false
        return true
      }),
    [posts, groupId, state, type, dateFrom, dateTo]
  )
  const filtered = Boolean(groupId || state || type || dateFrom || dateTo)

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Moderation</h1>
        <p className="mt-1 text-sm text-white/60">Posts members have reported, from every group. Moderation is manual.</p>
      </header>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[10rem_14rem_10rem_11rem_11rem_auto] xl:justify-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Type</span>
            <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type" className="border-white/20">
              <Option value="">All types</Option>
              {TYPES.map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Group</span>
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="Filter by group" className="border-white/20">
              <Option value="">All groups</Option>
              {groups.map((g) => (
                <Option key={g.group_id} value={String(g.group_id)}>
                  {g.group_name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Status</span>
            <Select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by status" className="border-white/20">
              <Option value="">All</Option>
              <Option value="visible">Visible</Option>
              <Option value="hidden">Hidden</Option>
            </Select>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">From</span>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className={dateInputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">To</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className={dateInputCls} />
          </label>
          <button
            type="button"
            onClick={() => {
              setGroupId('')
              setState('')
              setType('')
              setDateFrom('')
              setDateTo('')
            }}
            disabled={!filtered}
            className={`${ghost} h-11 self-end px-4 text-sm`}
          >
            Clear filters
          </button>
        </div>
        {!backendSupport.adminModerationReason && <p className="mt-3 text-xs text-white/50">{unsupportedNote.adminModerationReason}</p>}
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={danger}>
            Try again
          </button>
        </div>
      )}

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
            <p className="mt-1 text-sm text-white/60">{filtered ? 'Try clearing the filters.' : 'Nothing needs a decision right now.'}</p>
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
                    <button
                      type="button"
                      onClick={() => request(p, 'dismiss')}
                      disabled={!backendSupport.adminDismissReport}
                      title={!backendSupport.adminDismissReport ? unsupportedNote.adminDismissReport : undefined}
                      className={ghost}
                    >
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