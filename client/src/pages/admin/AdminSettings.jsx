import { useCallback, useEffect, useMemo, useState } from 'react'
import useToast from '../../context/useToast'
import { glass } from '../../components/dashboard/constants'
import { CloseIcon } from '../../components/dashboard/icons'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Field, { inputCls } from '../../components/upload/Field'
import { apiMessage, listAdminGroups } from '../../services/adminService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { STRANDS } from '../../utils/strands'

const YEAR_RE = /^(\d{4})-(\d{4})$/
const FILE_TYPES = ['PDF', 'DOC', 'DOCX']
const DEFAULTS = {
  institutionName: '',
  strands: STRANDS,
  sections: {},
  schoolYears: [],
  linkExpiryHours: '72',
  maxUploadMb: '20',
  fileTypes: ['PDF', 'DOCX'],
  maintenance: false,
}

const ghost = 'rounded-xl border border-white/25 px-4 text-sm font-medium text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'

function detect(groups) {
  const years = [...new Set(groups.map((g) => g.school_year).filter(Boolean))].sort()
  const sections = {}
  groups.forEach((g) => {
    const strand = g.strand || g.program
    if (!strand || !g.section) return
    sections[strand] = [...new Set([...(sections[strand] ?? []), g.section])].sort()
  })
  const strands = [...new Set([...STRANDS, ...Object.keys(sections)])]
  return {
    ...DEFAULTS,
    strands,
    schoolYears: years,
    sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join(', ')])),
  }
}

