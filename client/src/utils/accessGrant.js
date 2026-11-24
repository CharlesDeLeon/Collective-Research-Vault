const keyFor = (token) => `corev:access-grant:${token}`

export function writeAccessGrant(token, grant) {
  if (!token || !grant) return undefined
  try {
    sessionStorage.setItem(
      keyFor(token),
      JSON.stringify({
        paperSlug: grant.paperSlug || '',
        paperTitle: grant.paperTitle || '',
        fileUrl: grant.fileUrl || '',
      })
    )
  } catch {
    return undefined
  }
  return undefined
}

export function readAccessGrant(token) {
  if (!token) return null
  try {
    const raw = sessionStorage.getItem(keyFor(token))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return {
      paperSlug: typeof data.paperSlug === 'string' ? data.paperSlug : '',
      paperTitle: typeof data.paperTitle === 'string' ? data.paperTitle : '',
      fileUrl: typeof data.fileUrl === 'string' ? data.fileUrl : '',
    }
  } catch {
    return null
  }
}
