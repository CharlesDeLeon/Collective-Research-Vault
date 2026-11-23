const crypto = require('crypto')
const { query } = require('../config/db')
const { sendEmail } = require('../services/mailer')

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex') }
function newToken() { return crypto.randomBytes(32).toString('hex') }

// GET /api/adviser/access-requests
const listRequests = async (req, res) => {
  try {
    const { status, group, paper, dateFrom, dateTo, page = 1, limit = 25 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let sql = `
      SELECT r.*, s.title AS paper_title, s.slug AS paper_slug, s.group_id,
             rg.group_name, rg.adviser_id
      FROM paper_access_requests r
      JOIN submissions s ON s.submission_id = r.submission_id
      LEFT JOIN research_groups rg ON rg.group_id = s.group_id
      WHERE 1=1
    `
    const params = []

    if (status) { sql += ` AND r.status = ?`; params.push(status) }
    if (group) { sql += ` AND s.group_id = ?`; params.push(group) }
    if (paper) { sql += ` AND s.submission_id = ?`; params.push(paper) }
    if (dateFrom) { sql += ` AND r.created_at >= ?`; params.push(dateFrom) }
    if (dateTo) { sql += ` AND r.created_at <= ?`; params.push(dateTo) }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), offset)

    const [rows] = await query(sql, params)

    const countSql = `SELECT status, COUNT(*)::int AS c FROM paper_access_requests GROUP BY status`
    const [counts] = await query(countSql)
    const countMap = {}
    for (const c of counts) countMap[c.status] = c.c

    // Expired count: approved requests whose link has expired and is unused/revoked
    const [expiredRows] = await query(
      `SELECT COUNT(DISTINCT r.request_id)::int AS c
       FROM paper_access_requests r
       JOIN paper_access_links l ON l.request_id = r.request_id
       WHERE r.status = 'approved' AND l.expires_at < NOW() AND l.used_at IS NULL`
    )
    countMap.expired = expiredRows[0]?.c || 0

    res.json({ data: rows, counts: countMap })
  } catch (err) {
    console.error('listRequests error:', err)
    res.status(500).json({ message: 'Failed to fetch access requests' })
  }
}

// GET /api/adviser/access-requests/:id
const getRequest = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await query(
      `SELECT r.*, s.title AS paper_title, s.slug AS paper_slug, s.group_id,
              rg.group_name, rg.adviser_id
       FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       LEFT JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE r.request_id = ?`,
      [id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Request not found' })

    const r = rows[0]
    // Get link status
    const [links] = await query(
      `SELECT link_id, expires_at, used_at, revoked_at, created_at FROM paper_access_links
       WHERE request_id = ? ORDER BY created_at DESC`,
      [id]
    )
    res.json({ data: { ...r, links } })
  } catch (err) {
    console.error('getRequest error:', err)
    res.status(500).json({ message: 'Failed to fetch request' })
  }
}

// POST /api/adviser/access-requests/:id/approve
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { note } = req.body
    const userId = req.user.user_id

    const [rows] = await query(
      `SELECT r.*, s.title AS paper_title FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE r.request_id = ?`,
      [id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Request not found' })
    const r = rows[0]
    if (r.status !== 'pending' && r.status !== 'verified') {
      return res.status(400).json({ message: `Cannot approve a request with status: ${r.status}` })
    }

    // Generate token
    const token = newToken()
    const hash = sha256(token)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours

    const [linkResult] = await query(
      `INSERT INTO paper_access_links (request_id, submission_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?) RETURNING link_id`,
      [id, r.submission_id, hash, expiresAt]
    )
    const linkId = linkResult[0]?.link_id || linkResult.insertId

    // Update request
    await query(
      `UPDATE paper_access_requests SET status = 'approved', decided_by = ?, decision_note = ?, updated_at = NOW()
       WHERE request_id = ?`,
      [userId, note || null, id]
    )

    // Log
    await query(
      `INSERT INTO paper_access_logs (link_id, request_id, submission_id, action, ip, user_agent)
       VALUES (?, ?, ?, 'access_approved', ?, ?)`,
      [linkId, id, r.submission_id, req.ip || null, req.get('user-agent') || null]
    )

    const accessUrl = `${process.env.APP_URL || 'http://localhost:5173'}/access/${token}`
    const subject = `Your access request has been approved — CORE-V`
    const text = [
      `Hello ${r.name},`,
      '',
      `Your request to access "${r.paper_title || 'the paper'}" has been approved.`,
      '',
      `You can view the paper using this one-time link (valid for 72 hours):`,
      accessUrl,
      '',
      `This link works once. After you open it, it cannot be used again. If you need access again, submit a new request.`,
      '',
      `— CORE-V Research Vault`,
    ].join('\n')

    let delivery = { status: 'unknown', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: null, error: null }
    try {
      const result = await sendEmail({ to: r.email, subject, text })
      delivery = { status: result && result.ok ? 'sent' : 'failed', provider: (result && result.transport) || (process.env.MAIL_TRANSPORT || 'console'), sentAt: new Date().toISOString(), error: result && result.ok ? null : ((result && result.error) || null) }
    } catch (e) {
      delivery = { status: 'failed', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: new Date().toISOString(), error: e.message }
    }

    res.json({
      data: {
        requestId: r.request_id,
        linkId,
        token,
        expiresAt,
        status: 'approved',
        delivery,
      },
    })
  } catch (err) {
    console.error('approveRequest error:', err)
    res.status(500).json({ message: 'Failed to approve request' })
  }
}

