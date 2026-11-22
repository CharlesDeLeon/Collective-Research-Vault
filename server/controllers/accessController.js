const crypto = require('crypto')
const { query } = require('../config/db')

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex') }
function newToken() { return crypto.randomBytes(32).toString('hex') }

// GET /api/adviser/access-requests
const listRequests = async (req, res) => {
  try {
    const { status, group, paper, page = 1, limit = 25 } = req.query
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

    // All advisers (and admins) can see all access requests for all papers.
    // (No group scoping — any adviser may approve/decline any request.)

    if (status) { sql += ` AND r.status = ?`; params.push(status) }
    if (group) { sql += ` AND s.group_id = ?`; params.push(group) }
    if (paper) { sql += ` AND s.submission_id = ?`; params.push(paper) }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), offset)

    const [rows] = await query(sql, params)

    // Get counts (all requests — any adviser can see all)
    const countSql = `SELECT status, COUNT(*)::int AS c FROM paper_access_requests GROUP BY status`
    const [counts] = await query(countSql)
    const countMap = {}
    for (const c of counts) countMap[c.status] = c.c

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

    const [rows] = await query('SELECT * FROM paper_access_requests WHERE request_id = ?', [id])
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

    res.json({
      data: {
        requestId: r.request_id,
        linkId,
        token, // returned once; frontend should deliver via email or show
        expiresAt,
        status: 'approved',
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

module.exports = {
  listRequests, getRequest, approveRequest, declineRequest, revokeLink,
}