    import './belt.css'

const TAGS = {
  BSIT: 'border-sky-300/50 bg-sky-300/20 text-sky-200',
  BSCS: 'border-violet-300/50 bg-violet-300/20 text-violet-200',
  BSEMC: 'border-emerald-300/50 bg-emerald-300/20 text-emerald-200',
}
const TAG_DEFAULT = 'border-indigo-200/50 bg-indigo-200/20 text-indigo-200'
const COLUMNS = 3

function splitColumns(cards) {
  const cols = Array.from({ length: COLUMNS }, () => [])
  cards.forEach((c, i) => cols[i % COLUMNS].push(c))
  return cols.filter((c) => c.length)
}

function BeltCard({ card }) {
  return (
    <div className="pb-5">
      <article
        className={`rounded-2xl border p-5 backdrop-blur-sm ${
          card.featured
            ? 'border-amber-300/80 bg-linear-to-br from-amber-300/30 to-white/10 shadow-[0_0.625rem_1.875rem_-0.75rem_rgb(251_191_36/0.55)]'
            : 'border-white/25 bg-white/14 shadow-[0_0.625rem_1.875rem_-0.75rem_rgb(15_25_90/0.5)]'
        }`}
      >
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.625rem] font-medium ${TAGS[card.program] ?? TAG_DEFAULT}`}
        >
          {card.program}
        </span>
        <h3 className="mb-0 mt-3 text-sm font-semibold leading-snug text-white">{card.title}</h3>
        <div className="mt-4 flex items-center justify-between gap-2 text-[0.6875rem] text-indigo-100/80">
          <span className="truncate">{card.authors}</span>
          {card.featured && <span className="shrink-0 text-amber-300">★ Featured</span>}
        </div>
      </article>
    </div>
  )
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
              col.map((card) => <BeltCard key={`${pass}-${card.id}`} card={card} />)
            )}
          </div>
        </div>
      ))}
    </div>
  )
}