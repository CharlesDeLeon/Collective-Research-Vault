import GalleryCard from './GalleryCard'

export default function FeaturedRow({ papers }) {
  if (!papers.length) return null
  return (
    <section aria-labelledby="featured-h" className="mt-8 sm:mt-10">
      <div className="mb-4 flex items-center gap-3">
        <h2 id="featured-h" className="m-0 text-[1.375rem] font-semibold">
          Featured
        </h2>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">Chosen by admins</span>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {papers.map((p) => (
          <GalleryCard key={p.id} paper={p} featured />
        ))}
      </div>
    </section>
  )
}