// POST /api/adviser/access-requests/:id/decline
const declineRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { note } = req.body
    const userId = req.user.user_id

    const [rows] = await query('SELECT * FROM paper_access_requests WHERE request_id = ?', [id])
    if (!rows.length) return res.status(404).json({ message: 'Request not found' })

    await query(
      `UPDATE paper_access_requests SET status = 'declined', decided_by = ?, decision_note = ?, updated_at = NOW()
       WHERE request_id = ?`,
      [userId, note || null, id]
    )

    await query(
      `INSERT INTO paper_access_logs (request_id, submission_id, action, ip, user_agent)
       VALUES (?, ?, 'access_declined', ?, ?)`,
      [id, rows[0].submission_id, req.ip || null, req.get('user-agent') || null]
    )

    const r = rows[0]
    const subject = `Your access request was declined — CORE-V`
    const text = [
      `Hello ${r.name},`,
      '',
      `Your request to access a paper has been declined.`,
      note ? `Reason: ${note}` : '',
      '',
      `You can submit a new request at any time.`,
      '',
      `— CORE-V Research Vault`,
    ].join('\n')
    sendEmail({ to: r.email, subject, text }).catch(() => {})

    res.json({ message: 'Request declined', status: 'declined' })
  } catch (err) {
    console.error('declineRequest error:', err)
    res.status(500).json({ message: 'Failed to decline request' })
  }
}

// POST /api/adviser/access-links/:id/revoke
const revokeLink = async (req, res) => {
  try {
    const { id } = req.params
    await query('UPDATE paper_access_links SET revoked_at = NOW() WHERE link_id = ?', [id])
    res.json({ message: 'Link revoked' })
  } catch (err) {
    console.error('revokeLink error:', err)
    res.status(500).json({ message: 'Failed to revoke link' })
  }
}

// POST /api/adviser/access-requests/:id/resend
const resendRequest = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await query(
      `SELECT r.*, s.title AS paper_title FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE r.request_id = ?`, [id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Request not found' })
    const r = rows[0]
    if (r.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be resent' })
    }

    // Revoke prior unused links
    await query(
      `UPDATE paper_access_links SET revoked_at = NOW() WHERE request_id = ? AND used_at IS NULL AND revoked_at IS NULL`,
      [id]
    )

    const token = newToken()
    const hash = sha256(token)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
    const [linkResult] = await query(
      `INSERT INTO paper_access_links (request_id, submission_id, token_hash, expires_at) VALUES (?, ?, ?, ?) RETURNING link_id`,
      [id, r.submission_id, hash, expiresAt]
    )
    const linkId = linkResult[0]?.link_id || linkResult.insertId

    const accessUrl = `${process.env.APP_URL || 'http://localhost:5173'}/access/${token}`
    const subject = `Your access request has been approved — CORE-V`
    const text = [
      `Hello ${r.name},`,
      '',
      `Your request to access "${r.paper_title || 'the paper'}" has been approved.`,
      '',
      `You can view the paper using this one-time link (valid for 72 hours):`,
      accessUrl,
      '',
      `— CORE-V Research Vault`,
    ].join('\\n')

    let delivery = { status: 'unknown', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: null, error: null }
    try {
      const result = await sendEmail({ to: r.email, subject, text })
      delivery = { status: result && result.ok ? 'sent' : 'failed', provider: (result && result.transport) || (process.env.MAIL_TRANSPORT || 'console'), sentAt: new Date().toISOString(), error: result && result.ok ? null : ((result && result.error) || null) }
    } catch (e) {
      delivery = { status: 'failed', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: new Date().toISOString(), error: e.message }
    }

    res.json({ data: { requestId: r.request_id, linkId, expiresAt, delivery } })
  } catch (err) {
    console.error('resendRequest error:', err)
    res.status(500).json({ message: 'Failed to resend access link' })
  }
}

module.exports = {
  listRequests, getRequest, approveRequest, declineRequest, revokeLink, resendRequest,
}