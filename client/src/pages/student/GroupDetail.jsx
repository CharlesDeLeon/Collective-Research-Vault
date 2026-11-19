import { Link, useParams } from 'react-router-dom'
import useForum from '../../context/useForum'
import { FEED_GROUPS } from '../../services/feedData'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { PlusIcon } from '../../components/dashboard/icons'
import Avatar from '../../components/paper/Avatar'
import FeedList from '../../components/forum/FeedList'
import StatePanel from '../../components/public/StatePanel'

export default function GroupDetail() {
  const { groupId } = useParams()
  const { openComposer } = useForum()
  const group = FEED_GROUPS.find((g) => g.id === groupId && g.mine)

  if (!group) {
    return (
      <StatePanel title="Group not found">
        <p>This group doesn’t exist or you aren’t a member.</p>
        <Link to={ROUTES.groups} className="mt-4 inline-block font-semibold text-gold">
          Back to Groups
        </Link>
      </StatePanel>
    )
  }

  return (
    <div className="space-y-6 font-display">
      <Link to={ROUTES.groups} className="inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white">
        ‹ Groups
      </Link>

      <header className={`${glass} flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between`}>
        <div className="min-w-0 space-y-3">
          <h1 className="wrap-break-word text-2xl font-bold sm:text-3xl">{group.name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{group.strand}</span>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{group.section}</span>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{group.schoolYear}</span>
          </div>
          <p className="text-sm text-white/60">Adviser: {group.adviser}</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Members</p>
          <ul className="flex flex-wrap gap-3">
            {group.members.map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm">
                <Avatar name={m} size="sm" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Group feed</h2>
        <button
          type="button"
          onClick={() => openComposer({})}
          className="flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
        >
          <PlusIcon className="size-4" />
          Add New Post
        </button>
      </div>

      <FeedList groupId={group.id} />
    </div>
  )
}