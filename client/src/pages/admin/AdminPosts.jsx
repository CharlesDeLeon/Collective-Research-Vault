import { useCallback, useEffect, useRef, useState } from 'react'
import { listAdminPosts, listAdminGroups, getUserNames, apiMessage } from '../../services/adminService'
import usePostActions from '../../hooks/usePostActions'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { glass, STATUS_STYLES } from '../../components/dashboard/constants'
import { SearchIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'
import ConfirmModal from '../../components/ui/ConfirmModal'
import StatusPill from '../../components/dashboard/StatusPill'
import RoleBadge from '../../components/forum/RoleBadge'
import PostSummary, { PostFlags } from '../../components/admin/PostSummary'
import PostDetailModal from '../../components/admin/PostDetailModal'
import Pager from '../../components/admin/Pager'
import { normalizeStatus } from '../../utils/paperRules'
import { badgeRole } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const PAGE_SIZE = 25
const FLAIRS = ['proposal', 'submitted', 'needs_revision', 'approved', 'published', 'rejected']
const TYPE_LABEL = { update: 'Update', video: 'Video', paper: 'Paper' }
const TYPES = ['update', 'video', 'paper']

const dateInputCls =
  'mt-1 h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 px-3 text-sm text-white outline-none transition scheme-dark focus:border-gold/60 focus:ring-2 focus:ring-gold/20'

const ghost =
  'rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('')
  const [flair, setFlair] = useState('')
  const [type, setType] = useState('')
  const [author, setAuthor] = useState('')
  const [visibility, setVisibility] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeRemoved, setIncludeRemoved] = useState(false)
  const [authors, setAuthors] = useState([])
  const [open, setOpen] = useState(null)
  const requestId = useRef(0)

  const debouncedSearch = useDebouncedValue(search.trim())
  const hasFilters = Boolean(search || groupId || flair || type || author || visibility || dateFrom || dateTo || includeRemoved)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    const extra = backendSupport.adminPostFilters
      ? {
          type: type || undefined,
          authorId: author || undefined,
          visibility: visibility || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }
      : {}
    const removed = backendSupport.adminRestoreRemoved && includeRemoved ? { includeRemoved: true } : {}
    try {
      const data = await listAdminPosts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        groupId: groupId || undefined,
        status: flair || undefined,
        ...extra,
        ...removed,
      })
      if (id !== requestId.current) return
      setPosts(data)
    } catch (e) {
      if (id !== requestId.current) return
      setError(apiMessage(e, 'Could not load posts.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, debouncedSearch, groupId, flair, type, author, visibility, dateFrom, dateTo, includeRemoved])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!backendSupport.adminPostFilters) return undefined
    let live = true
    getUserNames()
      .then((names) => {
        if (live) setAuthors(Object.entries(names).map(([id, name]) => ({ id, name })))
      })
      .catch(() => {
        if (live) setAuthors([])
      })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    listAdminGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [])

  const { request, modalProps } = usePostActions(load)

  const change = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setGroupId('')
    setFlair('')
    setType('')
    setAuthor('')
    setVisibility('')
    setDateFrom('')
    setDateTo('')
    setIncludeRemoved(false)
    setPage(1)
  }

  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Posts</h1>
        <p className="mt-1 text-sm text-white/60">
          Every post and paper in the feed. Admins can hide or remove content. Publishing papers and approving access stay with the group adviser.
        </p>
      </header>

      <section className={`${glass} p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_12rem_auto]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search posts</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={change(setSearch)}
              placeholder="Search post text or paper title"
              className="h-11 w-full rounded-lg border border-white/20 bg-navy-900/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
          </label>
          <div className="-mt-1">
            <Select value={groupId} onChange={change(setGroupId)} aria-label="Filter by group" className="border-white/20">
              <Option value="">All groups</Option>
              {groups.map((g) => (
                <Option key={g.group_id} value={String(g.group_id)}>
                  {g.group_name}
                </Option>
              ))}
            </Select>
          </div>
          <div className="-mt-1">
            <Select value={flair} onChange={change(setFlair)} aria-label="Filter by flair" className="border-white/20">
              <Option value="">All flairs</Option>
              {FLAIRS.map((f) => (
                <Option key={f} value={f}>
                  {STATUS_STYLES[f].label}
                </Option>
              ))}
            </Select>
          </div>
          <button type="button" onClick={clearFilters} disabled={!hasFilters} className={`${ghost} h-11 px-4 text-sm`}>
            Clear filters
          </button>
        </div>
        <div className="mt-3 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-[10rem_14rem_12rem_11rem_11rem_auto] xl:justify-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Type</span>
            <Select
              value={type}
              onChange={change(setType)}
              aria-label="Filter by type"
              disabled={!backendSupport.adminPostFilters}
              className="border-white/20"
            >
              <Option value="">All types</Option>
              {TYPES.map((value) => (
                <Option key={value} value={value}>{TYPE_LABEL[value]}</Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Author</span>
            <Select
              value={author}
              onChange={change(setAuthor)}
              aria-label="Filter by author"
              disabled={!backendSupport.adminPostFilters || authors.length === 0}
              className="border-white/20"
            >
              <Option value="">All authors</Option>
              {authors.map((a) => (
                <Option key={a.id} value={String(a.id)}>{a.name}</Option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Visibility</span>
            <Select
              value={visibility}
              onChange={change(setVisibility)}
              aria-label="Filter by visibility"
              disabled={!backendSupport.adminPostFilters}
              className="border-white/20"
            >
              <Option value="">Any visibility</Option>
              <Option value="visible">Visible</Option>
              <Option value="hidden">Hidden</Option>
              <Option value="reported">Reported</Option>
            </Select>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">From</span>
            <input type="date" value={dateFrom} max={dateTo || undefined} disabled={!backendSupport.adminPostFilters} onChange={change(setDateFrom)} className={dateInputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/55">To</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} disabled={!backendSupport.adminPostFilters} onChange={change(setDateTo)} className={dateInputCls} />
          </label>
          <label className="flex items-end gap-2 pb-3 text-xs text-white/75">
            <input
              type="checkbox"
              checked={includeRemoved}
              disabled={!backendSupport.adminRestoreRemoved}
              onChange={(e) => {
                setIncludeRemoved(e.target.checked)
                setPage(1)
              }}
              className="size-4 accent-gold"
            />
            Include removed
          </label>
        </div>
        {!backendSupport.adminPostFilters && <p className="mt-3 text-xs text-white/50">{unsupportedNote.adminPostFilters}</p>}
        {!backendSupport.adminRestoreRemoved && <p className="mt-1 text-xs text-white/50">{unsupportedNote.adminRestoreRemoved}</p>}
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-ink">
          <span>{error}</span>
          <button type="button" onClick={load} className={ghost}>
            Try again
          </button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        !error && (
          <div className={`${glass} px-6 py-12 text-center`}>
            <p className="font-semibold">{hasFilters ? 'No posts match these filters.' : 'No posts yet.'}</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className={`${ghost} mt-4`}>
                Clear filters
              </button>
            )}
          </div>
        )
      ) : (
        <>
          <div className={`${glass} hidden overflow-x-auto md:block ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                  <th scope="col" className="px-5 py-3 font-semibold">Post</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Author</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Group</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Flair</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Visibility</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Comments</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Posted</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="max-w-[18rem] px-5 py-3">
                      <span className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-wide text-white/50">{TYPE_LABEL[p.type] ?? 'Post'}</span>
                      <span className="line-clamp-2 wrap-break-word">{p.type === 'paper' && p.paperTitle ? p.paperTitle : p.text || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block truncate font-semibold">{p.authorName}</span>
                      <RoleBadge role={badgeRole(p.authorRole)} />
                    </td>
                    <td className="px-5 py-3 text-white/75">{p.groupName || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3">{p.status ? <StatusPill status={normalizeStatus(p.status)} /> : <span className="text-white/45">—</span>}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {!p.hidden && !p.reported && <span className="text-white/60">Visible</span>}
                        <PostFlags post={p} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/75">{p.commentCount ?? 0}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-white/75">{timeAgo(p.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {backendSupport.adminRestoreRemoved && p.removed && (
                          <button type="button" onClick={() => request(p, 'restore')} className={ghost}>
                            Restore
                          </button>
                        )}
                        <button type="button" onClick={() => setOpen(p)} className={ghost}>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={`space-y-3 md:hidden ${loading ? 'opacity-60' : ''}`}>
            {posts.map((p) => (
              <li key={p.id} className={`${glass} p-4`}>
                <PostSummary post={p} lines={2} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {backendSupport.adminRestoreRemoved && p.removed && (
                    <button type="button" onClick={() => request(p, 'restore')} className={ghost}>
                      Restore
                    </button>
                  )}
                  <button type="button" onClick={() => setOpen(p)} className={ghost}>
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={page}
            hasNext={posts.length === PAGE_SIZE}
            onPage={setPage}
            summary={`${posts.length} ${posts.length === 1 ? 'post' : 'posts'} shown`}
          />
          {!backendSupport.adminListTotals && <p className="text-xs text-white/45">{unsupportedNote.adminListTotals}</p>}
        </>
      )}

      {open && <PostDetailModal post={open} onAction={request} onClose={() => setOpen(null)} />}
      {modalProps && <ConfirmModal {...modalProps} />}
    </div>
  )
}