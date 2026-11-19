import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { glass } from '../../components/dashboard/constants'
import { UsersIcon, PlusIcon, PencilIcon, TrashIcon } from '../../components/dashboard/icons'

const STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS']
const EMPTY_FORM = { group_name: '', strand: '', section: '', year_level: '', school_year: '' }

export default function AdviserGroups() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 25

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalMembers, setModalMembers] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/groups', { params: { search: search || undefined, page, limit } })
      setGroups(res.data.data || [])
      setTotal(res.data.pagination?.total || res.data.data?.length || 0)
    } catch (e) {
      console.error(e)
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalMembers([])
    setMemberSearch('')
    setMemberResults([])
    setModalOpen(true)
  }

  const openEdit = async (g) => {
    setEditTarget(g)
    setForm({
      group_name: g.group_name || '',
      strand: g.strand || g.program || '',
      section: g.section || '',
      year_level: g.year_level || '',
      school_year: g.school_year || '',
    })
    setMemberSearch('')
    setMemberResults([])
    try {
      const res = await api.get(`/coordinator/groups/${g.group_id}`)
      const existing = (res.data.data?.members || []).map(m => ({ user_id: m.user_id, name: m.name, email: m.email }))
      setModalMembers(existing)
    } catch (e) {
      console.error(e)
      setModalMembers([])
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalMembers([])
  }

  const searchMembers = async (q) => {
    setMemberSearch(q)
    if (!q.trim()) { setMemberResults([]); return }
    try {
      const res = await api.get('/coordinator/students', { params: { search: q } })
      const list = res.data.data || []
      setMemberResults(list.filter(s => !modalMembers.some(m => m.user_id === s.user_id)))
    } catch (e) {
      console.error(e)
    }
  }

  const addMember = (s) => {
    setModalMembers(prev => [...prev, { user_id: s.user_id, name: s.name, email: s.email }])
    setMemberResults(prev => prev.filter(x => x.user_id !== s.user_id))
    setMemberSearch('')
  }

  const removeMember = (uid) => {
    setModalMembers(prev => prev.filter(m => m.user_id !== uid))
  }

  const saveGroup = async () => {
    if (!form.group_name.trim()) { alert('Group name is required'); return }
    setSaving(true)
    try {
      const payload = {
        group_name: form.group_name.trim(),
        program: form.strand || null,
        strand: form.strand || null,
        section: form.section || null,
        year_level: form.year_level ? Number(form.year_level) : null,
        school_year: form.school_year || null,
      }
      if (editTarget) {
        await api.put(`/coordinator/groups/${editTarget.group_id}`, payload)
        // sync members: remove old, add new — simpler: add missing, remove extra
        const res = await api.get(`/coordinator/groups/${editTarget.group_id}`)
        const existing = (res.data.data?.members || []).map(m => m.user_id)
        const staged = modalMembers.map(m => m.user_id)
        for (const uid of existing.filter(id => !staged.includes(id))) {
          await api.delete(`/coordinator/groups/${editTarget.group_id}/members/${uid}`)
        }
        for (const uid of staged.filter(id => !existing.includes(id))) {
          await api.post(`/coordinator/groups/${editTarget.group_id}/members`, { user_id: uid })
        }
      } else {
        const res = await api.post('/coordinator/groups', payload)
        const newId = res.data?.data?.group_id || res.data?.insertId
        if (newId) {
          for (const m of modalMembers) {
            await api.post(`/coordinator/groups/${newId}/members`, { user_id: m.user_id })
          }
        }
      }
      closeModal()
      fetchGroups()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.message || 'Failed to save group')
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (g) => {
    if (!window.confirm(`Delete group "${g.group_name}"?`)) return
    try {
      await api.delete(`/coordinator/groups/${g.group_id}`)
      fetchGroups()
      if (detail?.group_id === g.group_id) setDetail(null)
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.message || 'Failed to delete group')
    }
  }

  const openDetail = async (g) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/coordinator/groups/${g.group_id}`)
      setDetail(res.data.data || g)
    } catch (e) {
      console.error(e)
      setDetail(g)
    } finally {
      setDetailLoading(false)
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search groups…"
          className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder-white/40 outline-none focus:border-gold/50"
        />
      </div>

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
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          No groups yet. Create your first group to get started.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-5">
          {groups.map((g) => (
            <div
              key={g.group_id}
              className={`${glass} flex flex-col gap-3 p-5 transition hover:border-gold/40`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 wrap-break-word text-lg font-bold">{g.group_name}</h2>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(g)}
                    className="grid size-8 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-gold/40 hover:text-gold"
                    title="Edit"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGroup(g)}
                    className="grid size-8 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-rose-400/40 hover:text-rose-300"
                    title="Delete"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(g.strand || g.program) && (
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    {g.strand || g.program}
                  </span>
                )}
                {g.section && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                    {g.section}
                  </span>
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

              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
                <span>{g.member_count ?? 0} members</span>
                <span>{g.submission_count ?? 0} papers</span>
                <button
                  type="button"
                  onClick={() => openDetail(g)}
                  className="font-semibold text-gold hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-white/60">Page {page}</span>
          <button
            type="button"
            disabled={page * limit >= total}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail panel */}
      {detail && (
        <div className={`${glass} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{detail.group_name}</h2>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="text-sm text-white/60 hover:text-white"
            >
              Close
            </button>
          </div>
          {detailLoading ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white/70">Members</h3>
                {detail.members?.length ? (
                  <ul className="space-y-1 text-sm">
                    {detail.members.map(m => (
                      <li key={m.user_id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                        <span>{m.name}</span>
                        <span className="text-xs text-white/50">{m.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/50">No members.</p>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white/70">Papers</h3>
                {detail.submissions?.length ? (
                  <ul className="space-y-1 text-sm">
                    {detail.submissions.map(s => (
                      <li key={s.submission_id} className="rounded-lg bg-white/[0.04] px-3 py-2">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-white/50">{s.status} · {s.stage}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/50">No papers.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`${glass} w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}>
            <h2 className="mb-4 text-xl font-bold">
              {editTarget ? 'Edit group' : 'Create group'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-white/70">Group name</span>
                <input
                  value={form.group_name}
                  onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                  placeholder="e.g. Group Alpha"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Strand</span>
                <select
                  value={form.strand}
                  onChange={(e) => setForm({ ...form, strand: e.target.value })}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                >
                  <option value="">Select strand</option>
                  {STRANDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Section</span>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                  placeholder="e.g. STEM 12-A"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">Year level</span>
                <select
                  value={form.year_level}
                  onChange={(e) => setForm({ ...form, year_level: e.target.value })}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                >
                  <option value="">Select</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white/70">School year</span>
                <input
                  value={form.school_year}
                  onChange={(e) => setForm({ ...form, school_year: e.target.value })}
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                  placeholder="e.g. 2026-2027"
                />
              </label>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-white/70">Members</h3>
              <div className="flex gap-2">
                <input
                  value={memberSearch}
                  onChange={(e) => searchMembers(e.target.value)}
                  placeholder="Search students by name or email…"
                  className="h-10 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none focus:border-gold/50"
                />
              </div>
              {memberResults.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.04]">
                  {memberResults.map(s => (
                    <li
                      key={s.user_id}
                      onClick={() => addMember(s)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-white/10"
                    >
                      {s.name} <span className="text-white/50">({s.email})</span>
                    </li>
                  ))}
                </ul>
              )}
              {modalMembers.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {modalMembers.map(m => (
                    <li key={m.user_id} className="flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs text-gold">
                      {m.name}
                      <button type="button" onClick={() => removeMember(m.user_id)} className="text-gold/70 hover:text-gold">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                disabled={saving}
                className="h-11 rounded-xl bg-linear-to-br/srgb from-gold to-gold-soft px-5 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {saving ? 'Saving…' : (editTarget ? 'Save changes' : 'Create group')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}