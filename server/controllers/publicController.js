const crypto = require('crypto')
const { query } = require('../config/db')

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newRef() {
  const code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
  return `CV-${code}`
}

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex') }
function newToken() { return crypto.randomBytes(32).toString('hex') }

const normalizePaper = (row) => ({
  id: row.submission_id,
  slug: row.slug,
  title: row.title,
  authors: row.authors ? row.authors.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
  abstract: row.abstract,
  keywords: row.keywords ? row.keywords.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
  strand: row.strand || row.program,
  section: row.section,
  schoolYear: row.school_year,
  adviser: row.adviser_name || null,
  publishedAt: row.published_at || row.updated_at || row.created_at,
  featured: !!row.featured,
  citation: row.citation || null,
})

// GET /api/public/papers
const listPapers = async (req, res) => {
  try {
    const { strand, section, year, q, featured, limit = 50, offset = 0 } = req.query
    let sql = `SELECT s.*, u.name AS adviser_name
               FROM submissions s
               LEFT JOIN users u ON u.user_id = s.submitted_by
               WHERE (s.is_published = TRUE OR s.status = 'published')`
    const params = []
    if (strand) { sql += ` AND (s.strand = ? OR s.program = ?)`; params.push(strand, strand) }
    if (section) { sql += ` AND s.section = ?`; params.push(section) }
    if (year) { sql += ` AND s.school_year = ?`; params.push(year) }
    if (featured === 'true') { sql += ` AND s.featured = TRUE` }
    if (q) {
      sql += ` AND (s.title ILIKE ? OR s.abstract ILIKE ? OR s.keywords ILIKE ? OR s.authors ILIKE ?)`
      const t = `%${q}%`; params.push(t, t, t, t)
    }
    sql += ` ORDER BY s.published_at DESC NULLS LAST, s.updated_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), Number(offset))

    const [rows] = await query(sql, params)
    res.json({ data: rows.map(normalizePaper) })
  } catch (err) {
    console.error('listPapers error:', err)
    res.status(500).json({ message: 'Failed to fetch papers' })
  }
}

// GET /api/public/papers/:slug
const getPaper = async (req, res) => {
  try {
    const { slug } = req.params
    const [rows] = await query(
      `SELECT s.*, u.name AS adviser_name
       FROM submissions s
       LEFT JOIN users u ON u.user_id = s.submitted_by
       WHERE s.slug = ? AND (s.is_published = TRUE OR s.status = 'published')`,
      [slug]
    )
    if (!rows.length) return res.status(404).json({ message: 'Paper not found' })
    res.json({ data: normalizePaper(rows[0]) })
  } catch (err) {
    console.error('getPaper error:', err)
    res.status(500).json({ message: 'Failed to fetch paper' })
  }
}

// POST /api/public/access-requests
const submitAccessRequest = async (req, res) => {
  try {
    const { paperSlug, name, email, institution, purpose } = req.body
    if (!paperSlug || !name || !email) {
      return res.status(400).json({ message: 'paperSlug, name, and email are required' })
    }
    const [papers] = await query(
      `SELECT submission_id FROM submissions WHERE slug = ? AND (is_published = TRUE OR status = 'published')`,
      [paperSlug]
    )
    if (!papers.length) return res.status(404).json({ message: 'Paper not found' })

    const submissionId = papers[0].submission_id

    // Generate unique reference code
    let ref
    for (let i = 0; i < 10; i++) {
      ref = newRef()
      const [existing] = await query('SELECT 1 FROM paper_access_requests WHERE reference_code = ?', [ref])
      if (!existing.length) break
    }

    const [result] = await query(
      `INSERT INTO paper_access_requests (submission_id, name, email, institution, purpose, reference_code, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending') RETURNING request_id`,
      [submissionId, name, email, institution || null, purpose || null, ref]
    )
    const requestId = result[0]?.request_id || result.insertId

    // Log
    await query(
      `INSERT INTO paper_access_logs (request_id, submission_id, action, ip, user_agent)
       VALUES (?, ?, 'request_submitted', ?, ?)`,
      [requestId, submissionId, req.ip || null, req.get('user-agent') || null]
    )

    res.status(201).json({ data: { ref, requestId } })
  } catch (err) {
    console.error('submitAccessRequest error:', err)
    res.status(500).json({ message: 'Failed to submit access request' })
  }
}

