import { useCallback, useEffect, useState } from 'react'
import useToast from '../../context/useToast'
import { glass } from '../../components/dashboard/constants'
import ErrorBanner from '../../components/ui/ErrorBanner'
import StatTile from '../../components/ui/StatTile'
import {
  apiMessage,
  exportFileManifest,
  exportTableData,
  getBackupStatus,
  getLargestFiles,
  getStorageOrphans,
  getStorageSummary,
} from '../../services/adminService'
import { backendSupport, unsupportedNote } from '../../services/backendSupport'
import { toCsv, downloadCsv } from '../../utils/csv'
import { downloadJson } from '../../utils/downloadJson'
import { formatBytes } from '../../utils/formatBytes'
import { timeAgo } from '../../utils/formatDate'

const TABLES = [
  ['users', 'Users'],
  ['groups', 'Groups'],
  ['posts', 'Posts'],
  ['requests', 'Access requests'],
  ['audit', 'Audit log'],
]

const actionBtn =
  'rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/75 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'

const itemName = (item) => {
  if (typeof item === 'string') return item
  return item?.path ?? item?.file_name ?? item?.name ?? item?.record_id ?? JSON.stringify(item)
}

export default function ManageStorage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState(null)
  const [largest, setLargest] = useState([])
  const [orphans, setOrphans] = useState(null)
  const [backup, setBackup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    if (!backendSupport.adminStorage && !backendSupport.adminStorageBackup) return
    setLoading(true)
    setError('')
    const settled = await Promise.allSettled([
      backendSupport.adminStorage ? getStorageSummary() : Promise.resolve(null),
      backendSupport.adminStorage ? getLargestFiles(10) : Promise.resolve([]),
      backendSupport.adminStorage ? getStorageOrphans() : Promise.resolve(null),
      backendSupport.adminStorageBackup ? getBackupStatus() : Promise.resolve(null),
    ])
    const value = (index) => (settled[index].status === 'fulfilled' ? settled[index].value : null)
    setSummary(value(0))
    setLargest(value(1) ?? [])
    setOrphans(value(2))
    setBackup(value(3))
    const failed = settled.find((result) => result.status === 'rejected')
    setError(failed ? apiMessage(failed.reason, 'Some storage data could not be loaded.') : '')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const exportData = async (table, format) => {
    const key = `${table}:${format}`
    setBusy(key)
    try {
      const rows = await exportTableData(table)
      if (format === 'csv') {
        const headers = Object.keys(rows[0] ?? {})
        downloadCsv(`corev-${table}.csv`, toCsv(headers, rows.map((row) => headers.map((header) => row[header]))))
      } else {
        downloadJson(`corev-${table}.json`, rows)
      }
      toast(`${table} export downloaded.`)
    } catch (e) {
      toast(apiMessage(e, 'Could not export this data.'), 'error')
    } finally {
      setBusy('')
    }
  }

  const downloadManifest = async () => {
    setBusy('manifest')
    try {
      downloadJson('corev-file-manifest.json', await exportFileManifest())
      toast('File manifest downloaded.')
    } catch (e) {
      toast(apiMessage(e, 'Could not export the file manifest.'), 'error')
    } finally {
      setBusy('')
    }
  }

  const buckets = summary?.byBucket ?? summary?.by_bucket ?? []
  const totalBytes = Number(summary?.totalBytes ?? summary?.total_bytes ?? 0)
  const fileCount = Number(summary?.fileCount ?? summary?.file_count ?? 0)
  const largestRows = largest.map((file, index) => ({
    id: file.file_id ?? file.id ?? index,
    name: itemName(file),
    size: Number(file.size_bytes ?? file.size ?? 0),
    bucket: file.bucket ?? '—',
    modified: file.updated_at ?? file.created_at ?? null,
  }))
  const missing = orphans?.missingFiles ?? orphans?.missing_files ?? []
  const orphaned = orphans?.orphanedRecords ?? orphans?.orphaned_records ?? []
  const lastBackup = backup?.lastBackupAt ?? backup?.last_backup_at ?? null
  const exportDisabled = !backendSupport.adminStorageBackup || Boolean(busy)

  return (
    <div className="space-y-6 font-display sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Storage</h1>
        <p className="mt-1 text-sm text-white/60">Usage and backups for the files CORE V keeps.</p>
      </header>

      {!backendSupport.adminStorage && <p className="text-sm text-white/55">{unsupportedNote.adminStorage}</p>}
      {!backendSupport.adminStorageBackup && <p className="text-sm text-white/55">{unsupportedNote.adminStorageBackup}</p>}

      <ErrorBanner message={error} onRetry={load} />

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-panel" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-panel" />
        </div>
      )}

      {!loading && (
        <>
          {backendSupport.adminStorage && (
            <>
              <section aria-label="Storage usage" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Total used" value={formatBytes(totalBytes)} />
                <StatTile label="Files" value={fileCount} />
                <StatTile label="Buckets" value={buckets.length} />
                <StatTile label="Largest file" value={formatBytes(largestRows[0]?.size ?? 0)} />
              </section>

              <section className={`${glass} p-4 sm:p-5`}>
                <h2 className="text-base font-bold">Largest files</h2>
                {largestRows.length === 0 ? (
                  <p className="mt-3 text-sm text-white/55">No files were reported.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                          <th scope="col" className="px-3 py-2 font-semibold">File</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Bucket</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Size</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Modified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {largestRows.map((file) => (
                          <tr key={file.id} className="border-b border-white/5 last:border-0">
                            <td className="wrap-break-word px-3 py-2 text-white/85">{file.name}</td>
                            <td className="px-3 py-2 text-white/65">{file.bucket}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-white/75">{formatBytes(file.size)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-white/65">{file.modified ? timeAgo(file.modified) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className={`${glass} p-4 sm:p-5`}>
                <h2 className="text-base font-bold">Missing or orphaned files</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Missing files', missing],
                    ['Orphaned records', orphaned],
                  ].map(([label, items]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/55">{label}: {items.length}</p>
                      {items.length === 0 ? (
                        <p className="mt-2 text-sm text-white/60">None reported.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-xs text-white/75">
                          {items.slice(0, 20).map((item, index) => (
                            <li key={index} className="wrap-break-word">{itemName(item)}</li>
                          ))}
                          {items.length > 20 && <li className="text-white/50">+{items.length - 20} more</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {backendSupport.adminStorageBackup && (
            <section className={`${glass} p-4 sm:p-5`}>
              <h2 className="text-base font-bold">Backup &amp; recovery</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Last backup" value={lastBackup ? timeAgo(lastBackup) : '—'} note={lastBackup ? new Date(lastBackup).toLocaleString() : undefined} />
                <StatTile label="Provider" value={backup?.provider ?? '—'} />
                <StatTile label="Frequency" value={backup?.frequency ?? '—'} />
                <StatTile label="Retention" value={backup?.retention ?? '—'} />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold">Export data</h3>
                  <ul className="mt-2 divide-y divide-white/10">
                    {TABLES.map(([table, label]) => (
                      <li key={table} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="text-sm text-white/75">{label}</span>
                        <span className="flex gap-2">
                          <button
                            type="button"
                            disabled={exportDisabled}
                            onClick={() => exportData(table, 'csv')}
                            className={actionBtn}
                          >
                            {busy === `${table}:csv` ? 'Working…' : 'CSV'}
                          </button>
                          <button
                            type="button"
                            disabled={exportDisabled}
                            onClick={() => exportData(table, 'json')}
                            className={actionBtn}
                          >
                            {busy === `${table}:json` ? 'Working…' : 'JSON'}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold">File manifest</h3>
                  <button
                    type="button"
                    disabled={exportDisabled}
                    onClick={downloadManifest}
                    className={`${actionBtn} mt-2 h-11 px-4 text-sm`}
                  >
                    {busy === 'manifest' ? 'Working…' : 'Download manifest'}
                  </button>
                  <p className="mt-2 text-xs text-white/55">Download links expire after the configured access-link period, and exports are written to the audit log.</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className={`${glass} p-4 sm:p-5`}>
        <h2 className="text-base font-bold">Upload policy</h2>
        <p className="mt-2 text-sm text-white/65">Settings currently show a 20 MB limit with PDF and DOCX enabled. These limits are managed on the Settings page, not here.</p>
        <p className="mt-1 text-sm text-white/65">Paper files are never deleted from this screen. They can only be archived by the group adviser.</p>
      </section>

      <section className={`${glass} p-4 sm:p-5`}>
        <h2 className="text-base font-bold">Restore guidance</h2>
        <p className="mt-2 text-sm text-white/65">Restoring the database is an operations task. Contact your system administrator and follow the backup runbook; there is no restore action here.</p>
      </section>
    </div>
  )
}
