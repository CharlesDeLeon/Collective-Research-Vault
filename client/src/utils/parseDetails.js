export const parseDetails = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
