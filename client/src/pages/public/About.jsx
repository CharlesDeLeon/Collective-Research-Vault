import { Link } from 'react-router-dom'
import GalleryNavbar from '../../components/gallery/GalleryNavbar'
import { SITE_INFO } from '../../utils/siteInfo'

const STEPS = [
  ['Browse', 'Search the vault by strand, section, school year, adviser or keyword.'],
  ['Request', 'Open a paper and ask for access. Tell us who you are and why you need it.'],
  ['Review', 'The paper’s adviser reviews your request and checks with the authors.'],
  ['Read', 'If approved, you get a one-time link by email that works for 72 hours.'],
]

export default function About() {
  const { contactEmail, contactOffice } = SITE_INFO
  return (
    <div className="min-h-screen bg-linear-to-br from-navy-900 to-navy-500 font-display text-white">
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
        <GalleryNavbar />
        <h1 className="mb-0 mt-6 text-[1.75rem] font-semibold leading-tight sm:text-[2.5rem]">About CORE-V</h1>
        <p className="mb-0 mt-4 max-w-3xl text-base leading-[1.75] text-white/90">
          CORE-V is the Collective Research Vault: a place where senior high school research is kept, reviewed by
          advisers and shared with readers. Anyone can browse titles, abstracts and keywords. Full papers are shared
          only with the authors’ permission.
        </p>

        <h2 className="mb-4 mt-10 text-xl font-semibold">How access works</h2>
        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-[1.25rem] border border-white/12 bg-field/40 p-5">
              <span className="text-sm font-bold text-gold">Step {i + 1}</span>
              <p className="mb-0 mt-1 text-lg font-semibold">{title}</p>
              <p className="mb-0 mt-1.5 text-[0.9375rem] leading-relaxed text-white/80">{text}</p>
            </li>
          ))}
        </ol>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Citing a paper</h2>
        <p className="m-0 max-w-3xl text-base leading-[1.75] text-white/90">
          Every paper page has a ready-made APA citation. You can copy it without requesting access.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Contact</h2>
        {contactEmail || contactOffice ? (
          <div className="grid gap-1 text-base leading-relaxed text-white/90">
            {contactOffice && <p className="m-0">{contactOffice}</p>}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="w-fit underline decoration-gold/60 underline-offset-2">
                {contactEmail}
              </a>
            )}
          </div>
        ) : (
          <p className="m-0 text-base text-white/75">Contact details will be added here.</p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/gallery"
            className="inline-flex min-h-12 items-center rounded-xl bg-linear-to-br from-gold to-gold-soft px-7 text-base font-semibold text-ink"
          >
            Browse the gallery
          </Link>
          <Link
            to="/access/status"
            className="inline-flex min-h-12 items-center rounded-xl border-[0.094rem] border-gold px-6 text-[0.9375rem] font-medium text-gold hover:bg-gold/10"
          >
            Check a request
          </Link>
        </div>
      </div>
    </div>
  )
}