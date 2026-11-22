import { Link } from 'react-router-dom'
import { monthYear } from '../../utils/formatDate'
import { shortAuthors } from '../../utils/citation'

export const cardClass = (large, starred = false) =>
  `flex flex-col gap-3 overflow-hidden rounded-card border card-shadow transition hover:-translate-y-0.5 ${
    starred
      ? 'border-starred-line bg-surface hover:bg-surface-hover'
      : 'border-line bg-surface hover:bg-surface-hover'
  } ${large ? 'p-6' : 'p-5'}`

export function GalleryCardBody({ paper, featured = false }) {
  const extra = paper.keywords.length - 2
  return (
    <>
      {paper.featured && (
        <div
          className={`flex items-center gap-1.5 bg-linear-to-r from-cta-from to-cta-to py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-cta-fg ${
            featured ? '-mx-6 -mt-6 px-6' : '-mx-5 -mt-5 px-5'
          }`}
        >
          <span aria-hidden="true">★</span> Featured
        </div>
      )}
      <span className="self-start rounded-full bg-tag-bg px-3 py-1 font-semibold text-tag-fg tag-label">
        {paper.strand} · {paper.schoolYear}
      </span>
      <h3 className={`m-0 font-semibold leading-snug text-heading ${featured ? 'text-xl' : 'text-lg'}`}>{paper.title}</h3>
      {!featured && <p className="m-0 text-[0.8125rem] text-fg-muted">{shortAuthors(paper.authors)}</p>}
      <p className="m-0 line-clamp-3 text-sm leading-relaxed text-fg-soft">{paper.abstract}</p>
      {!featured && (
        <div className="flex flex-wrap gap-1.5">
          {paper.keywords.slice(0, 2).map((k) => (
            <span key={k} className="rounded-full border border-keyword-line bg-keyword-bg px-2.5 py-0.5 text-xs text-keyword-fg">
              {k}
            </span>
          ))}
          {extra > 0 && <span className="px-1.5 py-0.5 text-xs text-fg-subtle">+{extra}</span>}
        </div>
      )}
      <p
        className={`m-0 mt-auto text-[0.8125rem] text-fg-subtle ${featured ? '' : 'border-t border-line-soft pt-3'}`}
      >
        {featured ? `${shortAuthors(paper.authors)} · Published ${monthYear(paper.publishedAt)}` : `Published ${monthYear(paper.publishedAt)}`}
      </p>
    </>
  )
}

export default function GalleryCard({ paper, featured = false }) {
  return (
    <Link to={`/paper/${paper.slug}`} className={cardClass(featured, paper.featured)}>
      <GalleryCardBody paper={paper} featured={featured} />
    </Link>
  )
}
