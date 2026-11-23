import useForum from '../../context/useForum'
import FeedList from '../../components/forum/FeedList'
import NotificationsPreview from '../../components/forum/NotificationsPreview'

export default function PanelistForum() {
  return (
    <div className="grid gap-x-8 gap-y-6 font-display xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)]">
      <div className="min-w-0 space-y-6">
        <h1 className="text-3xl font-bold">Forum</h1>
        <FeedList allowCompose={false} />
      </div>
      <div className="min-w-0 xl:self-start">
        <NotificationsPreview />
      </div>
    </div>
  )
}