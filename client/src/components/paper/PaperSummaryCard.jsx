import { glass } from '../dashboard/constants'
import StatusPill from '../dashboard/StatusPill'
import { timeAgo } from '../../utils/formatDate'

export default function PaperSummaryCard({ paper, children }) {
  return (
    <article className={`${glass} flex flex-col p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <StatusPill status={paper.status} />
        <span className="text-xs text-white/40">Updated {timeAgo(paper.updatedAt)}</span>
      </div>

      <h1 className="mb-0 mt-5 wrap-break-word font-display text-xl font-semibold leading-snug sm:text-2xl">
        {paper.title}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {[paper.strand, paper.section, paper.schoolYear].filter(Boolean).map((v) => (
          <span key={v} className="max-w-full min-w-0 truncate rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
            {v}
          </span>
        ))}
      </div>
      <p className="mb-0 mt-3 wrap-break-word text-xs text-white/60">
        {paper.groupName}
        {paper.adviser ? ` · Adviser: ${paper.adviser}` : ''}
      </p>

      {children && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">{children}</div>}
    </article>
  )
}