import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { DocIcon, ExternalLinkIcon } from '../../components/dashboard/icons'
import PaperSummaryCard from '../../components/paper/PaperSummaryCard'
import SectionHeading from '../../components/paper/SectionHeading'
import ResubmitModal from '../../components/paper/ResubmitModal'
import { getPaperDetail, resubmitPaper } from '../../services/paperService'
import { canEdit, canResubmit, normalizeStatus } from '../../utils/paperRules'
import { getFileDownloadUrl } from '../../utils/helpers'

const secondary =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 hover:bg-white/10'

function lockedText(status) {
  const s = normalizeStatus(status)
  if (s === 'under_review') return 'Your adviser is reviewing this paper. You can edit it again if changes are requested.'
  if (s === 'approved' || s === 'published') return 'This paper is locked. Only your adviser can change it now.'
  return ''
}

export default function PaperDetail() {
  const { paperId } = useParams()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resubmitting, setResubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getPaperDetail(paperId)
      .then((data) => { if (!cancelled) setPaper(data) })
      .catch(() => { if (!cancelled) setError('Could not load this paper.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [paperId])

  const confirmResubmit = async () => {
    try {
      const data = await resubmitPaper(paperId)
      setPaper((p) => (p ? { ...p, status: data.status ?? p.status } : p))
    } catch {
      // ignore
    }
    setResubmitting(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 font-display">
        <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
          ‹ My Papers
        </Link>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] xl:gap-8">
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-2xl bg-white/[0.07]" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/[0.07]" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-white/[0.07]" />
        </div>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className="space-y-4 font-display">
        <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
          ‹ My Papers
        </Link>
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="m-0 text-sm text-rose-200">{error || 'Paper not found.'}</p>
          <Link
            to={ROUTES.myPapers}
            className="mt-4 inline-block rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            Back to My Papers
          </Link>
        </div>
      </div>
    )
  }

  const locked = lockedText(paper.status)

  return (
    <div className="space-y-4 font-display">
      <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        My Papers
      </Link>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="research-heading">
            <div id="research-heading">
              <SectionHeading icon={DocIcon} title="My Research" />
            </div>
            <PaperSummaryCard paper={paper}>
              {canEdit(paper.status) && (
                <Link to={ROUTES.editPaper(paper.id)} className={secondary}>
                  Edit
                </Link>
              )}
              {canResubmit(paper.status) && (
                <button
                  type="button"
                  onClick={() => setResubmitting(true)}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-linear-to-br/srgb from-gold to-gold-soft px-4 text-sm font-semibold text-ink hover:brightness-105"
                >
                  Resubmit for Review
                </button>
              )}
              {locked && <p className="m-0 w-full text-xs text-white/60">{locked}</p>}
            </PaperSummaryCard>
          </section>

          <section aria-labelledby="abstract-heading">
            <div id="abstract-heading">
              <SectionHeading icon={DocIcon} title="Abstract" />
            </div>
            <div className={`${glass} p-4 sm:p-6`}>
              <p className="m-0 whitespace-pre-line wrap-break-word text-sm leading-relaxed text-white/90">
                {paper.abstract || 'No abstract provided.'}
              </p>
              {paper.keywords?.length > 0 && (
                <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 border-t border-white/10 p-0 pt-4">
                  {paper.keywords.map((k) => (
                    <li key={k} className="rounded-full border border-gold/60 px-3 py-1 text-xs text-[#FFD27F]">
                      {k}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {paper.versions?.length > 0 && (
            <section aria-labelledby="files-heading">
              <div id="files-heading">
                <SectionHeading icon={ExternalLinkIcon} title="Files" />
              </div>
              <div className={`${glass} p-4 sm:p-6`}>
                <ul className="space-y-2">
                  {paper.versions.map((v, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                      <span className="truncate text-sm">{v.fileName}</span>
                      {v.fileName && (
                        <a
                          href={getFileDownloadUrl(v.fileName ? `/uploads/${v.fileName}` : null)}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-xs font-semibold text-gold hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-8">
          <div className={`${glass} p-4 sm:p-6`}>
            <h3 className="mb-3 text-sm font-bold">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-white/50">Group</dt><dd className="text-right">{paper.groupName || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Strand</dt><dd className="text-right">{paper.strand || paper.program || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Section</dt><dd className="text-right">{paper.section || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">School year</dt><dd className="text-right">{paper.schoolYear || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Status</dt><dd className="text-right capitalize">{String(paper.status || '').replace(/_/g, ' ')}</dd></div>
            </dl>
          </div>
          <div className={`${glass} p-4 sm:p-6`}>
            <h3 className="mb-3 text-sm font-bold">Authors</h3>
            <ul className="space-y-1 text-sm">
              {(paper.authors || []).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
              {!paper.authors?.length && <li className="text-white/50">—</li>}
            </ul>
          </div>
        </aside>
      </div>

      {resubmitting && (
        <ResubmitModal paper={paper} onConfirm={confirmResubmit} onClose={() => setResubmitting(false)} />
      )}
    </div>
  )
}