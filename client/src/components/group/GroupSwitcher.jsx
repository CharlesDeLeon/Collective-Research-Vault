import { useNavigate } from 'react-router-dom'
import Select, { Option } from '../ui/Select'

const btn =
  'h-11 shrink-0 rounded-lg border border-white/15 px-4 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export default function GroupSwitcher({ groups, currentId, basePath }) {
  const navigate = useNavigate()
  const index = groups.findIndex((g) => String(g.group_id) === String(currentId))
  if (groups.length < 2 || index === -1) return null

  const go = (id) => navigate(`${basePath}/${id}`)
  const prev = groups[index - 1]
  const next = groups[index + 1]

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <button type="button" onClick={() => go(prev.group_id)} disabled={!prev} aria-label="Previous group" className={btn}>
        ‹ Previous
      </button>
      <div className="-mt-1 min-w-0 flex-1 sm:w-56 sm:flex-none">
        <Select value={String(currentId)} onChange={(e) => go(e.target.value)} aria-label="Switch group" className="border-white/20">
          {groups.map((g) => (
            <Option key={g.group_id} value={String(g.group_id)}>
              {g.group_name}
            </Option>
          ))}
        </Select>
      </div>
      <button type="button" onClick={() => go(next.group_id)} disabled={!next} aria-label="Next group" className={btn}>
        Next ›
      </button>
    </div>
  )
}