function Card({ title, hint, children }) {
  return (
    <section className={`${glass} p-4 sm:p-6`}>
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-white/55">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition ${checked ? 'border-gold bg-gold' : 'border-white/30 bg-white/10'}`}
    >
      <span className={`absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
    </button>
  )
}

function TagEditor({ items, onChange, label, placeholder, validate, error }) {
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    const message = validate?.(value, items)
    if (message) {
      setProblem(message)
      return
    }
    setProblem('')
    onChange([...items, value])
    setDraft('')
  }

  return (
    <div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.length === 0 && <li className="text-sm text-white/50">None yet.</li>}
        {items.map((item) => (
          <li key={item} className="inline-flex items-center gap-1 rounded-full border border-gold/60 py-1 pl-3 pr-1 text-sm text-[#FFD27F]">
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              aria-label={`Remove ${item}`}
              className="grid size-6 place-items-center rounded-full hover:bg-white/10"
            >
              <CloseIcon className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          aria-label={label}
          placeholder={placeholder}
          maxLength={30}
          className={`${inputCls} min-w-0 flex-1 border-white/20`}
        />
        <button type="button" onClick={add} className={`${ghost} h-11 shrink-0`}>
          Add
        </button>
      </div>
      {(problem || error) && (
        <p role="alert" className="mt-2 text-sm text-danger-ink">
          {problem || error}
        </p>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const { toast } = useToast()
  const [base, setBase] = useState(DEFAULTS)
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [logo, setLogo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const seeded = detect(await listAdminGroups())
      setBase(seeded)
      setForm(seeded)
    } catch (e) {
      setError(apiMessage(e, 'Could not read the existing groups, so strands and school years start from defaults.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!logo) return undefined
    return () => URL.revokeObjectURL(logo.url)
  }, [logo])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(base) || Boolean(logo), [form, base, logo])
  const patch = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const toggleType = (type) =>
    patch('fileTypes', form.fileTypes.includes(type) ? form.fileTypes.filter((t) => t !== type) : [...form.fileTypes, type])

  const pickLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setErrors((x) => ({ ...x, logo: 'Choose an image under 2 MB.' }))
      return
    }
    setErrors((x) => ({ ...x, logo: '' }))
    setLogo({ url: URL.createObjectURL(file), name: file.name })
  }

  const validate = () => {
    const errs = {}
    const hours = Number(form.linkExpiryHours)
    const mb = Number(form.maxUploadMb)
    if (!form.institutionName.trim()) errs.institutionName = 'Enter the institution name.'
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) errs.linkExpiryHours = 'Use a whole number from 1 to 720 hours.'
    if (!Number.isFinite(mb) || mb < 1 || mb > 100) errs.maxUploadMb = 'Use a number from 1 to 100 MB.'
    if (form.fileTypes.length === 0) errs.fileTypes = 'Allow at least one file type.'
    if (form.strands.length === 0) errs.strands = 'Add at least one strand.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const save = (e) => {
    e.preventDefault()
    if (!validate()) return
    toast('Settings saved.')
  }

  const cancel = () => {
    setForm(base)
    setLogo(null)
    setErrors({})
  }

  const canSave = backendSupport.adminSettings
  const yearCheck = (value, items) => {
    const m = YEAR_RE.exec(value)
    if (!m || Number(m[2]) !== Number(m[1]) + 1) return 'Use the format 2026-2027.'
    return items.includes(value) ? 'Already listed.' : ''
  }
  const strandCheck = (value, items) => (items.some((i) => i.toLowerCase() === value.toLowerCase()) ? 'Already listed.' : '')

  const invalid = (key) => ({
    'aria-invalid': Boolean(errors[key]),
    className: `${inputCls} ${errors[key] ? 'border-danger' : 'border-white/20'}`,
  })

  if (loading) {
    return (
      <div className="space-y-4 font-display" aria-busy="true">
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-panel" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={save} noValidate className="mx-auto max-w-4xl space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-white/60">Institution details, programs and limits.</p>
      </header>

      <ErrorBanner message={error} onRetry={load} />
      {!canSave && <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">{unsupportedNote.adminSettings}</p>}

      <Card title="Institution">
        <Field label="Institution name" error={errors.institutionName}>
          <input value={form.institutionName} onChange={(e) => patch('institutionName', e.target.value)} maxLength={120} {...invalid('institutionName')} />
        </Field>
        <Field label="Logo" error={errors.logo}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/5 text-xs text-white/40">
              {logo ? <img src={logo.url} alt="Selected logo preview" className="size-full object-contain" /> : 'No logo'}
            </span>
            <input type="file" accept="image/*" onChange={pickLogo} className="min-w-0 text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/25 file:bg-transparent file:px-3 file:py-2 file:text-sm file:text-white/90" />
          </div>
        </Field>
      </Card>

      <Card title="Strands and sections" hint="Used when creating groups and filtering reports.">
        <TagEditor items={form.strands} onChange={(v) => patch('strands', v)} label="Add a strand" placeholder="Add a strand" validate={strandCheck} error={errors.strands} />
        <div className="grid gap-4 sm:grid-cols-2">
          {form.strands.map((strand) => (
            <Field key={strand} label={`${strand} sections`}>
              <input
                value={form.sections[strand] ?? ''}
                onChange={(e) => patch('sections', { ...form.sections, [strand]: e.target.value })}
                placeholder="e.g. A, B, C"
                maxLength={120}
                className={`${inputCls} border-white/20`}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card title="School years" hint="Taken from existing groups. Add the next one before enrollment opens.">
        <TagEditor items={form.schoolYears} onChange={(v) => patch('schoolYears', v)} label="Add a school year" placeholder="2026-2027" validate={yearCheck} />
      </Card>

      <Card title="Access and uploads">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Access link expiry (hours)" error={errors.linkExpiryHours}>
            <input type="number" inputMode="numeric" min={1} max={720} value={form.linkExpiryHours} onChange={(e) => patch('linkExpiryHours', e.target.value)} {...invalid('linkExpiryHours')} />
          </Field>
          <Field label="Largest upload (MB)" error={errors.maxUploadMb}>
            <input type="number" inputMode="numeric" min={1} max={100} value={form.maxUploadMb} onChange={(e) => patch('maxUploadMb', e.target.value)} {...invalid('maxUploadMb')} />
          </Field>
        </div>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">Allowed file types</legend>
          <div className="flex flex-wrap gap-3">
            {FILE_TYPES.map((type) => (
              <label key={type} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/20 px-4 text-sm">
                <input type="checkbox" checked={form.fileTypes.includes(type)} onChange={() => toggleType(type)} className="size-4 accent-gold" />
                {type}
              </label>
            ))}
          </div>
          {errors.fileTypes && (
            <p role="alert" className="mt-2 text-sm text-danger-ink">
              {errors.fileTypes}
            </p>
          )}
        </fieldset>
      </Card>

      <Card title="Email">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Email delivery</p>
            <p className="mt-1 text-sm text-white/55">{unsupportedNote.adminEmailStatus}</p>
          </div>
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/70">Status unknown</span>
        </div>
      </Card>

      <Card title="Maintenance mode">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p id="maintenance-label" className="text-sm font-semibold">
              Pause the site for students and advisers
            </p>
            <p className="mt-1 text-sm text-white/55">System Admins can still sign in. Everyone else sees a maintenance notice.</p>
          </div>
          <Switch checked={form.maintenance} onChange={(v) => patch('maintenance', v)} label="Maintenance mode" />
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-white/10 bg-navy-900/90 px-1 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={!canSave || !dirty}
          className="h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-8 text-base font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save settings
        </button>
        <button type="button" onClick={cancel} disabled={!dirty} className={`${ghost} h-12`}>
          Cancel
        </button>
        {dirty && <span className="text-xs text-white/55">You have unsaved changes.</span>}
      </div>
    </form>
  )
}