import { Link } from 'react-router-dom'
import { monthYear } from '../../utils/formatDate'

export default function GalleryCard({ paper, featured = false }) {
  const extra = paper.keywords.length - 2
  return (
    <Link
      to={`/gallery/${paper.id}`}
      className={`flex flex-col gap-3 rounded-[1.25rem] border bg-field/35 transition hover:-translate-y-0.5 hover:bg-field/55 ${
        featured ? 'border-gold/45 p-6' : 'border-white/12 p-5'
      }`}
    >
      <span className="self-start rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
        {paper.program} · {paper.schoolYear}
      </span>
      <h3 className={`m-0 font-semibold leading-snug ${featured ? 'text-xl' : 'text-lg'}`}>{paper.title}</h3>
      {!featured && <p className="m-0 text-[0.8125rem] text-white/75">{paper.authors}</p>}
      <p className="m-0 line-clamp-3 text-sm leading-relaxed text-white/80">{paper.abstract}</p>
      {!featured && (
        <div className="flex flex-wrap gap-1.5">
          {paper.keywords.slice(0, 2).map((k) => (
            <span key={k} className="rounded-full border border-gold/60 px-2.5 py-0.5 text-xs text-[#FFD27F]">
              {k}
            </span>
          ))}
          {extra > 0 && <span className="px-1.5 py-0.5 text-xs text-white/70">+{extra}</span>}
        </div>
      )}
      <p
        className={`m-0 mt-auto text-[0.8125rem] text-white/70 ${featured ? '' : 'border-t border-white/10 pt-3'}`}
      >
        {featured ? `${paper.authors} · Published ${monthYear(paper.publishedAt)}` : `Published ${monthYear(paper.publishedAt)}`}
      </p>
    </Link>
  )
}