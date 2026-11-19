import { useMemo, useState } from 'react'
import useForum from '../../context/useForum'
import { FEED_GROUPS } from '../../services/feedData'
import FeedFilters, { applyFilters, EMPTY_FILTERS } from './FeedFilters'
import ForumPostCard from './ForumPostCard'

const PAGE = 5

export default function FeedList({ groupId = null }) {
  const { posts, openComposer } = useForum()
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, group: groupId ?? '' })
  const [shown, setShown] = useState(PAGE)

  const scoped = useMemo(() => (groupId ? posts.filter((p) => p.groupId === groupId) : posts), [posts, groupId])
  const visible = useMemo(() => applyFilters(scoped, filters), [scoped, filters])
  const filtered = Boolean(
    filters.query.trim() ||
      filters.flair ||
      filters.strand ||
      filters.section ||
      filters.yearLevel ||
      filters.schoolYear ||
      (!groupId && filters.group)
  )

  const change = (next) => {
    setFilters(next)
    setShown(PAGE)
  }

  return (
    <div className="space-y-4">
      <FeedFilters posts={scoped} groups={FEED_GROUPS} value={filters} onChange={change} lockGroup={Boolean(groupId)} />

      <div className="space-y-4">
        {visible.slice(0, shown).map((post) => (
          <ForumPostCard key={post.id} post={post} showGroup={!groupId} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center font-display text-sm text-white/60">
          {filtered ? (
            <>
              <p>No posts match your filters.</p>
              <button
                type="button"
                onClick={() => change({ ...EMPTY_FILTERS, group: groupId ?? '' })}
                className="mt-3 font-semibold text-gold transition hover:text-gold-light"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p>No posts yet. Start the conversation!</p>
              <button
                type="button"
                onClick={() => openComposer({})}
                className="mt-3 font-semibold text-gold transition hover:text-gold-light"
              >
                Add new post
              </button>
            </>
          )}
        </div>
      )}

      {visible.length > shown && (
        <div className="flex flex-col items-center gap-2 pt-2 font-display">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="h-11 rounded-full border border-white/25 bg-white/5 px-8 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Load more
          </button>
          <p className="text-xs text-white/40">
            Showing {Math.min(shown, visible.length)} of {visible.length}
          </p>
        </div>
      )}
    </div>
  )
}