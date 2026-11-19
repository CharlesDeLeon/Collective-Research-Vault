import React, { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import { DocIcon, CheckIcon, CloseIcon } from '../../components/dashboard/icons'
import StatusPill from '../../components/dashboard/StatusPill'
import { normalizeStatus } from '../../utils/paperRules'
import { getFileDownloadUrl } from '../../utils/helpers'

const STAGE_LABELS = { proposal: 'Proposal', defense: 'Defense', final_submission: 'Final Submission' }
const STATUS_COLORS = {
  submitted: 'bg-sky-500/20 text-sky-300',
  under_review: 'bg-violet-500/20 text-violet-300',
  needs_revision: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-rose-500/20 text-rose-300',
  published: 'bg-emerald-500/20 text-emerald-300',
}

export default function AdviserReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newStage, setNewStage] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [abstractEdit, setAbstractEdit] = useState('')
  const [editingAbstract, setEditingAbstract] = useState(false)
  const [consent, setConsent] = useState(false)
  const [citation, setCitation] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)

  const fetchPaper = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/coordinator/submissions/${id}`)
      const d = res.data.data
      setPaper(d)
      setNewStage(d.stage)
      setNewStatus(d.status)
      setAbstractEdit(d.abstract || '')
      setConsent(!!d.author_consent_at)
      setCitation(d.citation || '')
      // fetch comments
      const cRes = await api.get(`/faculty/submissions/${id}/comments`).catch(() => ({ data: [] }))
      setComments(Array.isArray(cRes.data?.data) ? cRes.data.data : Array.isArray(cRes.data) ? cRes.data : [])
    } catch (e) {
      setError('Failed to load submission')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPaper() }, [fetchPaper])

  const handleUpdateStatus = async () => {
    if (!paper) return
    setUpdating(true)
    setUpdateError(null)
    try {
      if (newStage !== paper.stage) {
        await api.patch(`/coordinator/submissions/${paper.submission_id}/stage`, { stage: newStage })
      }
      if (newStatus !== paper.status) {
        await api.patch(`/coordinator/submissions/${paper.submission_id}/status`, { status: newStatus })
      }
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveAbstract = async () => {
    try {
      await api.patch(`/papers/${paper.submission_id}`, { abstract: abstractEdit })
      setEditingAbstract(false)
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to save abstract')
    }
  }

  const handleConsent = async (granted) => {
    try {
      await api.post(`/coordinator/submissions/${paper.submission_id}/consent`, { granted })
      setConsent(granted)
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to update consent')
    }
  }

  const handleUploadFile = async () => {
    if (!file) return
    setUploading(true)
    setUpdateError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      await api.post(`/coordinator/submissions/${paper.submission_id}/files`, body)
      setFile(null)
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setPublishError(null)
    try {
      await api.post(`/coordinator/submissions/${paper.submission_id}/publish`, {
        citation: citation || null,
        consentGranted: consent,
      })
      setShowPublishModal(false)
      fetchPaper()
    } catch (e) {
      setPublishError(e.response?.data?.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this paper from the gallery?')) return
    try {
      await api.post(`/coordinator/submissions/${paper.submission_id}/unpublish`, { reason: 'Adviser unpublish' })
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to unpublish')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true)
    try {
      await api.post(`/faculty/submissions/${paper.submission_id}/comment`, { comment_text: commentText.trim() })
      setCommentText('')
      fetchPaper()
    } catch (e) {
      setUpdateError(e.response?.data?.message || 'Failed to add comment')
    } finally {
      setCommenting(false)
    }
  }

  const files = paper?.versions ?? paper?.files ?? []

  const checklist = paper ? [
    { label: 'Status is Approved', ok: paper.status === 'approved' || paper.status === 'published' },
    { label: 'At least one file uploaded', ok: files.length > 0 },
    { label: 'Author consent granted', ok: consent },
  ] : []

  const canPublish = checklist.every((c) => c.ok)

  if (loading) {
    return <div className="p-8 text-center text-sm text-white/60">Loading…</div>
  }
  if (error || !paper) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/adviser/submissions')} className="text-sm text-white/60 hover:text-white">
          ‹ Back to submissions
        </button>
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="m-0 text-sm text-rose-200">{error || 'Submission not found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <button type="button" onClick={() => navigate('/adviser/submissions')} className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white">
        ‹ Back to submissions
      </button>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{paper.title}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[paper.status] || 'bg-white/10 text-white/60'}`}>
            {String(paper.status).replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-sm text-white/60 mt-1">{paper.group_name} · {paper.program} · {paper.school_year}</p>
      </header>

      {updateError && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {updateError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: content */}
        <div className="space-y-6">
          <div className={`${glass} p-5 sm:p-6`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Abstract</h2>
              {!editingAbstract ? (
                <button type="button" onClick={() => setEditingAbstract(true)} className="text-xs font-semibold text-gold hover:underline">
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingAbstract(false)} className="text-xs text-white/60 hover:text-white">Cancel</button>
                  <button type="button" onClick={handleSaveAbstract} className="text-xs font-semibold text-gold hover:underline">Save</button>
                </div>
              )}
            </div>
            {editingAbstract ? (
              <textarea
                value={abstractEdit}
                onChange={(e) => setAbstractEdit(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
              />
            ) : (
              <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-white/90">
                {paper.abstract || 'No abstract provided.'}
              </p>
            )}
            {paper.keywords && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {(Array.isArray(paper.keywords) ? paper.keywords : String(paper.keywords).split(/[,;]/)).map((k, i) => (
                  <span key={i} className="rounded-full border border-gold/60 px-3 py-1 text-xs text-[#FFD27F]">
                    {k.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 text-lg font-bold">Metadata</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-white/50">Authors</dt><dd className="text-right">{paper.authors || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Program</dt><dd className="text-right">{paper.program || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">School year</dt><dd className="text-right">{paper.school_year || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Stage</dt><dd className="text-right">{STAGE_LABELS[paper.stage] || paper.stage}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-white/50">Submitted by</dt><dd className="text-right">{paper.submitted_by_name || '—'}</dd></div>
            </dl>
          </div>

          {/* Comments */}
          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 text-lg font-bold">Feedback comments</h2>
            <ul className="space-y-3">
              {(paper.comments || []).map((c) => (
                <li key={c.comment_id || c.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{c.author_name || c.authorName}</span>
                    <span className="text-[0.65rem] text-white/40">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
                  </div>
                  <p className="mb-0 mt-1 text-sm text-white/80">{c.comment_text || c.text}</p>
                </li>
              ))}
              {!paper.comments?.length && (
                <li className="text-sm text-white/50">No comments yet.</li>
              )}
            </ul>
            <form onSubmit={handleComment} className="mt-4 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add feedback…"
                className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
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
        </div>

        {/* Right: adviser actions */}
        <aside className="min-w-0 space-y-6">
          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 text-lg font-bold">Adviser actions</h2>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Stage</span>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                >
                  <option value="proposal">Proposal</option>
                  <option value="defense">Defense</option>
                  <option value="final_submission">Final Submission</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Status</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating || (newStage === paper.stage && newStatus === paper.status)}
                className="h-11 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {updating ? 'Updating…' : 'Update stage & status'}
              </button>
            </div>
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 text-lg font-bold">Files</h2>
            <ul className="space-y-2">
              {(paper.versions || paper.files || []).map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="truncate">{v.file_name || v.fileName}</span>
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
              {!(paper.versions || paper.files)?.length && (
                <li className="text-sm text-white/50">No files uploaded yet.</li>
              )}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                type="file"
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
            {file && <p className="mb-0 mt-1 text-xs text-white/60">Selected: {file.name}</p>}
          </div>

          <div className={`${glass} p-5 sm:p-6`}>
            <h2 className="mb-3 text-lg font-bold">Publish to gallery</h2>
            <ul className="space-y-2 text-sm">
              {checklist.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={c.ok ? 'text-emerald-300' : 'text-white/30'}>{c.ok ? '✓' : '○'}</span>
                  <span className={c.ok ? 'text-white/80' : 'text-white/50'}>{c.label}</span>
                </li>
              ))}
            </ul>

            <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => handleConsent(e.target.checked)}
                className="size-4 accent-gold"
              />
              Author consent granted
            </label>

            <label className="mt-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-white/70">Citation (APA 7, optional)</span>
              <textarea
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                rows={2}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-gold/50"
                placeholder="Auto-generated if left empty"
              />
            </label>

            {publishError && (
              <p className="mt-2 text-xs text-rose-200">{publishError}</p>
            )}

            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              disabled={!canPublish || paper.status === 'published'}
              className="mt-3 h-11 w-full rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
            >
              {paper.status === 'published' ? 'Published' : 'Publish to Gallery'}
            </button>
            {paper.status === 'published' && (
              <button
                type="button"
                onClick={handleUnpublish}
                className="mt-2 h-10 w-full rounded-xl border border-white/15 text-xs font-semibold text-white/60 transition hover:text-white"
              >
                Unpublish
              </button>
            )}
          </div>
        </aside>
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`${glass} w-full max-w-md p-6`}>
            <h2 className="mb-4 text-xl font-bold">Publish to gallery?</h2>
            <p className="text-sm text-white/70">
              This will make <span className="font-medium text-white">{paper.title}</span> visible in the public gallery
              with its title, abstract, and citation. The full paper stays behind the access-request flow.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="h-10 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="h-10 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {publishing ? 'Publishing…' : 'Confirm publish'}
              </button>
            </div>
            {publishError && (
              <p className="mt-3 text-xs text-rose-200">{publishError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}