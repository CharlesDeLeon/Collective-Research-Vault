import { Link } from 'react-router-dom'
import useForum from '../../context/useForum'
import { glass, ROUTES } from '../dashboard/constants'
import { CommentIcon, HeartIcon, PlusIcon } from '../dashboard/icons'
import CommentThread from '../forum/CommentThread'
import SectionHeading from './SectionHeading'

export default function ForumSection({ paper }) {
  const { posts, openComposer, toggleLike } = useForum()
  const post = posts.find((p) => p.paperId === paper.id)

  return (
    <section aria-labelledby="discussion-heading">
      <div id="discussion-heading" className="flex items-start justify-between gap-3">
        <SectionHeading icon={CommentIcon} title="Discussion" />
        <Link
          to={ROUTES.forum}
          className="text-xs font-semibold text-gold transition hover:text-gold-light"
        >
          Open feed
        </Link>
      </div>

      {post ? (
        <div className={`${glass} space-y-4 p-4 sm:p-5`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              aria-pressed={post.liked}
              aria-label={post.liked ? 'Unlike' : 'Like'}
              className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition ${
                post.liked
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-white/25 bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              <HeartIcon className={`size-4 ${post.liked ? 'fill-current' : ''}`} />
              {post.likes}
            </button>
            <span className="text-xs text-white/50">
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
          <CommentThread post={post} />
        </div>
      ) : (
        <div className={`${glass} flex flex-col items-start gap-3 p-4 sm:p-5`}>
          <p className="text-sm text-white/60">
            This paper isn’t in the feed yet. Share it so your adviser and panelists can comment.
          </p>
          <button
            type="button"
            onClick={() => openComposer({ type: 'paper', paperId: paper.id })}
            className="flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
          >
            <PlusIcon className="size-4" />
            Share to feed
          </button>
        </div>
      )}
    </section>
  )
}