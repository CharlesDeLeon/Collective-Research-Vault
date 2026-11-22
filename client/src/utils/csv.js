const BOM = '\uFEFF'

const cell = (value) => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename, content) {
  const url = URL.createObjectURL(new Blob([BOM, content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}