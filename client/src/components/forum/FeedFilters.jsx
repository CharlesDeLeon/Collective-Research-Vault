import { useState } from 'react'
import { FilterIcon, SearchIcon, CloseIcon, ChevronDownIcon } from '../dashboard/icons'
import { STATUS_STYLES } from '../dashboard/constants'

export const EMPTY_FILTERS = {
  query: '',
  flair: '',
  group: '',
  strand: '',
  section: '',
  yearLevel: '',
  schoolYear: '',
}

const FLAIRS = ['proposal', 'under_review', 'for_revision', 'approved', 'published']

const selectCls =
  'h-11 w-full rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20'

const unique = (posts, key) => [...new Set(posts.map((p) => p[key]).filter(Boolean))].sort()

export function applyFilters(posts, f) {
  const q = f.query.trim().toLowerCase()
  return posts.filter((p) => {
    if (f.flair && p.status !== f.flair) return false
    if (f.group && p.groupId !== f.group) return false
    if (f.strand && p.strand !== f.strand) return false
    if (f.section && p.section !== f.section) return false
    if (f.yearLevel && p.yearLevel !== f.yearLevel) return false
    if (f.schoolYear && p.schoolYear !== f.schoolYear) return false
    if (!q) return true
    return [p.text, p.authorName, p.paperTitle, p.groupName].some((v) => v?.toLowerCase().includes(q))
  })
}

export default function FeedFilters({ posts, groups, value, onChange, lockGroup = false }) {
  const [open, setOpen] = useState(false)
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })

  const chips = []
  if (value.flair) chips.push(['flair', STATUS_STYLES[value.flair]?.label ?? value.flair])
  if (value.group && !lockGroup) chips.push(['group', groups.find((g) => g.id === value.group)?.name ?? value.group])
  if (value.strand) chips.push(['strand', value.strand])
  if (value.section) chips.push(['section', value.section])
  if (value.yearLevel) chips.push(['yearLevel', `Grade ${value.yearLevel}`])
  if (value.schoolYear) chips.push(['schoolYear', value.schoolYear])
  const active = chips.length + (value.query.trim() ? 1 : 0)

  return (
    <div className="space-y-3 font-display">
      <div className="flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-white/25 bg-white/5 px-4 transition focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20">
          <SearchIcon className="size-4 shrink-0 text-white/60" />
          <input
            type="search"
            value={value.query}
            onChange={set('query')}
            placeholder="Search posts, papers, people"
            aria-label="Search posts"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/70"
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
            open || chips.length > 0
              ? 'border-gold/60 bg-gold/10 text-gold'
              : 'border-white/25 bg-white/5 text-white/80 hover:bg-white/10'
          }`}
        >
          <FilterIcon className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {chips.length > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.6875rem] text-ink">
              {chips.length}
            </span>
          )}
          <ChevronDownIcon className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-panel p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-semibold text-white/60">
            Flair
            <select value={value.flair} onChange={set('flair')} className={`${selectCls} mt-1`}>
              <option value="">All</option>
              {FLAIRS.map((f) => (
                <option key={f} value={f}>
                  {STATUS_STYLES[f].label}
                </option>
              ))}
            </select>
          </label>
          {!lockGroup && (
            <label className="block text-xs font-semibold text-white/60">
              Group
              <select value={value.group} onChange={set('group')} className={`${selectCls} mt-1`}>
                <option value="">All</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-white/60">
            Strand
            <select value={value.strand} onChange={set('strand')} className={`${selectCls} mt-1`}>
              <option value="">All</option>
              {unique(posts, 'strand').map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-white/60">
            Section
            <select value={value.section} onChange={set('section')} className={`${selectCls} mt-1`}>
              <option value="">All</option>
              {unique(posts, 'section').map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-white/60">
            Year level
            <select value={value.yearLevel} onChange={set('yearLevel')} className={`${selectCls} mt-1`}>
              <option value="">All</option>
              {unique(posts, 'yearLevel').map((v) => (
                <option key={v} value={v}>
                  Grade {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-white/60">
            School year
            <select value={value.schoolYear} onChange={set('schoolYear')} className={`${selectCls} mt-1`}>
              <option value="">All</option>
              {unique(posts, 'schoolYear').map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {active > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: '' })}
              aria-label={`Remove filter ${label}`}
              className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold/20"
            >
              {label}
              <CloseIcon className="size-3" strokeWidth={2.4} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS, group: lockGroup ? value.group : '' })}
            className="px-2 text-xs font-semibold text-white/60 underline-offset-2 transition hover:text-white hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}