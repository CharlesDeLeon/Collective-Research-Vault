import { useState } from 'react'
import ModalShell from '../ui/ModalShell'
import Field, { inputCls } from '../upload/Field'
import Select, { Option } from '../ui/Select'
import { PlusIcon } from '../dashboard/icons'
import { apiMessage, createAdminGroup } from '../../services/adminService'
import { backendSupport } from '../../services/backendSupport'
import { STRANDS } from '../../utils/strands'

const EMPTY = { group_name: '', strand: '', section: '', year_level: '11', school_year: '' }

export default function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.group_name.trim()) {
      setError('Group name is required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await createAdminGroup({
        group_name: form.group_name.trim(),
        strand: form.strand,
        section: form.section.trim(),
        year_level: Number(form.year_level),
        school_year: form.school_year.trim(),
      })
      onCreated()
    } catch (err) {
      setError(apiMessage(err, 'Could not create the group.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Create group" icon={PlusIcon} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 px-1 pb-1 pt-4">
        <Field label="Group name">
          <input value={form.group_name} onChange={set('group_name')} maxLength={120} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Strand">
            <Select value={form.strand} onChange={set('strand')} aria-label="Strand" className="border-white/20">
              <Option value="">Not set</Option>
              {STRANDS.map((s) => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Field>
          <Field label="Year level">
            <Select value={form.year_level} onChange={set('year_level')} aria-label="Year level" className="border-white/20">
              <Option value="11">Grade 11</Option>
              <Option value="12">Grade 12</Option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section">
            <input value={form.section} onChange={set('section')} maxLength={60} className={inputCls} />
          </Field>
          <Field label="School year">
            <input value={form.school_year} onChange={set('school_year')} placeholder="2025-2026" maxLength={20} className={inputCls} />
          </Field>
        </div>
        {!backendSupport.adminReassignAdviser && (
          <p className="m-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/60">
            New groups record you as their adviser. Papers cannot be published until an adviser is assigned, and adviser reassignment is not available yet.
          </p>
        )}
        {error && <p role="alert" className="m-0 text-sm text-danger-ink">{error}</p>}
        <button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-gold text-sm font-semibold text-ink disabled:opacity-50">
          {busy ? 'Creating…' : 'Create group'}
        </button>
      </form>
    </ModalShell>
  )
}
