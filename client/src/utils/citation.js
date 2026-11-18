const lastWord = (name) => name.trim().split(/\s+/).pop()

export function apaName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  const last = parts.pop()
  const initials = parts.map((p) => `${p[0].toUpperCase()}.`).join(' ')
  return initials ? `${last}, ${initials}` : last
}

export function apaAuthors(names) {
  const list = names.map(apaName)
  if (list.length <= 1) return list[0] ?? ''
  if (list.length === 2) return `${list[0]}, & ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, & ${list[list.length - 1]}`
}

export function shortAuthors(names) {
  if (names.length === 0) return ''
  return names.length === 1 ? names[0] : `${lastWord(names[0])} et al.`
}

export function apaCitation(paper) {
  const year = new Date(paper.publishedAt).getFullYear()
  return `${apaAuthors(paper.authors)} (${year}). ${paper.title}. CORE-V Research Vault.`
}