const { query } = require('../config/db')

const listAnnouncements = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT a.*, u.name AS created_by_name
       FROM announcements a
       LEFT JOIN users u ON u.user_id = a.created_by
       ORDER BY a.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience = 'all', role, groupId } = req.body
    if (!title || !body) return res.status(400).json({ message: 'title and body are required' })

    const [result] = await query(
      `INSERT INTO announcements (title, body, audience, role, group_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING announcement_id`,
      [title, body, audience, role || null, groupId || null, req.user.user_id]
    )
    const id = result[0]?.announcement_id || result.insertId

    // Deliver to target users
    let userSql = `SELECT user_id FROM users WHERE is_active = TRUE`
    const userParams = []
    if (audience === 'role' && role) {
      userSql += ` AND role = ?`
      userParams.push(role)
    } else if (audience === 'group' && groupId) {
      userSql = `SELECT user_id FROM group_members WHERE group_id = ?`
      userParams.length = 0
      userParams.push(groupId)
    }
    const [users] = await query(userSql, userParams)
    for (const u of users) {
      await query(
        `INSERT INTO notifications (user_id, type, message) VALUES (?, 'system', ?)`,
        [u.user_id, `${title}: ${body}`]
      )
    }

    try {
      const audit = require('../utils/auditLogger')
      if (audit && audit.logAction) await audit.logAction(req.user.user_id, 'send_announcement', 'announcement', id, { title, audience })
    } catch (e) { console.error(e) }

    res.status(201).json({ message: 'Announcement sent', id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { listAnnouncements, createAnnouncement }