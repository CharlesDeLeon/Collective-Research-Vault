const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export function csvText(rows) {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename, rows) {
  const blob = new Blob(['﻿', csvText(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}