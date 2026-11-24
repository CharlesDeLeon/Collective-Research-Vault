import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useToast from '../../context/useToast'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { DocIcon, ExternalLinkIcon } from '../../components/dashboard/icons'
import PaperSummaryCard from '../../components/paper/PaperSummaryCard'
import SectionHeading from '../../components/paper/SectionHeading'
import ResubmitModal from '../../components/paper/ResubmitModal'
import ConsentCard from '../../components/paper/ConsentCard'
import StatusHistory from '../../components/paper/StatusHistory'
import ForumSection from '../../components/paper/ForumSection'
import FeedbackNotes from '../../components/paper/FeedbackNotes'
import VideoEmbed from '../../components/forum/VideoEmbed'
import {
  getPaperDetail,
  resubmitPaper,
  setPaperConsent,
  resolveFeedbackNote,
  dismissFeedbackNote,
} from '../../services/paperService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
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

// VideoEmbed expects { provider, id } rather than a raw URL.
function parseVideoLink(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (['youtu.be', 'youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      const id =
        host === 'youtu.be'
          ? parsed.pathname.slice(1).split('/')[0]
          : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
      if (id) return { provider: 'youtube', id }
    }
    if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
      const id = parsed.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1]
      if (id) return { provider: 'vimeo', id }
    }
  } catch {
    // Not a parseable URL — fall back to a plain link.
  }
  return null
}

export default function PaperDetail() {
  const { paperId } = useParams()
  const { toast } = useToast()
  const [detail, setDetail] = useState({ id: null, paper: null, error: null })
  const [resubmitting, setResubmitting] = useState(false)

  // Derive loading from the loaded id so no setState is needed in the effect body.
  const loading = detail.id !== paperId
  const paper = detail.paper

  useEffect(() => {
    let cancelled = false
    getPaperDetail(paperId)
      .then((data) => {
        if (cancelled) return
        setDetail({ id: paperId, paper: data, error: null })
      })
      .catch(() => {
        if (cancelled) return
        setDetail({ id: paperId, paper: null, error: 'Could not load this paper.' })
      })
    return () => { cancelled = true }
  }, [paperId])

  const changeConsent = async (granted) => {
    const result = await setPaperConsent(paper.id, granted)
    const at =
      result?.consent?.at ??
      result?.at ??
      result?.author_consent_at ??
      result?.data?.consent?.at ??
      new Date().toISOString()
    setDetail((d) => ({
      ...d,
      paper: {
        ...d.paper,
        consent: { status: granted ? 'granted' : 'declined', at },
      },
    }))
    toast(granted ? 'Public release enabled.' : 'Public release withdrawn.')
  }

  const confirmResubmit = async () => {
    try {
      const data = await resubmitPaper(paperId)
      const nextStatus = data?.status ?? data?.data?.status
      setDetail((d) => ({
        ...d,
        paper: d.paper ? { ...d.paper, status: nextStatus ?? d.paper.status } : d.paper,
      }))
      toast('Paper resubmitted for review.')
    } catch {
      toast('Could not resubmit the paper.', 'error')
    } finally {
      setResubmitting(false)
    }
  }

  const resolveNote = async (noteId) => {
    try {
      await resolveFeedbackNote(paper.id, noteId)
      setDetail((d) => ({
        ...d,
        paper: {
          ...d.paper,
          notes: d.paper.notes.map((n) => (n.id === noteId ? { ...n, resolved: true } : n)),
        },
      }))
    } catch {
      toast('Could not update the feedback note.', 'error')
    }
  }

  const dismissNote = async (noteId) => {
    try {
      await dismissFeedbackNote(paper.id, noteId)
      setDetail((d) => ({
        ...d,
        paper: { ...d.paper, notes: d.paper.notes.filter((n) => n.id !== noteId) },
      }))
      toast('Feedback note dismissed.')
    } catch {
      toast('Could not dismiss the feedback note.', 'error')
    }
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

  if (detail.error || !paper) {
    return (
      <div className="space-y-4 font-display">
        <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
          ‹ My Papers
        </Link>
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="m-0 text-sm text-rose-200">{detail.error || 'Paper not found.'}</p>
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
  const videoLink = parseVideoLink(paper.videoUrl)

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
                    <li key={k} className="max-w-full min-w-0 truncate rounded-full border border-gold/60 px-3 py-1 text-xs text-[#FFD27F]">
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
                <SectionHeading icon={ExternalLinkIcon} title="Presentation video" />
              </div>
              <div className={`${glass} p-4 sm:p-6`}>
                {videoLink ? (
                  <VideoEmbed link={videoLink} />
                ) : (
                  <a
                    href={paper.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline"
                  >
                    Open video link
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}
              </div>
            </section>
          )}

          {paper.file && (
            <section aria-labelledby="file-heading">
              <div id="file-heading">
                <SectionHeading icon={ExternalLinkIcon} title="Paper file" />
              </div>
              <div className={`${glass} p-4 sm:p-6`}>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="truncate text-sm">{paper.file.fileName}</span>
                  <a
                    href={getFileDownloadUrl(paper.file.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-semibold text-gold hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            </section>
          )}

          {paper.notes?.length > 0 && (
            <FeedbackNotes notes={paper.notes} onDismiss={dismissNote} onResolve={resolveNote} />
          )}

          {!backendSupport.statusHistory && !paper.statusHistory?.length ? (
            <p className="text-sm text-white/50">{unsupportedNote.statusHistory}</p>
          ) : (
            <StatusHistory history={paper.statusHistory} />
          )}

          <ForumSection paper={paper} />
        </div>

        <aside className="min-w-0 space-y-8">
          <ConsentCard paper={paper} onChange={changeConsent} />

          <div className={`${glass} p-4 sm:p-6`}>
            <h3 className="mb-3 text-sm font-bold">
              Details
              {locked && <span className="ml-2 text-xs font-normal text-white/50">Read-only</span>}
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-white/50">Group</dt><dd className="min-w-0 text-right">{paper.groupName || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Strand</dt><dd className="min-w-0 text-right">{paper.strand || paper.program || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Section</dt><dd className="min-w-0 text-right">{paper.section || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">School year</dt><dd className="min-w-0 text-right">{paper.schoolYear || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Status</dt><dd className="min-w-0 text-right capitalize">{String(paper.status || '').replace(/_/g, ' ')}</dd></div>
            </dl>
          </div>
          <div className={`${glass} p-4 sm:p-6`}>
            <h3 className="mb-3 text-sm font-bold">Authors</h3>
            <ul className="min-w-0 space-y-1 text-sm">
              {(paper.authors || []).map((a, i) => (
                <li key={i} className="wrap-break-word">{a}</li>
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