// GET /api/public/access/status/:ref
const getRequestStatus = async (req, res) => {
  try {
    const { ref } = req.params
    const [rows] = await query(
      `SELECT r.request_id, r.status, r.decision_note, r.created_at, r.updated_at,
              s.slug AS paper_slug, s.title AS paper_title
       FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE r.reference_code = ?`,
      [ref]
    )
    if (!rows.length) return res.status(404).json({ message: 'Request not found' })

    const r = rows[0]
    // Check if there's an active link
    const [links] = await query(
      `SELECT link_id, expires_at, used_at, revoked_at FROM paper_access_links
       WHERE request_id = ? ORDER BY created_at DESC LIMIT 1`,
      [r.request_id]
    )
    let linkStatus = null
    if (links.length) {
      const l = links[0]
      if (l.revoked_at) linkStatus = 'revoked'
      else if (l.used_at) linkStatus = 'used'
      else if (new Date(l.expires_at) < new Date()) linkStatus = 'expired'
      else linkStatus = 'active'
    }

    res.json({
      data: {
        ref,
        status: r.status,
        decisionNote: r.decision_note,
        paperSlug: r.paper_slug,
        paperTitle: r.paper_title,
        createdAt: r.created_at,
        linkStatus,
      },
    })
  } catch (err) {
    console.error('getRequestStatus error:', err)
    res.status(500).json({ message: 'Failed to fetch request status' })
  }
}

// GET /api/public/access/:token
const confirmLink = async (req, res) => {
  try {
    const { token } = req.params
    const hash = sha256(token)
    const [rows] = await query(
      `SELECT l.link_id, l.expires_at, l.used_at, l.revoked_at, l.submission_id,
              s.slug AS paper_slug
       FROM paper_access_links l
       JOIN submissions s ON s.submission_id = l.submission_id
       WHERE l.token_hash = ?`,
      [hash]
    )
    if (!rows.length) return res.json({ data: { state: 'invalid', paperSlug: null } })

    const l = rows[0]
    let state = 'valid'
    if (l.revoked_at) state = 'revoked'
    else if (l.used_at) state = 'used'
    else if (new Date(l.expires_at) < new Date()) state = 'expired'

    res.json({ data: { state, paperSlug: l.paper_slug } })
  } catch (err) {
    console.error('confirmLink error:', err)
    res.status(500).json({ message: 'Failed to confirm link' })
  }
}

// GET /api/public/access/:token/view
const consumeLink = async (req, res) => {
  try {
    const { token } = req.params
    const hash = sha256(token)
    const [rows] = await query(
      `SELECT l.link_id, l.request_id, l.submission_id, l.expires_at, l.used_at, l.revoked_at,
              s.slug AS paper_slug
       FROM paper_access_links l
       JOIN submissions s ON s.submission_id = l.submission_id
       WHERE l.token_hash = ?`,
      [hash]
    )
    if (!rows.length) return res.json({ data: { state: 'invalid', paperSlug: null, fileUrl: '' } })

    const l = rows[0]
    if (l.revoked_at) {
      await logAccess(l, 'download_denied_revoked', req)
      return res.json({ data: { state: 'revoked', paperSlug: l.paper_slug, fileUrl: '' } })
    }
    if (l.used_at) {
      await logAccess(l, 'download_denied_used', req)
      return res.json({ data: { state: 'used', paperSlug: l.paper_slug, fileUrl: '' } })
    }
    if (new Date(l.expires_at) < new Date()) {
      await logAccess(l, 'download_denied_expired', req)
      return res.json({ data: { state: 'expired', paperSlug: l.paper_slug, fileUrl: '' } })
    }

    // Mark used (single-use) — atomic
    const [upd] = await query(
      `UPDATE paper_access_links SET used_at = NOW() WHERE link_id = ? AND used_at IS NULL RETURNING link_id`,
      [l.link_id]
    )
    if (!upd.length) {
      // Race condition: already used
      await logAccess(l, 'download_denied_used', req)
      return res.json({ data: { state: 'used', paperSlug: l.paper_slug, fileUrl: '' } })
    }

    // Get the file path
    const [versions] = await query(
      `SELECT file_path FROM document_versions WHERE submission_id = ? ORDER BY uploaded_at DESC LIMIT 1`,
      [l.submission_id]
    )
    const filePath = versions.length ? versions[0].file_path : null
    const fileUrl = filePath ? `/uploads/${filePath.replace(/^.*\//, '')}` : ''

    await logAccess(l, 'download_success', req)

    // Update request status to reflect access
    await query(
      `UPDATE paper_access_requests SET status = 'accessed', updated_at = NOW() WHERE request_id = ?`,
      [l.request_id]
    )

    res.json({ data: { state: 'success', paperSlug: l.paper_slug, fileUrl } })
  } catch (err) {
    console.error('consumeLink error:', err)
    res.status(500).json({ message: 'Failed to access paper' })
  }
}

async function logAccess(link, action, req) {
  try {
    await query(
      `INSERT INTO paper_access_logs (link_id, request_id, submission_id, action, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [link.link_id, link.request_id, link.submission_id, action, req.ip || null, req.get('user-agent') || null]
    )
  } catch (e) {
    console.error('logAccess error:', e)
  }
}

module.exports = {
  listPapers, getPaper, submitAccessRequest, getRequestStatus, confirmLink, consumeLink,
}