import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePaperDetail } from '../../hooks/usePaperDetail'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { DocIcon, ExternalLinkIcon } from '../../components/dashboard/icons'
import PaperSummaryCard from '../../components/paper/PaperSummaryCard'
import FeedbackNotes from '../../components/paper/FeedbackNotes'
import ForumSection from '../../components/paper/ForumSection'
import AuthorsCard from '../../components/paper/AuthorsCard'
import ConsentCard from '../../components/paper/ConsentCard'
import StatusHistory from '../../components/paper/StatusHistory'
import SectionHeading from '../../components/paper/SectionHeading'
import ResubmitModal from '../../components/paper/ResubmitModal'
import VideoEmbed from '../../components/forum/VideoEmbed'
import { findVideoLink } from '../../utils/videoLinks'
import { canEdit, canResubmit, normalizeStatus } from '../../utils/paperRules'

const secondary =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 hover:bg-white/10'

function lockedText(status) {
  const s = normalizeStatus(status)
  if (s === 'under_review') return 'Your adviser is reviewing this paper. You can edit it again if changes are requested.'
  if (s === 'approved' || s === 'published') return 'This paper is locked. Only your adviser can change it now.'
  return ''
}

function PaperDetailContent({ paperId }) {
  const { paper, notes, loading, error, dismissNote, toggleResolved, changeConsent, resubmit } =
    usePaperDetail(paperId)
  const [resubmitting, setResubmitting] = useState(false)

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] xl:gap-8">
        <div className="space-y-6">
          <div className="h-44 animate-pulse rounded-2xl bg-white/[0.07]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.07]" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-white/[0.07]" />
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
        <p className="m-0 text-sm text-rose-200">{error || 'Paper not found.'}</p>
        <Link
          to={ROUTES.myPapers}
          className="mt-4 inline-block rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-light"
        >
          Back to My Papers
        </Link>
      </div>
    )
  }

  const video = findVideoLink(paper.videoUrl)
  const locked = lockedText(paper.status)

  const confirmResubmit = async () => {
    await resubmit()
    setResubmitting(false)
  }

  return (
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
              {paper.abstract}
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

        {paper.videoUrl && (
          <section aria-labelledby="video-heading">
            <div id="video-heading">
              <SectionHeading icon={ExternalLinkIcon} title="Video" />
            </div>
            {video ? (
              <VideoEmbed link={video} />
            ) : (
              <a
                href={paper.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${glass} block break-all p-4 text-sm text-gold underline decoration-gold/50 underline-offset-2`}
              >
                {paper.videoUrl}
              </a>
            )}
          </section>
        )}

        <FeedbackNotes notes={notes} onDismiss={dismissNote} onResolve={toggleResolved} />

        <ForumSection paper={paper} />
      </div>

      <aside className="min-w-0 space-y-8">
        <AuthorsCard authors={paper.authors} />
        <ConsentCard paper={paper} onChange={changeConsent} />
        <StatusHistory history={paper.history} />
      </aside>

      {resubmitting && (
        <ResubmitModal paper={paper} onConfirm={confirmResubmit} onClose={() => setResubmitting(false)} />
      )}
    </div>
  )
}

export default function PaperDetail() {
  const { paperId } = useParams()
  return (
    <div className="space-y-4 font-display">
      <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        My Papers
      </Link>
      <PaperDetailContent key={paperId} paperId={paperId} />
    </div>
  )
}