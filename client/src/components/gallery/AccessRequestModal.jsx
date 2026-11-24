import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalShell from '../ui/ModalShell'
import Field, { inputCls } from '../upload/Field'
import { DocIcon } from '../dashboard/icons'
import useAuth from '../../context/useAuth'
import { submitAccessRequest } from '../../services/accessRequestService'

const PURPOSE_MIN = 20
const PURPOSE_MAX = 1000
const NAME_MAX = 100
const INSTITUTION_MAX = 150
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(v) {
  const errors = {}
  if (!v.name.trim()) errors.name = 'Enter your full name.'
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Enter a valid email address.'
  if (!v.institution.trim()) errors.institution = 'Enter your institution.'
  if (v.purpose.trim().length < PURPOSE_MIN) {
    errors.purpose = `Please explain in at least ${PURPOSE_MIN} characters.`
  }
  if (!v.consent) errors.consent = 'Please agree to continue.'
  return errors
}

const border = (error) => (error ? 'border-danger-border' : 'border-form-line-soft')

export default function AccessRequestModal({ paper, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    institution: '',
    purpose: '',
    consent: false,
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    try {
      const { ref } = await submitAccessRequest(paper.slug, {
        name: values.name.trim(),
        email: values.email.trim(),
        institution: values.institution.trim(),
        purpose: values.purpose.trim(),
        consent: values.consent,
      })
      navigate(`/request/submitted?ref=${encodeURIComponent(ref)}`)
    } catch {
      setStatus('error')
    }
  }

  return (
    <ModalShell title="Request full paper" icon={DocIcon} onClose={onClose}>
      <form onSubmit={submit} noValidate className="px-1 pb-1 pt-4">
        <p className="m-0 mb-5 line-clamp-2 text-sm leading-relaxed text-fg-subtle">
          For: <span className="font-medium text-fg">{paper.title}</span>
        </p>
        <div className="grid gap-5">
          <Field label="Full name" error={errors.name}>
            <input
              type="text"
              maxLength={NAME_MAX}
              autoComplete="name"
              value={values.name}
              onChange={set('name')}
              placeholder="E.g. Juan Dela Cruz"
              className={`${inputCls} ${border(errors.name)}`}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={set('email')}
              placeholder="E.g. juan.delacruz@email.com"
              className={`${inputCls} ${border(errors.email)}`}
            />
          </Field>
          <Field label="Institution" error={errors.institution}>
            <input
              type="text"
              maxLength={INSTITUTION_MAX}
              autoComplete="organization"
              value={values.institution}
              onChange={set('institution')}
              placeholder="E.g. Name of institution"
              className={`${inputCls} ${border(errors.institution)}`}
            />
          </Field>
          <Field label="Purpose" error={errors.purpose}>
            <textarea
              rows={5}
              maxLength={PURPOSE_MAX}
              value={values.purpose}
              onChange={set('purpose')}
              placeholder="State why you need access to this paper and how you plan to use it."
              className={`${inputCls} h-auto min-h-32 resize-y py-3 leading-relaxed ${border(errors.purpose)}`}
            />
            <span className="mt-1 block text-right text-xs text-fg-ghost">
              {values.purpose.length}/{PURPOSE_MAX}
            </span>
          </Field>
          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-fg/85">
              <input
                type="checkbox"
                checked={values.consent}
                onChange={set('consent')}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>
                I agree that my details may be shared with the paper’s adviser and authors so they can review
                this request.
              </span>
            </label>
            {errors.consent && (
              <p role="alert" className="mb-0 mt-1.5 text-xs text-danger-fg">
                {errors.consent}
              </p>
            )}
          </div>
        </div>
        {status === 'error' && (
          <p role="alert" className="mb-0 mt-4 text-sm text-danger-fg">
            We couldn’t send your request. Please try again.
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-6 min-h-12 w-full rounded-xl bg-cta text-base font-semibold text-cta-fg disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </ModalShell>
  )
}
