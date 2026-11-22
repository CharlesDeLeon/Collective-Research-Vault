import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getSubmission,
  setSubmissionStage,
  setSubmissionStatus,
  addFeedbackComment,
  uploadSubmissionFile,
  publishSubmission,
  unpublishSubmission,
} from '../../services/adviserService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import useToast from '../../context/useToast'
import { glass } from '../../components/dashboard/constants'
import { CheckIcon, DocIcon, AlertIcon } from '../../components/dashboard/icons'
import StatusPill from '../../components/dashboard/StatusPill'
import ModalShell from '../../components/ui/ModalShell'
import Select, { Option } from '../../components/ui/Select'
import { getFileDownloadUrl } from '../../utils/helpers'
import { submissionCitation } from '../../utils/submissionCitation'
import { copyText } from '../../utils/clipboard'
import { fullDate, timeAgo } from '../../utils/formatDate'

const STAGE_LABELS = { proposal: 'Proposal', defense: 'Defense', final_submission: 'Final Submission' }

const STATUS_CHOICES = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'needs_revision', label: 'For Revision' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const fieldCls =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50'

const goldBtn =
  'h-11 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60'

function Note({ children }) {
  return <p className="m-0 text-xs text-white/60">{children}</p>
}

function UnpublishModal({ title, busy, error, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const ready = reason.trim().length > 0
  return (
    <ModalShell title="Unpublish paper" icon={AlertIcon} onClose={onClose}>
      <p className="mt-4 px-1 text-sm leading-relaxed text-white/75">
        <span className="font-medium text-white">{title}</span> will be removed from the public gallery. Tell the group
        why, so they know what to fix.
      </p>
      <label className="mt-4 block px-1">
        <span className="text-xs font-semibold text-white/70">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className={`${fieldCls} mt-1 py-3`}
          placeholder="Why is this paper being unpublished?"
        />
      </label>
      {error && (
        <p role="alert" className="mb-0 mt-3 px-1 text-xs text-danger-ink">
          {error}
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => onConfirm(reason.trim())}
          className="h-11 rounded-xl border border-danger bg-danger/20 text-sm font-semibold text-danger-ink transition enabled:hover:bg-danger/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Unpublishing…' : 'Unpublish'}
        </button>
      </div>
    </ModalShell>
  )
}

function PublishModal({ paper, citation, consentAt, busy, error, onConfirm, onClose }) {
  return (
    <ModalShell title="Publish to gallery" icon={DocIcon} onClose={onClose}>
      <p className="mt-4 px-1 text-sm leading-relaxed text-white/75">
        This is what the public will see. The full paper stays behind the access-request flow.
      </p>
      <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="m-0 text-base font-semibold leading-snug">{paper.title}</p>
        <p className="m-0 line-clamp-4 text-sm text-white/70">{paper.abstract || 'No abstract provided.'}</p>
        <p className="m-0 text-xs text-white/60">
          {[paper.authors, paper.strand || paper.program, paper.school_year].filter(Boolean).join(' · ')}
        </p>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-white/50">Citation (APA 7)</p>
          <p className="m-0 mt-1 text-sm text-white/80">{citation}</p>
        </div>
        <p className="m-0 text-xs text-white/60">
          Author consent recorded {consentAt ? fullDate(consentAt) : 'now, when you confirm'}.
        </p>
      </div>
      {error && (
        <p role="alert" className="mb-0 mt-3 px-1 text-xs text-danger-ink">
          {error}
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-white/20 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? 'Publishing…' : 'Confirm publish'}
        </button>
      </div>
    </ModalShell>
  )
}

export default function AdviserReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newStage, setNewStage] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [citation, setCitation] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState(null)
  const [showPublish, setShowPublish] = useState(false)
  const [showUnpublish, setShowUnpublish] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [unpublishError, setUnpublishError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)

  const fetchPaper = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await getSubmission(id)
      setPaper(d)
      setNewStage(d.stage)
      setNewStatus(d.status === 'published' ? 'approved' : d.status === 'submitted' ? 'under_review' : d.status)
      setConsentConfirmed(!!d.author_consent_at)
      setCitation(d.citation || '')
    } catch (e) {
      console.error(e)
      setError('Failed to load this paper.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPaper() }, [fetchPaper])

  const files = paper?.versions ?? paper?.files ?? []
  const consentAt = paper?.author_consent_at ?? null
  const isPublished = paper?.status === 'published'
  const generatedCitation = paper ? submissionCitation(paper) : ''
  const finalCitation = citation.trim() || generatedCitation

  const consentOk = consentAt ? true : consentConfirmed
  const checklist = paper
    ? [
        { label: 'Status is Approved', ok: paper.status === 'approved' || isPublished },
        { label: 'At least one paper file uploaded', ok: files.length > 0 },
        { label: 'Citation ready', ok: Boolean(finalCitation) },
        { label: 'Author consent granted', ok: consentOk },
      ]
    : []
  const blockers = checklist.filter((c) => !c.ok).map((c) => c.label)
  const canPublish = blockers.length === 0 && !isPublished

  const currentStatus = paper ? (paper.status === 'submitted' ? 'under_review' : paper.status === 'published' ? 'approved' : paper.status) : ''
  const statusChanged = paper && (newStage !== paper.stage || newStatus !== currentStatus)

  const handleUpdateStatus = async () => {
    if (!paper) return
    setUpdating(true)
    setUpdateError(null)
    try {
      if (newStage !== paper.stage) await setSubmissionStage(paper.submission_id, newStage)
      if (newStatus !== currentStatus) await setSubmissionStatus(paper.submission_id, newStatus)
      toast('Status updated.')
      setStatusNote('')
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to update the status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleUploadFile = async () => {
    if (!file) return
    setUploading(true)
    setUpdateError(null)
    try {
      await uploadSubmissionFile(paper.submission_id, file)
      setFile(null)
      toast('File uploaded.')
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to upload the file.')
    } finally {
      setUploading(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setPublishError(null)
    try {
      await publishSubmission(paper.submission_id, { citation: finalCitation, consentGranted: consentOk })
      setShowPublish(false)
      toast('Published to the gallery.')
      fetchPaper()
    } catch (e) {
      setPublishError(e.response?.data?.message || 'Failed to publish.')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async (reason) => {
    setUnpublishing(true)
    setUnpublishError(null)
    try {
      await unpublishSubmission(paper.submission_id, reason)
      setShowUnpublish(false)
      toast('Removed from the gallery.')
      fetchPaper()
    } catch (e) {
      setUnpublishError(e.response?.data?.message || 'Failed to unpublish.')
    } finally {
      setUnpublishing(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true)
    try {
      await addFeedbackComment(paper.submission_id, commentText.trim())
      setCommentText('')
      fetchPaper()
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to add the comment.')
    } finally {
      setCommenting(false)
    }
  }

  const copyCitation = async () => {
    const ok = await copyText(finalCitation)
    toast(ok ? 'Citation copied.' : 'Could not copy the citation.', ok ? 'success' : 'error')
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-white/60">Loading…</div>
  }
  if (error || !paper) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/adviser/reviews')} className="text-sm text-white/60 hover:text-white">
          ‹ Back to reviews
        </button>
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="m-0 text-sm text-rose-200">{error || 'Submission not found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-white/60">
        <button type="button" onClick={() => navigate('/adviser/reviews')} className="hover:text-white">
          Reviews
        </button>
        <span aria-hidden="true">›</span>
        <span className="min-w-0 truncate text-white/80">{paper.title}</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 min-w-0 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">{paper.title}</h1>
          <StatusPill status={paper.status} />
        </div>
        <p className="mb-0 mt-1 text-sm text-white/60">
          {[paper.submitted_by_name, paper.group_name, paper.program, paper.school_year].filter(Boolean).join(' · ')}
          {paper.updated_at && ` · Updated ${timeAgo(paper.updated_at)}`}
        </p>
      </header>

      {updateError && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {updateError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 mt-0 text-lg font-bold">Abstract</h2>
            <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-white/90">
              {paper.abstract || 'No abstract provided.'}
            </p>
            {!backendSupport.adviserAbstractEdit && <p className="mb-0 mt-3 text-xs text-white/50">{unsupportedNote.adviserAbstractEdit}</p>}
            {paper.keywords && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {(Array.isArray(paper.keywords) ? paper.keywords : String(paper.keywords).split(/[,;]/)).map((k, i) => (
                  <span key={i} className="rounded-full border border-gold/60 px-3 py-1 text-xs text-gold-light">
                    {k.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 mt-0 text-lg font-bold">Details</h2>
            <dl className="m-0 space-y-2 text-sm">
              {[
                ['Authors', paper.authors],
                ['Group', paper.group_name],
                ['Program', paper.program],
                ['School year', paper.school_year],
                ['Stage', STAGE_LABELS[paper.stage] || paper.stage],
                ['Submitted by', paper.submitted_by_name],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-white/50">{k}</dt>
                  <dd className="m-0 min-w-0 wrap-break-word text-right">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 mt-0 text-lg font-bold">Discussion</h2>
            <ul className="m-0 list-none space-y-3 p-0">
              {(paper.comments || []).map((c) => (
                <li key={c.comment_id || c.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{c.author_name || c.authorName}</span>
                    <span className="text-[0.6875rem] text-white/50">{c.created_at ? timeAgo(c.created_at) : ''}</span>
                  </div>
                  <p className="mb-0 mt-1 text-sm text-white/80">{c.comment_text || c.text}</p>
                </li>
              ))}
              {!paper.comments?.length && <li className="text-sm text-white/50">No comments yet.</li>}
            </ul>
            <form onSubmit={handleComment} className="mt-4 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add feedback…"
                aria-label="Add feedback"
                className={`${fieldCls} h-11 flex-1`}
              />
              <button
                type="submit"
                disabled={commenting || !commentText.trim()}
                className="h-11 rounded-xl bg-gold/20 px-4 text-sm font-semibold text-gold transition hover:bg-gold/30 disabled:opacity-60"
              >
                {commenting ? '…' : 'Send'}
              </button>
            </form>
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 mt-0 text-lg font-bold">Status history</h2>
            {!backendSupport.statusHistory ? (
              <Note>{unsupportedNote.statusHistory}</Note>
            ) : null}
          </div>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className={`${glass} space-y-3 p-5 sm:p-6`}>
            <h2 className="m-0 text-lg font-bold">Review</h2>
            <label className="block">
              <span className="text-xs font-semibold text-white/70">Stage</span>
              <Select value={newStage} onChange={(e) => setNewStage(e.target.value)} className="border-white/15">
                <Option value="proposal">Proposal</Option>
                <Option value="defense">Defense</Option>
                <Option value="final_submission">Final Submission</Option>
              </Select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-white/70">Status</span>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={isPublished}
                className="border-white/15 disabled:opacity-50"
              >
                {STATUS_CHOICES.map((c) => (
                  <Option key={c.value} value={c.value}>{c.label}</Option>
                ))}
              </Select>
            </label>
            {isPublished && <Note>Unpublish this paper before changing its status.</Note>}
            <label className="block">
              <span className="text-xs font-semibold text-white/70">Note for the group</span>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
                disabled={!backendSupport.statusNote}
                placeholder="Optional note with this status change"
                className={`${fieldCls} mt-1 py-3`}
              />
            </label>
            {!backendSupport.statusNote && <Note>{unsupportedNote.statusNote}</Note>}
            <button type="button" onClick={handleUpdateStatus} disabled={updating || !statusChanged || isPublished} className={goldBtn}>
              {updating ? 'Updating…' : 'Update stage & status'}
            </button>
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 mt-0 text-lg font-bold">Paper files</h2>
            <ul className="m-0 list-none space-y-2 p-0">
              {files.map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{v.file_name || v.fileName}</span>
                  {(v.file_name || v.fileName) && (
                    <a
                      href={getFileDownloadUrl(v.file_path || v.filePath || v.file_name)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-semibold text-gold hover:underline"
                    >
                      Download
                    </a>
                  )}
                </li>
              ))}
              {!files.length && <li className="text-sm text-white/50">No files uploaded yet.</li>}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                aria-label="Choose a paper file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleUploadFile}
                disabled={!file || uploading}
                className="shrink-0 rounded-lg bg-gold/20 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/30 disabled:opacity-60"
              >
                {uploading ? '…' : 'Upload'}
              </button>
            </div>
            {!backendSupport.finalAndDefendedFiles && <p className="mb-0 mt-2 text-xs text-white/50">{unsupportedNote.finalAndDefendedFiles}</p>}
          </div>

          <div className={`${glass} space-y-3 p-5 sm:p-6`}>
            <h2 className="m-0 text-lg font-bold">Publish to gallery</h2>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-white/70">Author consent</span>
              <span
                className={`rounded-full border px-3 py-1 text-[0.625rem] font-bold uppercase tracking-wider ${
                  consentAt
                    ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                    : 'border-amber-400/30 bg-amber-500/20 text-amber-300'
                }`}
              >
                {consentAt ? `Granted ${fullDate(consentAt)}` : 'Pending'}
              </span>
            </div>

            {!consentAt && !backendSupport.studentConsent && (
              <>
                <label className="flex items-start gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    disabled={isPublished}
                    className="mt-0.5 size-4 shrink-0 accent-gold"
                  />
                  <span>I confirm the authors agreed to public release of the title, abstract and citation.</span>
                </label>
                <Note>{unsupportedNote.studentConsent}</Note>
              </>
            )}
            {!backendSupport.requestConsent && (
              <button
                type="button"
                disabled
                className="h-10 w-full cursor-not-allowed rounded-xl border border-white/15 text-xs font-semibold text-white/50"
              >
                Request consent from the author
              </button>
            )}

            <ul className="m-0 list-none space-y-2 p-0 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.ok ? <CheckIcon className="size-4 text-emerald-300" /> : <span className="grid size-4 place-items-center text-white/30">○</span>}
                  <span className={c.ok ? 'text-white/80' : 'text-white/50'}>{c.label}</span>
                </li>
              ))}
            </ul>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white/70">Citation (APA 7)</span>
              <textarea
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                rows={3}
                disabled={isPublished}
                className={`${fieldCls} py-3 text-xs`}
                placeholder={generatedCitation}
              />
            </label>
            <div className="flex items-start justify-between gap-3">
              <p className="m-0 min-w-0 wrap-break-word text-xs text-white/60">
                {citation.trim() ? 'Using your citation.' : 'Using the generated citation above if you leave this empty.'}
              </p>
              <button type="button" onClick={copyCitation} className="shrink-0 text-xs font-semibold text-gold hover:underline">
                Copy
              </button>
            </div>

            {!canPublish && !isPublished && blockers.length > 0 && (
              <Note>Publishing is blocked until: {blockers.join(', ').toLowerCase()}.</Note>
            )}
            {publishError && !showPublish && <p className="m-0 text-xs text-danger-ink">{publishError}</p>}

            <button type="button" onClick={() => { setPublishError(null); setShowPublish(true) }} disabled={!canPublish} className={goldBtn}>
              {isPublished ? 'Published' : 'Publish to Gallery'}
            </button>
            {isPublished && (
              <button
                type="button"
                onClick={() => { setUnpublishError(null); setShowUnpublish(true) }}
                className="h-10 w-full rounded-xl border border-white/15 text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Unpublish
              </button>
            )}
          </div>
        </aside>
      </div>

      {showPublish && (
        <PublishModal
          paper={paper}
          citation={finalCitation}
          consentAt={consentAt}
          busy={publishing}
          error={publishError}
          onConfirm={handlePublish}
          onClose={() => setShowPublish(false)}
        />
      )}
      {showUnpublish && (
        <UnpublishModal
          title={paper.title}
          busy={unpublishing}
          error={unpublishError}
          onConfirm={handleUnpublish}
          onClose={() => setShowUnpublish(false)}
        />
      )}
    </div>
  )
}