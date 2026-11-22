const splitNames = (value) =>
  (Array.isArray(value) ? value : String(value ?? '').split(/[,;]| and /i))
    .map((n) => n.trim())
    .filter(Boolean)

const apaName = (fullName) => {
  const parts = fullName.trim().split(/\s+/)
  const last = parts.pop()
  const initials = parts.map((p) => `${p[0].toUpperCase()}.`).join(' ')
  return initials ? `${last}, ${initials}` : last
}

const joinAuthors = (names) => {
  const list = names.map(apaName)
  if (list.length <= 1) return list[0] ?? ''
  if (list.length === 2) return `${list[0]}, & ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, & ${list[list.length - 1]}`
}

export function submissionCitation(paper, publishedAt = new Date()) {
  if (!paper?.title) return ''
  const year = new Date(publishedAt).getFullYear()
  const authors = joinAuthors(splitNames(paper.authors))
  const lead = authors ? `${authors} (${year}).` : `(${year}).`
  return `${lead} ${paper.title}. CORE-V Research Vault.`
}