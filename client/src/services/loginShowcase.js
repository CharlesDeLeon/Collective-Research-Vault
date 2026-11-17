import { galleryPapers } from './galleryData'
import { FALLBACK_CARDS } from '../components/login/fallbackCards'

export const MIN_CARDS = 6
export const MAX_CARDS = 12

export async function getShowcaseCards() {
  const real = galleryPapers.map((p) => ({ ...p, featured: Boolean(p.featured) }))
  if (real.length >= MIN_CARDS) return real.slice(0, MAX_CARDS)
  const taken = new Set(real.map((c) => c.title))
  const filler = FALLBACK_CARDS.filter((c) => !taken.has(c.title))
  return [...real, ...filler].slice(0, MIN_CARDS)
}