import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  listMyGroups,
  getGroup,
  createGroup,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  searchStudents,
} from '../../services/adviserService'
import useToast from '../../context/useToast'
import useAuth from '../../context/useAuth'
import { glass } from '../../components/dashboard/constants'
import { PlusIcon, PencilIcon, SearchIcon } from '../../components/dashboard/icons'
import Select, { Option } from '../../components/ui/Select'

const STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS']
const EMPTY_FORM = { group_name: '', strand: '', section: '', year_level: '', school_year: '' }

const inputCls =
  'h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold/50'

export default function AdviserGroups() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formAdviserName, setFormAdviserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalMembers, setModalMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGroups(await listMyGroups())
    } catch (e) {
      console.error(e)
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) =>
      [g.group_name, g.strand, g.program, g.section, g.school_year].some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [groups, search])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormAdviserName(user?.name ?? user?.full_name ?? 'Adviser')
    setModalMembers([])
    setMembersLoading(false)
    setMemberSearch('')
    setMemberResults([])
    setModalOpen(true)
  }

  const openEdit = useCallback(async (g) => {
    setEditTarget(g)
    setForm({
      group_name: g.group_name || '',
      strand: g.strand || g.program || '',
      section: g.section || '',
      year_level: g.year_level ? String(g.year_level) : '',
      school_year: g.school_year || '',
    })
    setFormError('')
    setFormAdviserName(g.adviser_name || '')
    setMemberSearch('')
    setMemberResults([])
    setModalMembers([])
    setMembersLoading(true)
    setModalOpen(true)
    try {
      const full = await getGroup(g.group_id)
      setFormAdviserName(full?.adviser_name || g.adviser_name || '—')
      setModalMembers((full?.members || []).map((m) => ({ user_id: m.user_id, name: m.name, email: m.email })))
    } catch (e) {
      console.error(e)
      toast('Could not load the current members.', 'error')
    } finally {
      setMembersLoading(false)
    }
  }, [toast])

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormAdviserName('')
    setModalMembers([])
    setMembersLoading(false)
  }

  useEffect(() => {
    const targetId = searchParams.get('edit')
    if (!targetId || loading) return
    const target = groups.find((g) => String(g.group_id) === String(targetId))
    if (target && !modalOpen) openEdit(target)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, loading, groups, modalOpen, openEdit])

  const onSearchMembers = async (q) => {
    setMemberSearch(q)
    if (!q.trim()) {
      setMemberResults([])
      return
    }
    try {
      const list = await searchStudents(q)
      setMemberResults(list.filter((s) => !modalMembers.some((m) => m.user_id === s.user_id)))
    } catch (e) {
      console.error(e)
    }
  }

  const addMember = (s) => {
    setModalMembers((prev) => [...prev, { user_id: s.user_id, name: s.name, email: s.email }])
    setMemberResults((prev) => prev.filter((x) => x.user_id !== s.user_id))
    setMemberSearch('')
  }

  const removeMember = (uid) => {
    setModalMembers((prev) => prev.filter((m) => m.user_id !== uid))
  }

  const validate = () => {
    if (!form.group_name.trim()) return 'Group name is required.'
    if (!form.strand) return 'Select a strand.'
    if (!form.section.trim()) return 'Section is required.'
    if (!form.year_level) return 'Select a year level.'
    if (!form.school_year.trim()) return 'School year is required.'
    if (!/^\d{4}-\d{4}$/.test(form.school_year.trim())) return 'Use a school year like 2026-2027.'
    const dupe = groups.some(
      (g) =>
        g.group_id !== editTarget?.group_id &&
        String(g.group_name).trim().toLowerCase() === form.group_name.trim().toLowerCase() &&
        String(g.section ?? '').trim().toLowerCase() === form.section.trim().toLowerCase() &&
        String(g.school_year ?? '').trim().toLowerCase() === form.school_year.trim().toLowerCase()
    )
    if (dupe) return 'A group with this name already exists in this section and school year.'
    return ''
  }

  const saveGroup = async () => {
    if (membersLoading) return
    const problem = validate()
    setFormError(problem)
    if (problem) return
    setSaving(true)
    try {
      const payload = {
        group_name: form.group_name.trim(),
        program: form.strand,
        strand: form.strand,
        section: form.section.trim(),
        year_level: Number(form.year_level),
        school_year: form.school_year.trim(),
      }
      if (editTarget) {
        await updateGroup(editTarget.group_id, payload)
        const full = await getGroup(editTarget.group_id)
        const existing = (full?.members || []).map((m) => m.user_id)
        const staged = modalMembers.map((m) => m.user_id)
        for (const uid of existing.filter((id) => !staged.includes(id))) {
          await removeGroupMember(editTarget.group_id, uid)
        }
        for (const uid of staged.filter((id) => !existing.includes(id))) {
          await addGroupMember(editTarget.group_id, uid)
        }
        toast('Group updated.')
      } else {
        await createGroup(payload)
        toast('Group created. Open it to add students.')
      }
      closeModal()
      fetchGroups()
    } catch (e) {
      console.error(e)
      setFormError(e.response?.data?.message || 'Failed to save the group.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Groups</h1>
          <p className="text-sm text-white/60">Create and manage your research groups.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105"
        >
          <PlusIcon className="size-4" /> Create group
        </button>
      </header>

      <label className="relative block max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups…"
          aria-label="Search groups"
          className={`${inputCls} w-full pl-10`}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/[0.07]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 px-6 py-12 text-center">
          <p className="m-0 text-lg font-semibold">Create your first group</p>
          <p className="mb-0 mt-1 text-sm text-white/70">Add the students you advise, then review their papers here.</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 h-12 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-7 text-base font-semibold text-ink hover:brightness-105"
          >
            Create group
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="m-0 rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/70">
          No groups match your search.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-5">
          {visible.map((g) => (
            <div key={g.group_id} className={`${glass} flex flex-col gap-3 p-5 transition hover:border-gold/40`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="m-0 min-w-0 wrap-break-word text-lg font-bold">{g.group_name}</h2>
                <button
                  type="button"
                  onClick={() => openEdit(g)}
                  aria-label={`Edit ${g.group_name}`}
                  title="Edit"
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-gold/40 hover:text-gold"
                >
                  <PencilIcon className="size-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(g.strand || g.program) && (
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    {g.strand || g.program}
                  </span>
                )}
                {g.section && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">{g.section}</span>
                )}
                {g.year_level && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                    Grade {g.year_level}
                  </span>
                )}
                {g.school_year && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                    {g.school_year}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/60">
                <span>{g.member_count ?? 0} members</span>
                <span>{g.submission_count ?? 0} papers</span>
                <button
                  type="button"
                  onClick={() => navigate(`/adviser/groups/${g.group_id}`)}
                  className="min-h-9 font-semibold text-gold hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editTarget ? 'Edit group' : 'Create group'}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-modal p-5 shadow-2xl shadow-black/30 sm:p-6"
          >
            <h2 className="mb-4 mt-0 text-xl font-bold">{editTarget ? 'Edit group' : 'Create group'}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-white/70">Adviser</span>
                <input
                  value={formAdviserName}
                  readOnly
                  aria-label="Adviser"
                  className={`${inputCls} cursor-default text-white/60`}
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-white/70">Group name</span>
                <input
                  value={form.group_name}
                  onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Group Alpha"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-xs font-semibold text-white/70">Strand</span>
                <Select
                  value={form.strand}
                  onChange={(e) => setForm({ ...form, strand: e.target.value })}
                  className="border-white/15"
                >
                  <Option value="">Select strand</Option>
                  {STRANDS.map((s) => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Section</span>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. STEM 12-A"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-xs font-semibold text-white/70">Year level</span>
                <Select
                  value={form.year_level}
                  onChange={(e) => setForm({ ...form, year_level: e.target.value })}
                  className="border-white/15"
                >
                  <Option value="">Select</Option>
                  <Option value="11">11</Option>
                  <Option value="12">12</Option>
                </Select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">School year</span>
                <input
                  value={form.school_year}
                  onChange={(e) => setForm({ ...form, school_year: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 2026-2027"
                  inputMode="numeric"
                  maxLength={9}
                  pattern="[0-9]{4}-[0-9]{4}"
                />
              </label>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-white/70">Adviser</span>
                <p className="m-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                  You. The adviser is filled in automatically.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 mt-0 text-sm font-semibold text-white/70">Members</h3>
              {!editTarget ? (
                <p className="m-0 text-xs text-white/55">Add students after the group is created, from the group page.</p>
              ) : (
                <>
                  {membersLoading && <p className="mb-0 text-xs text-white/55">Loading current members…</p>}
                  <input
                    value={memberSearch}
                    onChange={(e) => onSearchMembers(e.target.value)}
                    placeholder="Search students by name or email…"
                    aria-label="Search students"
                    disabled={membersLoading}
                    className={`${inputCls} h-10 w-full disabled:opacity-60`}
                  />
                  {memberSearch.trim() && memberResults.length === 0 && (
                    <p className="mb-0 mt-2 text-xs text-white/60">
                      No student found. Ask a System Admin to create the account.
                    </p>
                  )}
                  {memberResults.length > 0 && (
                    <ul className="m-0 mt-2 max-h-36 list-none overflow-y-auto rounded-xl border border-white/10 bg-white/[0.04] p-0">
                      {memberResults.map((s) => (
                        <li key={s.user_id}>
                          <button
                            type="button"
                            onClick={() => addMember(s)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                          >
                            {s.name} <span className="text-white/50">({s.email})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {modalMembers.length > 0 && (
                    <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                      {modalMembers.map((m) => (
                        <li key={m.user_id} className="flex items-center gap-2 rounded-full bg-gold/10 py-1 pl-3 pr-1 text-xs text-gold">
                          {m.name}
                          <button
                            type="button"
                            onClick={() => removeMember(m.user_id)}
                            aria-label={`Remove ${m.name}`}
                            className="grid size-6 place-items-center rounded-full text-gold/70 hover:bg-gold/20 hover:text-gold"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {formError && (
              <p role="alert" className="mb-0 mt-4 text-sm text-danger-ink">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGroup}
                disabled={saving || membersLoading}
                className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {membersLoading ? 'Loading members…' : saving ? 'Saving…' : editTarget ? 'Save changes' : 'Create group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}