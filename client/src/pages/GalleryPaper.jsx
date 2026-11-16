import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GalleryNavbar from '../components/gallery/GalleryNavbar'
import GalleryCard from '../components/gallery/GalleryCard'
import AccessRequestModal from '../components/gallery/AccessRequestModal'
import { getGalleryPaper, getRelatedPapers } from '../services/galleryData'
import { longDate } from '../utils/formatDate'

const dt = 'text-xs font-semibold uppercase tracking-[0.06em] text-gold'
const outlineBtn =
  'min-h-11 rounded-xl border-[0.094rem] border-gold bg-transparent px-5 text-[0.9375rem] font-medium text-gold hover:bg-gold/10'

const citationFor = (p) =>
  `${p.authors}. (${new Date(p.publishedAt).getFullYear()}). ${p.title}. CORE V Research Vault.`

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function GalleryPaper() {
  const { paperId } = useParams()
  const paper = getGalleryPaper(paperId)
  const [copied, setCopied] = useState('')
  const [requesting, setRequesting] = useState(false)

  const flash = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-navy-900 to-navy-500 font-display text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />
        <Link to="/gallery" className="mt-2 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-white/85">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to results
        </Link>

        {!paper ? (
          <div className="mt-6 rounded-[1.25rem] border-[0.094rem] border-dashed border-white/30 px-6 py-12 text-center">
            <p className="m-0 text-lg font-semibold">This paper could not be found</p>
            <Link
              to="/gallery"
              className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-linear-to-br from-gold to-gold-soft px-7 text-base font-semibold text-ink"
            >
              Browse the gallery
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col items-start gap-8 lg:flex-row">
              <main className="w-full min-w-0 flex-1">
                <span className="inline-block rounded-full bg-gold/15 px-3.5 py-1 text-[0.8125rem] font-semibold text-gold">
                  {paper.program} · {paper.schoolYear}
                </span>
                <h1 className="mb-0 mt-4 text-[1.625rem] font-semibold leading-tight sm:text-[2.5rem]">{paper.title}</h1>
                <p className="mb-0 mt-4 text-base text-white/85">{paper.authors}</p>

                <section className="mt-9" aria-labelledby="abs-h">
                  <h2 id="abs-h" className="mb-3 mt-0 text-xl font-semibold">Abstract</h2>
                  <p className="m-0 max-w-3xl text-base leading-[1.75] text-white/90">{paper.abstract}</p>
                </section>

                <section className="mt-8" aria-labelledby="kw-h">
                  <h2 id="kw-h" className="mb-3 mt-0 text-xl font-semibold">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.map((k) => (
                      <Link
                        key={k}
                        to={`/gallery?kw=${encodeURIComponent(k)}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-gold/60 px-3.5 text-sm text-[#FFD27F] hover:bg-gold/10"
                      >
                        {k}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="mt-8" aria-labelledby="cite-h">
                  <h2 id="cite-h" className="mb-3 mt-0 text-xl font-semibold">Cite this paper</h2>
                  <div className="max-w-3xl rounded-[0.875rem] border border-white/15 bg-field/40 px-4 py-4 text-sm leading-[1.7] text-white/90">
                    {citationFor(paper)}
                  </div>
                  <button type="button" onClick={() => flash('cite', citationFor(paper))} className={`mt-3 ${outlineBtn}`}>
                    {copied === 'cite' ? 'Copied' : 'Copy citation'}
                  </button>
                </section>
              </main>

              <aside
                aria-label="Paper details"
                className="box-border w-full shrink-0 rounded-[1.25rem] border border-white/12 bg-field/40 p-6 lg:w-80"
              >
                <dl className="m-0 grid gap-4">
                  <div>
                    <dt className={dt}>Published</dt>
                    <dd className="m-0 mt-1 text-base">{longDate(paper.publishedAt).replace(/\s\d+,/, '')}</dd>
                  </div>
                  <div>
                    <dt className={dt}>Program</dt>
                    <dd className="m-0 mt-1 text-base">{paper.program}</dd>
                  </div>
                  <div>
                    <dt className={dt}>School year</dt>
                    <dd className="m-0 mt-1 text-base">{paper.schoolYear}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setRequesting(true)}
                  className="mt-6 min-h-12 w-full rounded-xl bg-linear-to-br from-gold to-gold-soft text-base font-semibold text-ink"
                >
                  Request access
                </button>
                <button
                  type="button"
                  onClick={() => flash('link', window.location.href)}
                  className="mt-2.5 min-h-12 w-full rounded-xl border-[0.094rem] border-white/35 bg-transparent text-[0.9375rem] font-medium text-white hover:bg-white/10"
                >
                  {copied === 'link' ? 'Link copied' : 'Share link'}
                </button>
              </aside>
            </div>

            <RelatedSection paper={paper} />
            {requesting && <AccessRequestModal paper={paper} onClose={() => setRequesting(false)} />}
          </>
        )}
      </div>
    </div>
  )
}

function RelatedSection({ paper }) {
  const related = getRelatedPapers(paper)
  if (!related.length) return null
  return (
    <section className="mt-14" aria-labelledby="rel-h">
      <h2 id="rel-h" className="mb-4 mt-0 text-[1.375rem] font-semibold">Related research</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {related.map((p) => (
          <GalleryCard key={p.id} paper={p} featured />
        ))}
      </div>
    </section>
  )
}