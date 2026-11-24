import useForum from '../../context/useForum'
import FeedList from '../../components/forum/FeedList'
import NotificationsPreview from '../../components/forum/NotificationsPreview'
import { PlusIcon } from '../../components/dashboard/icons'

export default function Forum() {
  const { openComposer } = useForum()

  return (
    <div className="grid gap-x-8 gap-y-6 font-display xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)]">
      <div className="min-w-0 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Forum</h1>
          <button
            type="button"
            onClick={() => openComposer({})}
            className="flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 lg:hidden"
          >
            <PlusIcon className="size-4" />
            Add New Post
          </button>
        </div>
        <FeedList />
      </div>

      <div className="min-w-0 xl:self-start">
        <NotificationsPreview />
      </div>
    </div>
  )
}