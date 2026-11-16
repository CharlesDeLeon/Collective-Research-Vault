import { useState } from 'react'
import ModalShell from '../ui/ModalShell'
import Field, { inputCls } from '../upload/Field'
import { DocIcon, CheckIcon } from '../dashboard/icons'
import useAuth from '../../context/useAuth'
import { submitAccessRequest } from '../../services/accessRequestService'

const PURPOSE_MIN = 20
const PURPOSE_MAX = 1000
const INSTITUTION_MAX = 150
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(v) {
  const errors = {}
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Enter a valid email address.'
  const digits = v.phone.replace(/\D/g, '')
  if (!/^[+\d\s()-]+$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a valid contact number.'
  }
  if (!v.institution.trim()) errors.institution = 'Enter your institution.'
  if (v.purpose.trim().length < PURPOSE_MIN) {
    errors.purpose = `Please explain in at least ${PURPOSE_MIN} characters.`
  }
  return errors
}

const border = (error) => (error ? 'border-danger' : 'border-white/15')

export default function AccessRequestModal({ paper, onClose }) {
  const { user } = useAuth()
  const [values, setValues] = useState({
    email: user?.email ?? '',
    phone: '',
    institution: '',
    purpose: '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    try {
      await submitAccessRequest(paper.id, {
        email: values.email.trim(),
        phone: values.phone.trim(),
        institution: values.institution.trim(),
        purpose: values.purpose.trim(),
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <ModalShell title="Request access" icon={DocIcon} onClose={onClose}>
      {status === 'done' ? (
        <div className="px-2 pb-4 pt-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/20 text-success-ink">
            <CheckIcon className="size-7" />
          </span>
          <h3 className="mb-2 mt-4 text-xl font-semibold">Request sent</h3>
          <p className="m-0 text-sm leading-relaxed text-white/75">
            An adviser will review your request and may contact you at {values.email.trim()} once the paper’s
            authors have been asked for permission.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 min-h-12 rounded-xl bg-linear-to-br from-gold to-gold-soft px-8 text-base font-semibold text-ink"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="px-1 pb-1 pt-4">
          <p className="m-0 mb-5 line-clamp-2 text-sm leading-relaxed text-white/70">
            For: <span className="font-medium text-white">{paper.title}</span>
          </p>
          <div className="grid gap-5">
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
            <Field label="Contact number" error={errors.phone}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={set('phone')}
                placeholder="E.g. +63 912 345 6789"
                className={`${inputCls} ${border(errors.phone)}`}
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
              <span className="mt-1 block text-right text-xs text-white/50">
                {values.purpose.length}/{PURPOSE_MAX}
              </span>
            </Field>
          </div>
          {status === 'error' && (
            <p role="alert" className="mb-0 mt-4 text-sm text-danger-ink">
              We couldn’t send your request. Please try again.
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-6 min-h-12 w-full rounded-xl bg-linear-to-br from-gold to-gold-soft text-base font-semibold text-ink disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </ModalShell>
  )
}