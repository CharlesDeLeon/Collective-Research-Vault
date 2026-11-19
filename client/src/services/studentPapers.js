import { canEdit, canResubmit } from '../utils/paperRules'

const STORE_KEY = 'corev.studentPapers.v2'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const ago = (ms) => new Date(Date.now() - ms).toISOString()
const HR = 3_600_000
const DAY = 86_400_000

const GROUPS = [
  {
    id: 'g-12a-alpha',
    name: 'Group Alpha',
    strand: 'STEM',
    section: '12-A',
    schoolYear: '2025-2026',
    adviser: 'Ms. Lourdes Aquino',
  },
]

const entry = (status, at, note = '', by = 'System') => ({ status, at, note, by })
const ADVISER = 'Ms. Lourdes Aquino'

const base = (id, status, extra) => ({
  id,
  adviser: ADVISER,
  notes: [],
  consent: { status: 'pending', at: null },
  groupId: GROUPS[0].id,
  groupName: GROUPS[0].name,
  strand: GROUPS[0].strand,
  section: GROUPS[0].section,
  schoolYear: GROUPS[0].schoolYear,
  authors: ['Ana Santos', 'Ben Reyes', 'Carla Mendoza'],
  videoUrl: '',
  status,
  ...extra,
})

const SEED = [
  base(101, 'proposal', {
    title: 'Low-Cost Water Quality Sensor Network for Barangay Wells',
    abstract:
      'We propose a network of inexpensive sensors that report acidity and turbidity of well water to a shared dashboard, so barangay officials can spot unsafe wells early.',
    keywords: ['water quality', 'IoT', 'sensors'],
    updatedAt: ago(5 * HR),
    history: [entry('proposal', ago(5 * HR), 'Proposal submitted.', 'Ana Santos')],
  }),
  base(102, 'under_review', {
    title: 'Acoustic Treatment of Open-Plan Classrooms Using Recycled Materials',
    abstract:
      'The study measures how panels made of recycled materials reduce echo in open classrooms, and compares them with commercial acoustic panels in cost and effect.',
    keywords: ['acoustics', 'recycled materials', 'classrooms'],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    updatedAt: ago(2 * DAY),
    consent: { status: 'granted', at: ago(2 * DAY) },
    history: [
      entry('proposal', ago(9 * DAY), 'Proposal submitted.', 'Ana Santos'),
      entry('under_review', ago(2 * DAY), 'Moved to review.', ADVISER),
    ],
  }),
  base(103, 'for_revision', {
    title: 'Microplastic Concentration in Urban Watersheds',
    abstract:
      'Water samples from three urban creeks were filtered and counted to estimate the microplastic load, with attention to differences between dry and rainy weeks.',
    keywords: ['microplastics', 'watersheds', 'sampling'],
    updatedAt: ago(34 * 60_000),
    notes: [
      { id: 1, authorName: ADVISER, text: 'Please add the sampling dates and how many samples were taken per creek.', createdAt: ago(34 * 60_000) },
      { id: 2, authorName: ADVISER, text: 'The abstract should state the main finding, not only the method.', createdAt: ago(34 * 60_000) },
    ],
    history: [
      entry('proposal', ago(20 * DAY), 'Proposal submitted.', 'Ben Reyes'),
      entry('under_review', ago(12 * DAY), 'Moved to review.', ADVISER),
      entry('for_revision', ago(34 * 60_000), 'Two changes requested. See feedback notes.', ADVISER),
    ],
  }),
  base(104, 'approved', {
    title: 'Passive Cooling Strategies for Tropical School Buildings',
    abstract:
      'Compares roof ventilation, shading and wall materials in three classrooms to find which passive cooling strategy lowers indoor temperature the most.',
    keywords: ['passive cooling', 'architecture', 'tropics'],
    updatedAt: ago(9 * DAY),
    consent: { status: 'pending', at: null },
    history: [
      entry('proposal', ago(60 * DAY), 'Proposal submitted.', 'Carla Mendoza'),
      entry('under_review', ago(45 * DAY), 'Moved to review.', ADVISER),
      entry('for_revision', ago(30 * DAY), 'Add a comparison table of the three strategies.', ADVISER),
      entry('under_review', ago(20 * DAY), 'Resubmitted for review.', 'Carla Mendoza'),
      entry('approved', ago(9 * DAY), 'Approved after defense.', ADVISER),
    ],
  }),
  base(105, 'published', {
    title: 'Mobile Attendance Tracking with Facial Recognition',
    abstract:
      'An attendance app that recognizes students from camera frames and records them automatically, replacing paper roll calls in classrooms.',
    keywords: ['facial recognition', 'attendance', 'mobile'],
    updatedAt: ago(40 * DAY),
    consent: { status: 'granted', at: ago(52 * DAY) },
    history: [
      entry('proposal', ago(120 * DAY), 'Proposal submitted.', 'Ana Santos'),
      entry('under_review', ago(100 * DAY), 'Moved to review.', ADVISER),
      entry('approved', ago(55 * DAY), 'Approved after defense.', ADVISER),
      entry('published', ago(40 * DAY), 'Published to the gallery.', ADVISER),
    ],
  }),
]

function read() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    return SEED
  }
  return SEED
}

function write(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list))
  } catch {
    return
  }
}

export async function getMyGroups() {
  await wait(250)
  return GROUPS
}

export async function listMyPapers() {
  await wait(350)
  return [...read()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function getMyPaper(id) {
  await wait(250)
  return read().find((p) => String(p.id) === String(id)) ?? null
}

export async function createPaper(payload) {
  await wait(600)
  const group = GROUPS.find((g) => g.id === payload.groupId) ?? GROUPS[0]
  const list = read()
  const paper = {
    id: Date.now(),
    groupId: group.id,
    groupName: group.name,
    strand: group.strand,
    section: group.section,
    schoolYear: group.schoolYear,
    status: 'proposal',
    adviser: group.adviser,
    notes: [],
    consent: { status: 'pending', at: null },
    history: [entry('proposal', new Date().toISOString(), 'Proposal submitted.', 'You')],
    updatedAt: new Date().toISOString(),
    title: payload.title,
    authors: payload.authors,
    abstract: payload.abstract,
    keywords: payload.keywords,
    videoUrl: payload.videoUrl,
  }
  write([paper, ...list])
  return paper
}

export async function updatePaper(id, payload) {
  await wait(600)
  const list = read()
  const found = list.find((p) => String(p.id) === String(id))
  if (!found || !canEdit(found.status)) throw new Error('not-editable')
  const next = { ...found, ...payload, updatedAt: new Date().toISOString() }
  write(list.map((p) => (p === found ? next : p)))
  return next
}

export async function resubmitPaper(id) {
  await wait(600)
  const list = read()
  const found = list.find((p) => String(p.id) === String(id))
  if (!found || !canResubmit(found.status)) throw new Error('not-resubmittable')
  const now = new Date().toISOString()
  const next = {
    ...found,
    status: 'under_review',
    updatedAt: now,
    history: [...(found.history ?? []), entry('under_review', now, 'Resubmitted for review.', 'You')],
  }
  write(list.map((p) => (p === found ? next : p)))
  return next
}

export async function setConsent(id, granted) {
  await wait(400)
  const list = read()
  const found = list.find((p) => String(p.id) === String(id))
  if (!found || found.status === 'published') throw new Error('consent-locked')
  const now = new Date().toISOString()
  const next = { ...found, consent: { status: granted ? 'granted' : 'declined', at: now } }
  write(list.map((p) => (p === found ? next : p)))
  return next
}