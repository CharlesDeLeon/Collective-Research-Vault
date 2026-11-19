import { Link } from 'react-router-dom'
import useForum from '../../context/useForum'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { UsersIcon } from '../../components/dashboard/icons'
import Avatar from '../../components/paper/Avatar'

export default function Groups() {
  const { posts, groups: ctxGroups } = useForum()
  const groups = (ctxGroups || []).filter((g) => g.mine !== false)

  return (
    <div className="space-y-6 font-display">
      <h1 className="text-3xl font-bold">Groups</h1>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          You aren’t in a group yet. Ask your adviser to add you.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-5">
          {groups.map((g) => {
            const count = posts.filter((p) => p.groupId === g.id).length
            return (
              <Link
                key={g.id}
                to={ROUTES.group(g.id)}
                className={`${glass} flex flex-col gap-4 p-5 transition hover:border-gold/50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 wrap-break-word text-lg font-bold">{g.name}</h2>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                    <UsersIcon className="size-5" />
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{g.strand}</span>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{g.section}</span>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{g.schoolYear}</span>
                </div>
                <p className="text-sm text-white/60">Adviser: {g.adviser}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="flex -space-x-2">
                    {g.members.slice(0, 4).map((m) => (
                      <span key={m} className="rounded-full ring-2 ring-navy-700">
                        <Avatar name={m} size="sm" />
                      </span>
                    ))}
                  </span>
                  <span className="text-xs text-white/50">
                    {g.members.length} members · {count} posts
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}