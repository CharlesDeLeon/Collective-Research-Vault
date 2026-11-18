const STORE_KEY = 'corev.accessRequests'
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const SEEDED = {
  'CV-APPROVED': {
    ref: 'CV-APPROVED',
    paperSlug: 'ai-attendance-monitoring',
    status: 'approved',
    createdAt: '2026-11-10T09:00:00+08:00',
    decidedAt: '2026-11-11T14:30:00+08:00',
    reason: '',
  },
  'CV-DECLINED': {
    ref: 'CV-DECLINED',
    paperSlug: 'blockchain-academic-records',
    status: 'declined',
    createdAt: '2026-11-08T10:15:00+08:00',
    decidedAt: '2026-11-09T11:00:00+08:00',
    reason: 'The authors have not agreed to share the full paper at this time.',
  },
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data))
  } catch {
    return
  }
}

function newRef() {
  const code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
  return `CV-${code}`
}

export async function submitAccessRequest(paperSlug, payload) {
  await wait(700)
  const ref = newRef()
  const store = readStore()
  store[ref] = {
    ref,
    paperSlug,
    status: 'pending',
    createdAt: new Date().toISOString(),
    decidedAt: null,
    reason: '',
    requester: payload,
  }
  writeStore(store)
  return { ref }
}

export async function getRequestStatus(ref) {
  await wait(400)
  const key = ref.trim().toUpperCase()
  return SEEDED[key] ?? readStore()[key] ?? null
}