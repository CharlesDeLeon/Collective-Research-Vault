import { Link } from 'react-router-dom'
import { glass } from '../dashboard/constants'

const chip = 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70'

export default function GroupCard({ group, to }) {
  const strand = group.strand || group.program
  const members = Number(group.member_count ?? group.members?.length ?? 0)
  const papers = Number(group.submission_count ?? 0)
  return (
    <Link to={to} className={`${glass} flex flex-col gap-3 p-5 transition hover:border-gold/40`}>
      <h2 className="m-0 wrap-break-word text-lg font-bold">{group.group_name}</h2>
      <div className="flex flex-wrap gap-2">
        {strand && <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{strand}</span>}
        {group.section && <span className={chip}>{group.section}</span>}
        {group.year_level && <span className={chip}>Grade {group.year_level}</span>}
        {group.school_year && <span className={chip}>{group.school_year}</span>}
      </div>
      {group.adviser_name && <p className="m-0 text-xs text-white/55">Adviser: {group.adviser_name}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/60">
        <span>{members} {members === 1 ? 'member' : 'members'}</span>
        <span>{papers} {papers === 1 ? 'paper' : 'papers'}</span>
        <span className="font-semibold text-gold">Open</span>
      </div>
    </Link>
  )
}