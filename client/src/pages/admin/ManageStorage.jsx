import { glass } from '../../components/dashboard/constants'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'

const PLANNED = [
  ['Usage summary', 'Total space used, by bucket, and the number of files.'],
  ['Largest files', 'The biggest files, so you can see what takes the most space.'],
  ['Missing or orphaned files', 'Files that exist without a record, and records without a file.'],
  ['Backup and recovery', 'Last backup time, how often backups run, and data exports with expiring download links.'],
]

export default function ManageStorage() {
  return (
    <div className="space-y-6 font-display">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Storage</h1>
        <p className="mt-1 text-sm text-white/60">Usage and backups for the files CORE V keeps.</p>
      </header>

      {!backendSupport.adminStorage && (
        <div className={`${glass} px-6 py-10 text-center`}>
          <p className="font-semibold">{unsupportedNote.adminStorage}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Nothing is hidden or deleted in the meantime. Paper files can only be archived, never deleted from here.
          </p>
        </div>
      )}

      <section aria-label="What this page will show" className="grid gap-3 sm:grid-cols-2">
        {PLANNED.map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-dashed border-white/15 p-5">
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-1 text-sm text-white/60">{text}</p>
          </div>
        ))}
      </section>

      <p className="text-xs text-white/50">Restoring the database is an operations task and is not done from this screen.</p>
    </div>
  )
}