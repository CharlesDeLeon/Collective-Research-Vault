import './belt.css'
import { cardClass, GalleryCardBody } from '../gallery/GalleryCard'

const COLUMNS = 3

function splitColumns(cards) {
  const cols = Array.from({ length: COLUMNS }, () => [])
  cards.forEach((c, i) => cols[i % COLUMNS].push(c))
  return cols.filter((c) => c.length)
}

export default function ShowcaseBelt({ cards }) {
  const columns = splitColumns(cards)
  return (
    <div
      className="pointer-events-none absolute -inset-32 flex -rotate-[22deg] scale-125 select-none gap-5"
      aria-hidden="true"
    >
      {columns.map((col, i) => (
        <div key={i} className="w-1/3">
          <div className={`flex flex-col ${i % 2 === 0 ? 'belt-up' : 'belt-down'}`}>
            {[0, 1].flatMap((pass) =>
              col.map((card) => (
                <div key={`${pass}-${card.id}`} className="pb-5">
                  <div className={cardClass(false, card.featured)}>
                    <GalleryCardBody paper={card} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}