const LINKS = {
  'demo-token': { state: 'valid', paperSlug: 'ai-attendance-monitoring' },
  'used-token': { state: 'used', paperSlug: 'ai-attendance-monitoring' },
  'expired-token': { state: 'expired', paperSlug: 'ai-attendance-monitoring' },
  'revoked-token': { state: 'revoked', paperSlug: 'ai-attendance-monitoring' },
}

const consumed = new Set()
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const stateOf = (token) => {
  const link = LINKS[token]
  if (!link) return 'invalid'
  return link.state === 'valid' && consumed.has(token) ? 'used' : link.state
}

export async function getAccessLink(token) {
  await wait(300)
  return { state: stateOf(token), paperSlug: LINKS[token]?.paperSlug ?? null }
}

export async function consumeAccessLink(token) {
  await wait(300)
  const state = stateOf(token)
  if (state !== 'valid') return { state, paperSlug: LINKS[token]?.paperSlug ?? null, fileUrl: '' }
  consumed.add(token)
  return { state: 'success', paperSlug: LINKS[token].paperSlug, fileUrl: '' }
}