import { useCallback, useEffect, useMemo, useState } from 'react'
import useToast from '../../context/useToast'
import { glass } from '../../components/dashboard/constants'
import { BellIcon } from '../../components/dashboard/icons'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Select, { Option } from '../../components/ui/Select'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Field, { inputCls } from '../../components/upload/Field'
import { apiMessage, listAnnouncements, sendAnnouncement } from '../../services/adminService'
import { loadInsights } from '../../services/adminInsights'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { roleLabel } from '../../utils/adminRoles'
import { timeAgo } from '../../utils/formatDate'

const TITLE_MAX = 100
const BODY_MAX = 1000
const ROLES = ['student', 'adviser', 'external_panelist', 'sysadmin']

const EMPTY = { title: '', body: '', audience: 'all', role: 'student', groupId: '' }

export default function AdminAnnouncements() {
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [insights, setInsights] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    const next = await loadInsights()
    setError('')
    setInsights(next)
    if (backendSupport.adminAnnouncements) {
      try {
        setHistory(await listAnnouncements())
      } catch (e) {
        setError(apiMessage(e, 'Could not load sent announcements.'))
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => load())
  }, [load])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const groups = useMemo(() => insights?.groups ?? [], [insights])

  const reach = useMemo(() => {
    if (!insights) return null
    if (form.audience === 'group') {
      const group = groups.find((g) => String(g.group_id) === form.groupId)
      return group ? (group.member_count ?? 0) : null
    }
    const roles = insights.roles ?? []
    if (form.audience === 'role') return Number(roles.find((r) => r.role === form.role)?.count ?? 0)
    return roles.reduce((sum, r) => sum + Number(r.count), 0)
  }, [insights, groups, form.audience, form.role, form.groupId])

  const audienceText = () => {
    if (form.audience === 'role') return `all ${roleLabel(form.role).toLowerCase()}s`
    if (form.audience === 'group') return groups.find((g) => String(g.group_id) === form.groupId)?.group_name ?? 'a group'
    return 'everyone'
  }

  const review = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'Add a title.'
    if (!form.body.trim()) errs.body = 'Write the message.'
    if (form.audience === 'group' && !form.groupId) errs.groupId = 'Choose a group.'
    setErrors(errs)
    if (Object.keys(errs).length === 0) setConfirming(true)
  }

  const send = async () => {
    setConfirming(false)
    try {
      await sendAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        role: form.audience === 'role' ? form.role : undefined,
        groupId: form.audience === 'group' ? Number(form.groupId) : undefined,
      })
      toast('Announcement sent.')
      setForm(EMPTY)
      load()
    } catch (e) {
      toast(apiMessage(e, 'Could not send the announcement.'), 'error')
    }
  }

  const invalid = (key) => ({
    'aria-invalid': Boolean(errors[key]),
    className: `${inputCls} ${errors[key] ? 'border-danger' : 'border-white/20'}`,
  })

  const canSend = backendSupport.adminAnnouncements

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Announcements</h1>
        <p className="mt-1 text-sm text-white/60">Send a notice to everyone, a role or a single group.</p>
      </header>

      <ErrorBanner message={error} onRetry={load} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <form onSubmit={review} noValidate className={`${glass} min-w-0 space-y-5 p-4 sm:p-6`}>
          <h2 className="text-lg font-bold">New announcement</h2>

          <div className={`grid gap-4 ${form.audience === 'all' ? '' : 'sm:grid-cols-2'}`}>
            <Field label="Send to">
              <Select value={form.audience} onChange={set('audience')} aria-label="Audience" className="border-white/20">
                <Option value="all">Everyone</Option>
                <Option value="role">A role</Option>
                <Option value="group">A group</Option>
              </Select>
            </Field>
            {form.audience === 'role' && (
              <Field label="Role">
                <Select value={form.role} onChange={set('role')} aria-label="Role" className="border-white/20">
                  {ROLES.map((r) => (
                    <Option key={r} value={r}>
                      {roleLabel(r)}
                    </Option>
                  ))}
                </Select>
              </Field>
            )}
            {form.audience === 'group' && (
              <Field label="Group" error={errors.groupId}>
                <Select value={form.groupId} onChange={set('groupId')} aria-label="Group" className={errors.groupId ? 'border-danger' : 'border-white/20'}>
                  <Option value="">Choose a group</Option>
                  {groups.map((g) => (
                    <Option key={g.group_id} value={String(g.group_id)}>
                      {g.group_name}
                    </Option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <p className="text-sm text-white/60" aria-live="polite">
            {loading ? 'Counting recipients…' : reach === null ? 'Choose a group to see who it reaches.' : `Reaches about ${reach} ${reach === 1 ? 'person' : 'people'}.`}
          </p>

          <Field label="Title" error={errors.title}>
            <input value={form.title} onChange={set('title')} maxLength={TITLE_MAX} {...invalid('title')} />
          </Field>
          <Field label="Message" error={errors.body}>
            <textarea value={form.body} onChange={set('body')} maxLength={BODY_MAX} rows={5} {...invalid('body')} />
          </Field>
          <p className="-mt-3 text-right text-xs text-white/50">
            {form.body.length}/{BODY_MAX}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSend}
              className="h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-8 text-base font-semibold text-ink transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review and send
            </button>
            {!canSend && <p className="m-0 min-w-0 flex-1 text-xs text-white/60">{unsupportedNote.adminAnnouncements}</p>}
          </div>
        </form>

        <aside className="min-w-0 space-y-6">
          <section className={`${glass} p-4 sm:p-5`} aria-label="Preview">
            <h2 className="text-base font-bold">Preview</h2>
            <div className="mt-3 flex gap-3 rounded-xl border border-white/10 bg-white/4 p-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                <BellIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="wrap-break-word text-sm font-semibold">{form.title.trim() || 'Your title'}</p>
                <p className="mt-1 whitespace-pre-line wrap-break-word text-sm text-white/75">{form.body.trim() || 'Your message appears here.'}</p>
                <p className="mt-2 text-xs text-white/45">System Admin · just now</p>
              </div>
            </div>
          </section>

          <section className={`${glass} p-4 sm:p-5`}>
            <h2 className="text-base font-bold">Sent</h2>
            {!canSend ? (
              <p className="mt-3 text-sm text-white/55">{unsupportedNote.adminAnnouncementHistory}</p>
            ) : history.length === 0 ? (
              <p className="mt-3 text-sm text-white/55">Nothing sent yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {history.map((a, i) => (
                  <li key={a.notification_id ?? a.id ?? i} className="py-3">
                    <p className="wrap-break-word text-sm font-semibold">{a.title}</p>
                    <p className="mt-1 text-xs text-white/55">
                      {[a.audience_label ?? a.audience, a.created_at ? timeAgo(a.created_at) : null].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {confirming && (
        <ConfirmModal
          title="Send announcement"
          message={`This goes to ${audienceText()}${reach === null ? '' : ` (about ${reach} ${reach === 1 ? 'person' : 'people'})`}. It cannot be unsent.`}
          confirmLabel="Send"
          onConfirm={send}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  )
}