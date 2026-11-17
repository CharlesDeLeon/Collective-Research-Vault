import { useEffect, useState } from 'react'
import { getShowcaseCards } from '../services/loginShowcase'
import { FALLBACK_CARDS } from '../components/login/fallbackCards'

export function useLoginShowcase() {
  const [cards, setCards] = useState(FALLBACK_CARDS)

  useEffect(() => {
    let active = true
    getShowcaseCards()
      .then((list) => {
        if (active && list.length) setCards(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return cards
}