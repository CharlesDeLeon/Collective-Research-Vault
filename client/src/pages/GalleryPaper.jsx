import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GalleryNavbar from '../components/gallery/GalleryNavbar'
import GalleryCard from '../components/gallery/GalleryCard'
import AccessRequestModal from '../components/gallery/AccessRequestModal'
import CitationCard from '../components/public/CitationCard'
import { getGalleryPaper, getRelatedPapers, fetchGalleryPapers } from '../services/galleryService'
import { copyText } from '../utils/clipboard'
import { longDate } from '../utils/formatDate'

const dt = 'text-xs font-semibold uppercase tracking-[0.06em] text-link'

export default function GalleryPaper() {
  const { slug } = useParams()
  const [paper, setPaper] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getGalleryPaper(slug), fetchGalleryPapers()])
      .then(([p, all]) => {
        if (cancelled) return
        setPaper(p)
        if (p) setRelated(getRelatedPapers(all, p))
      })
      .catch(() => { if (!cancelled) setPaper(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  const shareLink = async () => {
    if (await copyText(window.location.href)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-page font-display text-fg">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />
        <Link to="/gallery" className="mt-2 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-fg/85">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to results
        </Link>

        {loading ? (
          <div className="mt-6 rounded-card border-[0.094rem] border-dashed border-control-line-soft px-6 py-12 text-center text-fg-on-page-subtle">
            Loading paper…
          </div>
        ) : !paper ? (
          <div className="mt-6 rounded-card border-[0.094rem] border-dashed border-control-line-soft px-6 py-12 text-center">
            <p className="m-0 text-lg font-semibold text-heading">This paper could not be found</p>
            <Link
              to="/gallery"
              className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-cta px-7 text-base font-semibold text-cta-fg"
            >
              Browse the gallery
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col items-start gap-8 lg:flex-row">
              <main className="w-full min-w-0 flex-1">
                <span className="inline-block rounded-full bg-pill-bg px-3.5 py-1 text-[0.8125rem] font-semibold text-pill-fg">
                  {paper.strand} · {paper.section} · {paper.schoolYear}
                </span>
                <h1 className="mb-0 mt-4 text-[1.625rem] font-semibold leading-tight wrap-break-word text-heading sm:text-[2.5rem]">{paper.title}</h1>
                <p className="mb-0 mt-4 text-base text-fg/85">{paper.authors.join(', ')}</p>

                <section className="mt-9" aria-labelledby="abs-h">
                  <h2 id="abs-h" className="mb-3 mt-0 text-xl font-semibold text-heading">Abstract</h2>
                  <p className="m-0 max-w-3xl text-base leading-[1.75] text-fg/90">{paper.abstract}</p>
                </section>

                <section className="mt-8" aria-labelledby="kw-h">
                  <h2 id="kw-h" className="mb-3 mt-0 text-xl font-semibold text-heading">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.map((k) => (
                      <Link
                        key={k}
                        to={`/gallery?kw=${encodeURIComponent(k)}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-keyword-line bg-keyword-bg px-3.5 text-sm text-keyword-fg hover:bg-link/10"
                      >
                        {k}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="mt-8" aria-labelledby="cite-h">
                  <h2 id="cite-h" className="mb-3 mt-0 text-xl font-semibold text-heading">Cite this paper</h2>
                  <CitationCard paper={paper} />
                </section>
              </main>

              <aside
                aria-label="Paper details"
                className="box-border w-full shrink-0 rounded-card border border-line bg-surface-strong p-6 card-shadow lg:w-80"
              >
                <dl className="m-0 grid gap-4">
                  <div>
                    <dt className={dt}>Published</dt>
                    <dd className="m-0 mt-1 text-base">{longDate(paper.publishedAt)}</dd>
                  </div>
                  <div>
                    <dt className={dt}>Strand</dt>
                    <dd className="m-0 mt-1 text-base">{paper.strand}</dd>
                  </div>
                  <div>
                    <dt className={dt}>Section</dt>
                    <dd className="m-0 mt-1 text-base">{paper.section}</dd>
                  </div>
                  <div>
                    <dt className={dt}>School year</dt>
                    <dd className="m-0 mt-1 text-base">{paper.schoolYear}</dd>
                  </div>
                  <div>
                    <dt className={dt}>Adviser</dt>
                    <dd className="m-0 mt-1 text-base">{paper.adviser}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => setRequesting(true)}
                  className="mt-6 min-h-12 w-full rounded-xl bg-cta text-base font-semibold text-cta-fg"
                >
                  Request access
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  className="mt-2.5 min-h-12 w-full rounded-xl border-[0.094rem] border-control-line bg-transparent text-[0.9375rem] font-medium text-fg hover:bg-fg/10"
                >
                  {copied ? 'Link copied' : 'Share link'}
                </button>
              </aside>
            </div>

            <RelatedSection related={related} />
            {requesting && <AccessRequestModal paper={paper} onClose={() => setRequesting(false)} />}
          </>
        )}
      </div>
    </div>
  )
}

function RelatedSection({ related }) {
  if (!related || !related.length) return null
  return (
    <section className="mt-14" aria-labelledby="rel-h">
      <h2 id="rel-h" className="mb-4 mt-0 text-[1.375rem] font-semibold text-heading">Related research</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {related.map((p) => (
          <GalleryCard key={p.id} paper={p} featured />
        ))}
      </div>
    </section>
  )
}
