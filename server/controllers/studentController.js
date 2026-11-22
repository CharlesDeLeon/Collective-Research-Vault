const { query } = require('../config/db')

// GET /api/student/access-requests — list requests matching the logged-in user's email
const listAccessRequests = async (req, res) => {
  try {
    const email = req.user.email
    if (!email) return res.status(400).json({ message: 'No email on account' })

    const [rows] = await query(
      `SELECT r.request_id, r.submission_id, r.name, r.email, r.institution, r.purpose,
              r.status, r.reference_code, r.decision_note, r.created_at, r.updated_at,
              s.title AS paper_title, s.slug AS paper_slug,
              rg.group_name
       FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       LEFT JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE LOWER(r.email) = LOWER(?)
       ORDER BY r.created_at DESC`,
      [email]
    )

    for (const r of rows) {
      const [links] = await query(
        `SELECT link_id, expires_at, used_at, revoked_at FROM paper_access_links
         WHERE request_id = ? ORDER BY created_at DESC LIMIT 1`,
        [r.request_id]
      )
      if (links.length) {
        const l = links[0]
        if (l.revoked_at) r.link_status = 'revoked'
        else if (l.used_at) r.link_status = 'used'
        else if (new Date(l.expires_at) < new Date()) r.link_status = 'expired'
        else r.link_status = 'active'
        r.link_id = l.link_id
        r.link_expires_at = l.expires_at
      } else {
        r.link_status = null
        r.link_id = null
        r.link_expires_at = null
      }
    }

    res.json({ data: rows })
  } catch (err) {
    console.error('listAccessRequests error:', err)
    res.status(500).json({ message: 'Failed to fetch access requests' })
  }
}

// POST /api/student/access-requests/:id/consume
const consumeAccessRequest = async (req, res) => {
  try {
    const email = req.user.email
    const { id } = req.params

    const [reqs] = await query(
      `SELECT r.request_id, r.submission_id, r.email, s.slug AS paper_slug
       FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE r.request_id = ? AND LOWER(r.email) = LOWER(?)`,
      [id, email]
    )
    if (!reqs.length) return res.status(404).json({ message: 'Request not found' })

    const r = reqs[0]

    const [links] = await query(
      `SELECT l.link_id, l.request_id, l.submission_id, l.expires_at, l.used_at, l.revoked_at
       FROM paper_access_links l
       WHERE l.request_id = ? ORDER BY l.created_at DESC LIMIT 1`,
      [id]
    )
    if (!links.length) return res.json({ data: { state: 'pending', paperSlug: r.paper_slug, fileUrl: '' } })

    const l = links[0]
    if (l.revoked_at) return res.json({ data: { state: 'revoked', paperSlug: r.paper_slug, fileUrl: '' } })
    if (l.used_at) return res.json({ data: { state: 'used', paperSlug: r.paper_slug, fileUrl: '' } })
    if (new Date(l.expires_at) < new Date()) return res.json({ data: { state: 'expired', paperSlug: r.paper_slug, fileUrl: '' } })

    const [upd] = await query(
      `UPDATE paper_access_links SET used_at = NOW() WHERE link_id = ? AND used_at IS NULL RETURNING link_id`,
      [l.link_id]
    )
    if (!upd.length) return res.json({ data: { state: 'used', paperSlug: r.paper_slug, fileUrl: '' } })

    const [versions] = await query(
      `SELECT file_path FROM document_versions WHERE submission_id = ? ORDER BY uploaded_at DESC LIMIT 1`,
      [l.submission_id]
    )
    const filePath = versions.length ? versions[0].file_path : null
    const fileUrl = filePath || ''

    await query(
      `INSERT INTO paper_access_logs (link_id, request_id, submission_id, action, ip, user_agent)
       VALUES (?, ?, ?, 'download_success', ?, ?)`,
      [l.link_id, l.request_id, l.submission_id, req.ip || null, req.get('user-agent') || null]
    )

    await query(
      `UPDATE paper_access_requests SET status = 'accessed', updated_at = NOW() WHERE request_id = ?`,
      [id]
    )

    res.json({ data: { state: 'success', paperSlug: r.paper_slug, fileUrl } })
  } catch (err) {
    console.error('consumeAccessRequest error:', err)
    res.status(500).json({ message: 'Failed to access paper' })
  }
}

module.exports = { listAccessRequests, consumeAccessRequest }