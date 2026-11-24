const fs = require('fs')
const path = require('path')
const { query } = require('../config/db')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

const getSummary = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT COUNT(*)::int AS file_count, COALESCE(SUM(file_size),0)::bigint AS total_bytes
       FROM document_versions`
    )
    const r = rows[0] || {}
    // by bucket: group by top-level folder under uploads/
    const [buckets] = await query(
      `SELECT
         COALESCE(NULLIF(split_part(file_path, '/', 2), ''), 'root') AS bucket,
         COUNT(*)::int AS files,
         COALESCE(SUM(file_size),0)::bigint AS bytes
       FROM document_versions
       GROUP BY COALESCE(NULLIF(split_part(file_path, '/', 2), ''), 'root')`
    )
    res.json({
      totalBytes: Number(r.total_bytes || 0),
      fileCount: r.file_count || 0,
      total_bytes: Number(r.total_bytes || 0),
      file_count: r.file_count || 0,
      byBucket: buckets.map(b => ({ bucket: b.bucket, bytes: Number(b.bytes), files: b.files })),
      by_bucket: buckets.map(b => ({ bucket: b.bucket, bytes: Number(b.bytes), files: b.files })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getLargestFiles = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const [rows] = await query(
      `SELECT version_id AS id, version_id AS file_id, file_path AS path, file_name, file_name AS name,
              file_size AS size, file_size AS size_bytes, file_type, uploaded_at, uploaded_at AS created_at, uploaded_at AS updated_at
       FROM document_versions
       ORDER BY file_size DESC NULLS LAST
       LIMIT ?`,
      [limit]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getOrphans = async (req, res) => {
  try {
    // missingFiles: document_versions rows whose file is not on disk
    const [versions] = await query(`SELECT version_id, file_path FROM document_versions`)
    const missingFiles = []
    for (const v of versions) {
      const abs = path.isAbsolute(v.file_path) ? v.file_path : path.join(__dirname, '..', v.file_path)
      if (!fs.existsSync(abs)) missingFiles.push({ version_id: v.version_id, path: v.file_path })
    }
    // orphanedRecords: submissions with no file_path and no versions
    const [orphaned] = await query(
      `SELECT s.submission_id FROM submissions s
       WHERE s.file_path IS NULL
         AND NOT EXISTS (SELECT 1 FROM document_versions dv WHERE dv.submission_id = s.submission_id)`
    )
    res.json({
      missingFiles,
      missing_files: missingFiles,
      orphanedRecords: orphaned.map(o => o.submission_id),
      orphaned_records: orphaned.map(o => o.submission_id),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getBackupStatus = async (req, res) => {
  res.json({
    lastBackupAt: null,
    last_backup_at: null,
    provider: 'Supabase',
    frequency: 'daily',
    retention: '30 days',
  })
}

const exportTable = async (req, res) => {
  try {
    const { table } = req.params
    const allowed = { users: 'users', groups: 'research_groups', posts: 'forum_posts', requests: 'paper_access_requests', audit: 'audit_logs' }
    const t = allowed[table]
    if (!t) return res.status(400).json({ message: 'Unknown table' })
    const [rows] = await query(`SELECT * FROM ${t}`)
    // audit log the export
    try {
      const audit = require('../utils/auditLogger')
      if (audit && audit.logAction) await audit.logAction(req.user.user_id, 'export_data', 'storage', null, { table: t })
    } catch (e) { console.error(e) }
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getFileManifest = async (req, res) => {
  try {
    const [rows] = await query(`SELECT version_id, submission_id, file_path, file_name, file_size, file_type, uploaded_at FROM document_versions`)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getSummary, getLargestFiles, getOrphans, getBackupStatus, exportTable, getFileManifest,
}