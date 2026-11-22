import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import { glass, ROUTES } from '../../components/dashboard/constants'
import { ChevronDownIcon } from '../../components/dashboard/icons'
import Field, { inputCls } from '../../components/upload/Field'
import { getMyGroups as fetchMyGroups, uploadPaper, uploadPaperVersion } from '../../services/uploadService'
import { getPaperDetail, updatePaper } from '../../services/paperService'
import { splitList } from '../../utils/paperRules'

const TITLE_MAX = 300
const ABSTRACT_MIN = 50
const ABSTRACT_MAX = 2000
const KEYWORDS_MAX = 8
const URL_PATTERN = /^https?:\/\/\S+$/i

const border = (error) => (error ? 'border-danger' : 'border-white/15')

function GroupSummary({ group }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="m-0 text-base font-semibold">{group.name}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[group.strand, group.section, group.schoolYear].map((v) => (
          <span key={v} className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
            {v}
          </span>
        ))}
      </div>
      <p className="mb-0 mt-2 text-xs text-white/60">Adviser: {group.adviser}</p>
    </div>
  )
}

function PaperFormBody({ groups, paper }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const editing = Boolean(paper)
  const [groupId, setGroupId] = useState(() => {
    if (paper?._groupName) {
      const g = groups.find((x) => x.name === paper._groupName)
      if (g) return g.id
    }
    if (paper?.groupId) return paper.groupId
    return groups.length === 1 ? groups[0].id : ''
  })
  const [title, setTitle] = useState(paper?.title ?? '')
  const [authors, setAuthors] = useState(paper ? paper.authors.join(', ') : (user?.name ?? ''))
  const [abstract, setAbstract] = useState(paper?.abstract ?? '')
  const [keywords, setKeywords] = useState(paper ? paper.keywords.join(', ') : '')

  const [file, setFile] = useState(null)
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const group = groups.find((g) => String(g.id) === String(groupId))
  const keywordList = splitList(keywords)
  const authorList = splitList(authors)

  const errors = {
    group: groupId ? '' : 'Select your research group.',
    title: title.trim() ? '' : 'Research title is required.',
    authors: authorList.length ? '' : 'List at least one author.',
    abstract: abstract.trim().length >= ABSTRACT_MIN ? '' : `Write at least ${ABSTRACT_MIN} characters.`,
    keywords:
      keywordList.length === 0
        ? 'Add at least one keyword.'
        : keywordList.length > KEYWORDS_MAX
          ? `Use up to ${KEYWORDS_MAX} keywords.`
          : '',
    file: !editing && !file ? 'A file is required for new submissions.' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (key) => (showErrors ? errors[key] : '')

  const submit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (hasErrors) {
      setShowErrors(true)
      return
    }
    if (!editing && !file) {
      setSubmitError('A file (PDF/DOC/DOCX) is required for a new submission.')
      setShowErrors(true)
      return
    }
    setSubmitting(true)
    const group = groups.find((g) => String(g.id) === String(groupId))
    const year = group?.schoolYear ? group.schoolYear.split('-')[0] : ''
    try {
      if (editing) {
        if (file) {
          await uploadPaperVersion({ paperId: paper.id, file })
        }
        await updatePaper(paper.id, {
          title: title.trim(),
          authors: authorList,
          abstract: abstract.trim(),
          keywords: keywordList,
          program: group?.strand || group?.program,
          schoolYear: group?.schoolYear,
        })
      } else {
        await uploadPaper({
          title: title.trim(),
          authors: authorList.join(', '),
          program: group?.strand || group?.program || '',
          year,
          schoolYear: group?.schoolYear || '',
          abstract: abstract.trim(),
          keywords: keywordList.join(', '),
          groupId,
          file,
        })
      }
      navigate(ROUTES.myPapers, { state: { notice: editing ? 'Changes saved.' : 'Proposal submitted.' } })
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Could not save your paper. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className={`${glass} mt-6 max-w-3xl p-5 sm:p-8`}>
      <div className="grid gap-6">
        {groups.length === 0 ? (
          <p className="m-0 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn-ink">
            You are not part of a research group yet. Ask your adviser to add you before submitting a paper.
          </p>
        ) : groups.length === 1 ? (
          <GroupSummary group={groups[0]} />
        ) : (
          <>
            <Field label="Research Group" error={show('group')}>
              <span className="relative block">
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  disabled={editing}
                  className={`${inputCls} appearance-none bg-navy-900/60 pr-11 ${border(show('group'))}`}
                >
                  <option value="" className="bg-navy-900">
                    Select group
                  </option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-navy-900">
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/70" />
              </span>
            </Field>
            {group && <GroupSummary group={group} />}
          </>
        )}

        <Field label="Research Title" error={show('title')}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="E.g. Impact of AI on Education"
            className={`${inputCls} ${border(show('title'))}`}
          />
        </Field>

        <Field label="Author(s)" error={show('authors')}>
          <input
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Separate names with commas"
            className={`${inputCls} ${border(show('authors'))}`}
          />
        </Field>

        <Field label="Abstract" error={show('abstract')}>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            maxLength={ABSTRACT_MAX}
            rows={7}
            placeholder="Summarize what you studied, how, and what you found or expect to find."
            className={`${inputCls} h-auto min-h-40 resize-y py-3 leading-relaxed ${border(show('abstract'))}`}
          />
          <span className="mt-1 block text-right text-xs text-white/50">
            {abstract.length}/{ABSTRACT_MAX}
          </span>
        </Field>

        <div>
          <Field label="Keywords" error={show('keywords')}>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="E.g. machine learning, education, AI"
              className={`${inputCls} ${border(show('keywords'))}`}
            />
          </Field>
          {keywordList.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {keywordList.map((k) => (
                <li key={k} className="rounded-full border border-gold/60 px-3 py-1 text-xs text-[#FFD27F]">
                  {k}
                </li>
              ))}
            </ul>
          )}
          <p className="mb-0 mt-2 text-xs text-white/50">Separate keywords with commas. Up to {KEYWORDS_MAX}.</p>
        </div>

        <div>
          <Field label={editing ? 'Replace file (optional)' : 'Paper file (PDF/DOC/DOCX)'} error={show('file')}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${inputCls} ${border(show('file'))}`}
            />
          </Field>
          <p className="mb-0 mt-2 text-xs text-white/50">
            {editing ? 'Leave empty to keep the existing file.' : 'Required for new submissions (max 20 MB).'}
          </p>
          {file && (
            <p className="mb-0 mt-1 text-xs text-white/70">Selected: {file.name}</p>
          )}
        </div>

      </div>

      {submitError && (
        <p role="alert" className="mb-0 mt-6 text-sm text-danger-ink">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          to={ROUTES.myPapers}
          className="grid h-12 place-items-center rounded-xl border border-white/25 px-6 text-base font-medium text-white/85 hover:bg-white/10"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting || groups.length === 0}
          className="h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-8 text-base font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Submit proposal'}
        </button>
      </div>
    </form>
  )
}

export default function UploadForm() {
  const { paperId } = useParams()
  const [state, setState] = useState({ key: '', groups: [], paper: null, error: false })
  const key = paperId ?? 'new'

  useEffect(() => {
    let live = true
    const groupsPromise = fetchMyGroups().then((rows) =>
      (rows || []).map((g) => ({
        id: g.group_id,
        name: g.group_name,
        strand: g.program || g.strand || '',
        section: g.section || '',
        schoolYear: g.school_year || '',
        adviser: '',
      }))
    )
    const paperPromise = paperId
      ? getPaperDetail(paperId).then((p) => ({
          id: p.id,
          title: p.title,
          authors: p.authors || [],
          abstract: p.abstract || '',
          keywords: p.keywords || [],
          groupId: null,
          _groupName: p.groupName,
          status: p.status,
          groupName: p.groupName,
          program: p.program,
          schoolYear: p.schoolYear,
        }))
      : Promise.resolve(null)
    Promise.all([groupsPromise, paperPromise])
      .then(([groups, paper]) => {
        if (live) setState({ key, groups, paper, error: false })
      })
      .catch(() => {
        if (live) setState({ key, groups: [], paper: null, error: true })
      })
    return () => {
      live = false
    }
  }, [key, paperId])

  const ready = state.key === key
  const blocked = ready && paperId && (!state.paper || !canEdit(state.paper.status))

  return (
    <div className="font-display">
      <Link to={ROUTES.myPapers} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/80">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        My Papers
      </Link>
      <h1 className="mb-0 mt-2 text-3xl font-bold">{paperId ? 'Edit Paper' : 'New Paper'}</h1>

      {!ready ? (
        <div className="mt-6 h-96 max-w-3xl animate-pulse rounded-2xl bg-white/[0.07]" />
      ) : state.error ? (
        <p role="alert" className="mt-6 text-sm text-danger-ink">Could not load the form. Refresh the page to try again.</p>
      ) : blocked ? (
        <div className={`${glass} mt-6 max-w-3xl p-6`}>
          <p className="m-0 text-lg font-semibold">
            {state.paper ? 'This paper can’t be edited' : 'Paper not found'}
          </p>
          <p className="mb-0 mt-2 text-sm text-white/70">
            {state.paper
              ? 'You can edit a paper only while it is a Proposal or marked For Revision.'
              : 'It may have been removed.'}
          </p>
          <Link
            to={ROUTES.myPapers}
            className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-7 text-base font-semibold text-ink"
          >
            Back to My Papers
          </Link>
        </div>
      ) : (
        <PaperFormBody key={key} groups={state.groups} paper={state.paper} />
      )}
    </div>
  )
}