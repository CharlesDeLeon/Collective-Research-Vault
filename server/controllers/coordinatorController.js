const db = require('../config/db')
const fs = require('fs')
const path = require('path')

async function ownsGroup(groupId, userId) {
  const [rows] = await db.query(
    `SELECT group_id FROM research_groups WHERE group_id = ? AND (adviser_id = ? OR created_by = ?)`,
    [groupId, userId, userId]
  )
  return rows.length > 0
}

// ─────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups
const getGroups = async (req, res) => {
  try {
    const { search, program, school_year } = req.query

    let sql = `
      SELECT
        rg.group_id,
        rg.group_name,
        rg.program,
        rg.school_year,
        rg.created_at,
        COUNT(DISTINCT gm.user_id)      AS member_count,
        COUNT(DISTINCT s.submission_id) AS submission_count
      FROM research_groups rg
      LEFT JOIN group_members gm ON rg.group_id = gm.group_id
      LEFT JOIN submissions   s  ON rg.group_id = s.group_id
      WHERE 1=1
    `
    const params = []

    if (search) {
      sql += ` AND rg.group_name LIKE ?`
      params.push(`%${search}%`)
    }
    if (program) {
      sql += ` AND rg.program = ?`
      params.push(program)
    }
    if (school_year) {
      sql += ` AND rg.school_year = ?`
      params.push(school_year)
    }

    sql += ` GROUP BY rg.group_id, rg.group_name, rg.program, rg.school_year, rg.created_at ORDER BY rg.created_at DESC`

    const [rows] = await db.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('getGroups error:', err)
    res.status(500).json({ message: 'Failed to fetch groups' })
  }
}

// GET /api/coordinator/groups/:id
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params

    const [[group]] = await db.query(
      `SELECT * FROM research_groups WHERE group_id = ?`, [id]
    )
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const [members] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.program, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.user_id
       WHERE gm.group_id = ?`, [id]
    )

    const [submissions] = await db.query(
      `SELECT submission_id, title, stage, status, created_at
       FROM submissions WHERE group_id = ?
       ORDER BY created_at DESC`, [id]
    )

    const [panel] = await db.query(
      `SELECT pa.assignment_id, pa.role_in_panel, pa.assigned_at,
              u.user_id, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [id]
    )

    res.json({ data: { ...group, members, submissions, panel } })
  } catch (err) {
    console.error('getGroupById error:', err)
    res.status(500).json({ message: 'Failed to fetch group' })
  }
}

// POST /api/coordinator/groups
const createGroup = async (req, res) => {
  try {
    const { group_name, program, school_year } = req.body
    const created_by = req.user.user_id  // ✅ FIXED: was req.user.id

    if (!group_name) return res.status(400).json({ message: 'Group name is required' })

    const [result] = await db.query(
      `INSERT INTO research_groups (group_name, program, school_year, created_by)
       VALUES (?, ?, ?, ?)
       RETURNING group_id`,
      [group_name, program || null, school_year || null, created_by]
    )
    res.status(201).json({ message: 'Group created', group_id: result.insertId })
  } catch (err) {
    console.error('createGroup error:', err)
    res.status(500).json({ message: 'Failed to create group' })
  }
}

// PUT /api/coordinator/groups/:id
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params
    const { group_name, program, school_year } = req.body

    const [result] = await db.query(
      `UPDATE research_groups SET group_name = ?, program = ?, school_year = ?
       WHERE group_id = ?`,
      [group_name, program || null, school_year || null, id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Group not found' })
    res.json({ message: 'Group updated' })
  } catch (err) {
    console.error('updateGroup error:', err)
    res.status(500).json({ message: 'Failed to update group' })
  }
}

// DELETE /api/coordinator/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await db.query(
      `DELETE FROM research_groups WHERE group_id = ?`, [id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Group not found' })
    res.json({ message: 'Group deleted' })
  } catch (err) {
    console.error('deleteGroup error:', err)
    res.status(500).json({ message: 'Failed to delete group' })
  }
}

// ─────────────────────────────────────────────
// GROUP MEMBERS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups/:id/members
const getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.program, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.user_id
       WHERE gm.group_id = ?`, [id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getGroupMembers error:', err)
    res.status(500).json({ message: 'Failed to fetch members' })
  }
}

// POST /api/coordinator/groups/:id/members
const addGroupMember = async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.body

    if (!user_id) return res.status(400).json({ message: 'user_id is required' })

    // Verify the user exists and is a student
    const [[user]] = await db.query(
      `SELECT user_id, role FROM users WHERE user_id = ? AND role = 'student' AND is_active = TRUE`,
      [user_id]
    )
    if (!user) return res.status(404).json({ message: 'Active student not found' })

    await db.query(
      `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
      [id, user_id]
    )
    res.status(201).json({ message: 'Member added' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Student is already in this group' })
    }
    console.error('addGroupMember error:', err)
    res.status(500).json({ message: 'Failed to add member' })
  }
}

// DELETE /api/coordinator/groups/:id/members/:userId
const removeGroupMember = async (req, res) => {
  try {
    const { id, userId } = req.params
    const [result] = await db.query(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, [id, userId]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found' })
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error('removeGroupMember error:', err)
    res.status(500).json({ message: 'Failed to remove member' })
  }
}

// ─────────────────────────────────────────────
// PANEL ASSIGNMENTS
// ─────────────────────────────────────────────

// GET /api/coordinator/groups/:id/panel
const getPanel = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.query(
      `SELECT pa.assignment_id, pa.role_in_panel, pa.assigned_at,
              u.user_id, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getPanel error:', err)
    res.status(500).json({ message: 'Failed to fetch panel' })
  }
}

// POST /api/coordinator/groups/:id/panel
const assignPanel = async (req, res) => {
  try {
    const { id } = req.params
    const { faculty_id, role_in_panel } = req.body
    const assigned_by = req.user.user_id  // ✅ FIXED: was req.user.id

    if (!faculty_id || !role_in_panel) {
      return res.status(400).json({ message: 'faculty_id and role_in_panel are required' })
    }
    if (!['adviser', 'panelist'].includes(role_in_panel)) {
      return res.status(400).json({ message: 'role_in_panel must be adviser or panelist' })
    }

    // Verify faculty exists
    const [[faculty]] = await db.query(
      `SELECT user_id FROM users WHERE user_id = ? AND role = 'adviser' AND is_active = TRUE`,
      [faculty_id]
    )
    if (!faculty) return res.status(404).json({ message: 'Active adviser not found' })

    await db.query(
      `INSERT INTO panel_assignments (group_id, faculty_id, role_in_panel, assigned_by)
       VALUES (?, ?, ?, ?)`,
      [id, faculty_id, role_in_panel, assigned_by]
    )

    // Notify the faculty member
    await db.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES (?, 'assignment', ?)`,
      [faculty_id, `You have been assigned as ${role_in_panel} for a research group.`]
    )

    res.status(201).json({ message: 'Faculty assigned to panel' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Faculty already assigned to this panel with that role' })
    }
    console.error('assignPanel error:', err)
    res.status(500).json({ message: 'Failed to assign panel' })
  }
}

// DELETE /api/coordinator/panel/:assignmentId
const removeFromPanel = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const [result] = await db.query(
      `DELETE FROM panel_assignments WHERE assignment_id = ?`, [assignmentId]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found' })
    res.json({ message: 'Removed from panel' })
  } catch (err) {
    console.error('removeFromPanel error:', err)
    res.status(500).json({ message: 'Failed to remove from panel' })
  }
}

// GET /api/coordinator/faculty  (for dropdowns)
const getFacultyList = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, email FROM users
       WHERE role = 'adviser' AND is_active = TRUE
       ORDER BY name ASC`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('getFacultyList error:', err)
    res.status(500).json({ message: 'Failed to fetch advisers' })
  }
}

// GET /api/coordinator/students  (for dropdowns)
const getStudentList = async (req, res) => {
  try {
    const { search } = req.query
    let sql = `SELECT user_id, name, email, program FROM users WHERE role = 'student' AND is_active = TRUE`
    const params = []
    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }
    sql += ` ORDER BY name ASC`
    const [rows] = await db.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('getStudentList error:', err)
    res.status(500).json({ message: 'Failed to fetch students' })
  }
}

// ─────────────────────────────────────────────
// SUBMISSIONS / WORKFLOW
// ─────────────────────────────────────────────

// GET /api/coordinator/submissions
const getSubmissions = async (req, res) => {
  try {
    const { stage, status, program, search, groupId, strand, section, page = 1, limit = 25 } = req.query
    const offset = (page - 1) * limit
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()

    let sql = `
      SELECT
        s.submission_id, s.title, s.stage, s.status,
        s.program, s.strand, s.section, s.school_year, s.created_at, s.updated_at,
        rg.group_name, rg.group_id,
        u.name AS submitted_by_name,
        COUNT(DISTINCT dv.version_id) AS version_count
      FROM submissions s
      JOIN research_groups rg ON s.group_id = rg.group_id
      JOIN users u ON s.submitted_by = u.user_id
      LEFT JOIN document_versions dv ON s.submission_id = dv.submission_id
      WHERE 1=1
    `
    const params = []

    if (role === 'adviser') {
      sql += ` AND (rg.adviser_id = ? OR rg.created_by = ?)`
      params.push(userId, userId)
    }

    if (stage)   { sql += ` AND s.stage = ?`;   params.push(stage) }
    if (status)  { sql += ` AND s.status = ?`;  params.push(status) }
    if (program) { sql += ` AND s.program = ?`; params.push(program) }
    if (strand)  { sql += ` AND (s.strand = ? OR s.program = ?)`; params.push(strand, strand) }
    if (section) { sql += ` AND s.section = ?`; params.push(section) }
    if (groupId) { sql += ` AND s.group_id = ?`; params.push(groupId) }
    if (search)  { sql += ` AND (s.title LIKE ? OR s.authors LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }

    sql += ` GROUP BY s.submission_id, rg.group_name, rg.group_id, u.name, s.title, s.stage, s.status, s.program, s.strand, s.section, s.school_year, s.created_at, s.updated_at ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`
    params.push(Number(limit), Number(offset))

    const [rows] = await db.query(sql, params)

    let countSql = `SELECT COUNT(*) AS total FROM submissions s JOIN research_groups rg ON s.group_id = rg.group_id WHERE 1=1`
    const countParams = []
    if (role === 'adviser') {
      countSql += ` AND (rg.adviser_id = ? OR rg.created_by = ?)`
      countParams.push(userId, userId)
    }
    if (stage)   { countSql += ` AND s.stage = ?`;   countParams.push(stage) }
    if (status)  { countSql += ` AND s.status = ?`;  countParams.push(status) }
    if (program) { countSql += ` AND s.program = ?`; countParams.push(program) }
    if (strand)  { countSql += ` AND (s.strand = ? OR s.program = ?)`; countParams.push(strand, strand) }
    if (section) { countSql += ` AND s.section = ?`; countParams.push(section) }
    if (groupId) { countSql += ` AND s.group_id = ?`; countParams.push(groupId) }
    if (search)  { countSql += ` AND (s.title LIKE ? OR s.authors LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`) }

    const [[{ total }]] = await db.query(countSql, countParams)

    res.json({ data: rows, pagination: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    console.error('getSubmissions error:', err)
    res.status(500).json({ message: 'Failed to fetch submissions' })
  }
}

// GET /api/coordinator/submissions/:id
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()

    const [[submission]] = await db.query(
      `SELECT s.submission_id, s.group_id, s.title, s.abstract, s.keywords, s.authors,
              s.program, s.strand, s.section, s.year_level, s.school_year, s.stage, s.status,
              s.is_published, s.public_visible, s.featured, s.slug, s.citation,
              s.author_consent_at, s.consent_status, s.consent_at, s.video_url,
              s.file_path, s.file_name, s.adviser_name, s.published_at, s.submitted_by,
              s.created_at, s.updated_at,
              rg.group_name, rg.adviser_id, rg.created_by, u.name AS submitted_by_name
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       JOIN users u ON s.submitted_by = u.user_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })

    if (role === 'adviser' && submission.adviser_id !== userId && submission.created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    const [versions] = await db.query(
      `SELECT dv.version_id, dv.submission_id, dv.file_path, dv.file_name, dv.file_size,
              dv.file_type, dv.version_number, dv.uploaded_by, dv.uploaded_at,
              u.name AS uploaded_by_name
       FROM document_versions dv
       JOIN users u ON dv.uploaded_by = u.user_id
       WHERE dv.submission_id = ?
       ORDER BY dv.version_number DESC`, [id]
    )

    const [reviews] = await db.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.submission_id = ?`, [id]
    )

    const [comments] = await db.query(
      `SELECT rc.*, u.name AS author_name
       FROM review_comments rc
       JOIN users u ON rc.author_id = u.user_id
       WHERE rc.submission_id = ?
       ORDER BY rc.created_at ASC`, [id]
    )

    const [panel] = await db.query(
      `SELECT pa.role_in_panel, u.name, u.email
       FROM panel_assignments pa
       JOIN users u ON pa.faculty_id = u.user_id
       WHERE pa.group_id = ?`, [submission.group_id]
    )

    // Status history
    const [historyRows] = await db.query(
      `SELECT status, note, changed_by, created_at
       FROM submission_status_history
       WHERE submission_id = ?
       ORDER BY created_at ASC`, [id]
    )
    const statusHistory = historyRows.map((h) => ({ status: h.status, note: h.note, at: h.created_at, by: h.changed_by }))
    const actorIds = [...new Set(statusHistory.map((h) => h.by).filter(Boolean))]
    let actorNames = {}
    if (actorIds.length) {
      const placeholders = actorIds.map(() => '?').join(',')
      const [actors] = await db.query(`SELECT user_id, name FROM users WHERE user_id IN (${placeholders})`, actorIds)
      actorNames = actors.reduce((acc, u) => { acc[u.user_id] = u.name; return acc }, {})
    }
    statusHistory.forEach((h) => { h.by = actorNames[h.by] || h.by })

    res.json({ data: { ...submission, versions, reviews, comments, panel, statusHistory, status_history: statusHistory } })
  } catch (err) {
    console.error('getSubmissionById error:', err)
    res.status(500).json({ message: 'Failed to fetch submission' })
  }
}

// PATCH /api/coordinator/submissions/:id/stage
const updateStage = async (req, res) => {
  try {
    const { id } = req.params
    const { stage } = req.body

    const validStages = ['proposal', 'defense', 'final_submission']
    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: 'Invalid stage value' })
    }

    const [[submission]] = await db.query(
      `SELECT s.submission_id, s.stage, s.status, s.group_id, s.title, rg.adviser_id, rg.created_by
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser' && submission.adviser_id !== userId && submission.created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    const stageOrder = { proposal: 0, defense: 1, final_submission: 2 }
    if (stageOrder[stage] <= stageOrder[submission.stage]) {
      return res.status(400).json({ message: `Cannot move backwards from ${submission.stage} to ${stage}` })
    }

    await db.query(
      `UPDATE submissions SET stage = ?, status = 'submitted', updated_at = NOW()
       WHERE submission_id = ?`,
      [stage, id]
    )

    // Write status history
    await db.query(
      `INSERT INTO submission_status_history (submission_id, status, note, changed_by)
       VALUES (?, 'submitted', ?, ?)`,
      [id, `Advanced to ${stage.replace('_', ' ')} stage`, req.user.user_id]
    )

    const [members] = await db.query(
      `SELECT user_id FROM group_members WHERE group_id = ?`, [submission.group_id]
    )
    if (members.length > 0) {
      const notifValues = members.map(m => [
        m.user_id,
        id,
        'status_change',
        `Your paper "${submission.title}" has advanced to the ${stage.replace('_', ' ')} stage.`
      ])
      const flatParams = notifValues.flat()
      const placeholders = notifValues
        .map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`)
        .join(', ')
      await db.query(
        `INSERT INTO notifications (user_id, submission_id, type, message) VALUES ${placeholders}`,
        flatParams
      )
    }

    res.json({ message: `Stage updated to ${stage}` })
  } catch (err) {
    console.error('updateStage error:', err)
    res.status(500).json({ message: 'Failed to update stage' })
  }
}

// PATCH /api/coordinator/submissions/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, note } = req.body

    const validStatuses = ['proposal', 'submitted', 'under_review', 'for_revision', 'needs_revision', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const [[submission]] = await db.query(
      `SELECT s.submission_id, s.group_id, s.title, rg.adviser_id, rg.created_by
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!submission) return res.status(404).json({ message: 'Submission not found' })
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser' && submission.adviser_id !== userId && submission.created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    await db.query(
      `UPDATE submissions SET status = ?, updated_at = NOW()
       WHERE submission_id = ?`,
      [status, id]
    )

    // Write status history
    await db.query(
      `INSERT INTO submission_status_history (submission_id, status, note, changed_by)
       VALUES (?, ?, ?, ?)`,
      [id, status, note || null, req.user.user_id]
    )

    const [members] = await db.query(
      `SELECT user_id FROM group_members WHERE group_id = ?`, [submission.group_id]
    )
    if (members.length > 0) {
      const notifValues = members.map(m => [
        m.user_id,
        id,
        'status_change',
        `Your paper "${submission.title}" status has been updated to: ${status.replace('_', ' ')}.`
      ])
      const flatParams = notifValues.flat()
      const placeholders = notifValues
        .map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`)
        .join(', ')
      await db.query(
        `INSERT INTO notifications (user_id, submission_id, type, message) VALUES ${placeholders}`,
        flatParams
      )
    }

    res.json({ message: `Status updated to ${status}` })
  } catch (err) {
    console.error('updateStatus error:', err)
    res.status(500).json({ message: 'Failed to update status' })
  }
}

// GET /api/coordinator/dashboard (adviser-scoped)
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id

    const [[{ total_groups }]]      = await db.query(`SELECT COUNT(*) AS total_groups FROM research_groups rg WHERE (rg.adviser_id = ? OR rg.created_by = ?)`, [userId, userId])
    const [[{ total_submissions }]] = await db.query(`SELECT COUNT(*) AS total_submissions FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id WHERE (rg.adviser_id = ? OR rg.created_by = ?)`, [userId, userId])
    const [[{ pending_review }]]    = await db.query(`SELECT COUNT(*) AS pending_review FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id WHERE s.status = 'submitted' AND (rg.adviser_id = ? OR rg.created_by = ?)`, [userId, userId])
    const [[{ published }]]         = await db.query(`SELECT COUNT(*) AS published FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id WHERE s.is_published = TRUE AND (rg.adviser_id = ? OR rg.created_by = ?)`, [userId, userId])

    const [by_status] = await db.query(
      `SELECT s.status, COUNT(*) AS count FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id WHERE (rg.adviser_id = ? OR rg.created_by = ?) GROUP BY s.status`,
      [userId, userId]
    )

    const [recent] = await db.query(
      `SELECT s.submission_id, s.title, s.status, s.updated_at, rg.group_name
       FROM submissions s
       JOIN research_groups rg ON s.group_id = rg.group_id
       WHERE (rg.adviser_id = ? OR rg.created_by = ?)
       ORDER BY s.updated_at DESC LIMIT 5`,
      [userId, userId]
    )

    const recent_activity = recent.map((r) => ({
      submission_id: r.submission_id,
      title: r.title,
      group_name: r.group_name,
      type: 'status_change',
      updated_at: r.updated_at,
    }))

    res.json({
      data: {
        total_groups,
        total_submissions,
        pending_review,
        published,
        by_status,
        recent_activity,
      }
    })
  } catch (err) {
    console.error('getDashboardStats error:', err)
    res.status(500).json({ message: 'Failed to fetch dashboard stats' })
  }
}


const uploadSubmissionFile = async (req, res) => {
  const { id } = req.params
  const userId = req.user.user_id
  const role = String(req.file ? '' : '').toLowerCase()
  const fileRole = (req.body.role_in_panel || req.body.file_role || 'final').toLowerCase()

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' })
  }

  try {
    const [subs] = await db.query(
      `SELECT s.submission_id, s.status, rg.adviser_id, rg.created_by
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!subs.length) return res.status(404).json({ message: 'Submission not found' })
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser' && subs[0].adviser_id !== userId && subs[0].created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }
    if (subs[0].status === 'published') {
      return res.status(409).json({ message: 'You cannot upload files to a published paper.' })
    }

    const [versionRows] = await db.query(
      'SELECT COALESCE(MAX(version_number), 0) AS latest_version FROM document_versions WHERE submission_id = ?',
      [id]
    )
    const nextVersion = Number(versionRows[0].latest_version) + 1

    const fileBuffer = fs.readFileSync(req.file.path)
    await db.query(
      `INSERT INTO document_versions (submission_id, file_path, file_name, file_size, file_type, version_number, uploaded_by, file_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, `uploads/${req.file.filename}`, req.file.originalname, req.file.size || null, req.file.mimetype || null, nextVersion, userId, fileBuffer]
    )

    // Keep the submission's "current file" in sync so the review page shows
    // the newly uploaded file instead of the student's original one.
    await db.query(
      `UPDATE submissions SET file_path = ?, file_name = ?, file_data = ?, updated_at = NOW() WHERE submission_id = ?`,
      [`uploads/${req.file.filename}`, req.file.originalname, fs.readFileSync(req.file.path), id]
    )

    res.status(201).json({ message: 'File uploaded', version: nextVersion, fileRole })
  } catch (err) {
    console.error('uploadSubmissionFile error:', err)
    res.status(500).json({ message: 'Failed to upload file' })
  }
}

// DELETE /api/coordinator/submissions/:id/files/:versionId
const deleteSubmissionFile = async (req, res) => {
  const { id, versionId } = req.params
  const userId = req.user.user_id
  const role = String(req.user?.role || '').toLowerCase()

  try {
    const [subs] = await db.query(
      `SELECT s.submission_id, s.status, s.file_path, rg.adviser_id, rg.created_by
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!subs.length) return res.status(404).json({ message: 'Submission not found' })
    const sub = subs[0]
    if (role === 'adviser' && sub.adviser_id !== userId && sub.created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }
    if (sub.status === 'published') {
      return res.status(409).json({ message: 'You cannot delete files from a published paper.' })
    }

    const [versions] = await db.query(
      `SELECT version_id, file_path, file_name, file_data FROM document_versions WHERE version_id = ? AND submission_id = ?`,
      [versionId, id]
    )
    if (!versions.length) return res.status(404).json({ message: 'File version not found' })
    const v = versions[0]

    // Delete the row
    await db.query(`DELETE FROM document_versions WHERE version_id = ?`, [versionId])

    // Best-effort remove the physical file from disk
    try {
      const abs = path.isAbsolute(v.file_path) ? v.file_path : path.join(__dirname, '..', v.file_path)
      if (fs.existsSync(abs)) fs.unlinkSync(abs)
    } catch (e) {
      console.warn('deleteSubmissionFile: could not remove file from disk:', e.message)
    }

    // If the deleted version was the "current" file, repoint submissions to the
    // next-latest version (or clear it if none remain).
    if (sub.file_path && sub.file_path === v.file_path) {
      const [remaining] = await db.query(
        `SELECT file_path, file_name, file_data FROM document_versions
         WHERE submission_id = ? ORDER BY version_number DESC LIMIT 1`, [id]
      )
      if (remaining.length) {
        await db.query(
          `UPDATE submissions SET file_path = ?, file_name = ?, file_data = ?, updated_at = NOW() WHERE submission_id = ?`,
          [remaining[0].file_path, remaining[0].file_name, remaining[0].file_data, id]
        )
      } else {
        await db.query(
          `UPDATE submissions SET file_path = NULL, file_name = NULL, file_data = NULL, updated_at = NOW() WHERE submission_id = ?`,
          [id]
        )
      }
    }

    res.json({ message: 'File deleted' })
  } catch (err) {
    console.error('deleteSubmissionFile error:', err)
    res.status(500).json({ message: 'Failed to delete file' })
  }
}

const publishSubmission = async (req, res) => {
  const { id } = req.params
  const { citation, featured } = req.body

  try {
    const [subs] = await db.query(
      `SELECT s.submission_id, s.status, s.group_id, s.consent_status, s.author_consent_at,
              rg.adviser_id, rg.created_by
       FROM submissions s
       JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!subs.length) return res.status(404).json({ message: 'Submission not found' })
    const sub = subs[0]
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser' && sub.adviser_id !== userId && sub.created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    if (sub.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved papers can be published' })
    }

    const [files] = await db.query(
      `SELECT COUNT(*)::int AS c FROM document_versions WHERE submission_id = ?`, [id]
    )
    if (!files[0] || files[0].c === 0) {
      return res.status(400).json({ message: 'Upload at least one file before publishing' })
    }

    if (sub.consent_status !== 'granted') {
      return res.status(409).json({ message: 'Author consent is required before publishing' })
    }

    // Generate slug if missing
    const [[sub2]] = await db.query(`SELECT title, slug, authors, school_year FROM submissions WHERE submission_id = ?`, [id])
    let slug = sub2.slug
    if (!slug) {
      slug = (sub2.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    // Auto-generate APA 7 citation if not provided
    let finalCitation = citation
    if (!finalCitation) {
      const authors = (sub2.authors || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)
      const year = (sub2.school_year || '').split('-')[0] || new Date().getFullYear()
      const authorStr = authors.length === 0 ? 'Unknown Author'
        : authors.length === 1 ? `${authors[0]}.`
        : authors.length === 2 ? `${authors[0]} & ${authors[1]}.`
        : `${authors[0]} et al.`
      finalCitation = `${authorStr} (${year}). ${sub2.title}. CORE-V Research Vault.`
    }

    await db.query(
      `UPDATE submissions
       SET status = 'published', is_published = TRUE, public_visible = TRUE,
           featured = ?, published_at = NOW(), citation = COALESCE(?, citation), slug = COALESCE(slug, ?), updated_at = NOW()
       WHERE submission_id = ?`,
      [featured === true || featured === 'true', finalCitation || null, slug, id]
    )

    await db.query(
      `INSERT INTO submission_status_history (submission_id, status, note, changed_by)
       VALUES (?, 'published', 'Published to gallery', ?)`,
      [id, req.user.user_id]
    )

    res.json({ message: 'Published to gallery', submission_id: id })
  } catch (err) {
    console.error('publishSubmission error:', err)
    res.status(500).json({ message: 'Failed to publish' })
  }
}

const unpublishSubmission = async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  try {
    const [subs] = await db.query(
      `SELECT s.submission_id, rg.adviser_id, rg.created_by
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.submission_id = ?`, [id]
    )
    if (!subs.length) return res.status(404).json({ message: 'Submission not found' })
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()
    if (role === 'adviser' && subs[0].adviser_id !== userId && subs[0].created_by !== userId) {
      return res.status(404).json({ message: 'Submission not found' })
    }
    await db.query(
      `UPDATE submissions SET status = 'approved', is_published = FALSE, public_visible = FALSE, updated_at = NOW()
       WHERE submission_id = ?`,
      [id]
    )

    // Revoke all active access links for this submission
    await db.query(
      `UPDATE paper_access_links SET revoked_at = NOW()
       WHERE submission_id = ? AND revoked_at IS NULL`,
      [id]
    )

    await db.query(
      `INSERT INTO submission_status_history (submission_id, status, note, changed_by)
       VALUES (?, 'approved', ?, ?)`,
      [id, reason ? `Unpublished: ${reason}` : 'Unpublished', req.user.user_id]
    )

    res.json({ message: 'Unpublished', reason: reason || null })
  } catch (err) {
    console.error('unpublishSubmission error:', err)
    res.status(500).json({ message: 'Failed to unpublish' })
  }
}

const setFeatured = async (req, res) => {
  const { id } = req.params
  const { featured } = req.body
  try {
    await db.query(
      `UPDATE submissions SET featured = ?, updated_at = NOW() WHERE submission_id = ?`,
      [featured === true || featured === 'true', id]
    )
    res.json({ message: 'Featured updated', featured: featured === true || featured === 'true' })
  } catch (err) {
    console.error('setFeatured error:', err)
    res.status(500).json({ message: 'Failed to update featured' })
  }
}

const setConsent = async (req, res) => {
  const { id } = req.params
  const { granted } = req.body
  try {
    if (granted) {
      await db.query(
        `UPDATE submissions
         SET consent_status = 'granted',
             consent_at = COALESCE(consent_at, NOW()),
             author_consent_at = COALESCE(author_consent_at, NOW()),
             updated_at = NOW()
         WHERE submission_id = ?`,
        [id]
      )
    } else {
      await db.query(
        `UPDATE submissions
         SET consent_status = 'declined',
             consent_at = NOW(),
             author_consent_at = NULL,
             updated_at = NOW()
         WHERE submission_id = ?`,
        [id]
      )
    }
    res.json({ message: 'Consent updated', granted: !!granted })
  } catch (err) {
    console.error('setConsent error:', err)
    res.status(500).json({ message: 'Failed to update consent' })
  }
}

const getReports = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()

    // Scope to adviser's groups if adviser
    let groupFilter = ''
    const params = []
    if (role === 'adviser') {
      groupFilter = ' AND s.group_id IN (SELECT group_id FROM research_groups WHERE adviser_id = ? OR created_by = ?)'
      params.push(userId, userId)
    }

    const [byStatus] = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM submissions s WHERE 1=1 ${groupFilter} GROUP BY status ORDER BY status`,
      params
    )
    const [byStrand] = await db.query(
      `SELECT COALESCE(strand, program) AS strand, COUNT(*)::int AS count FROM submissions s WHERE 1=1 ${groupFilter} GROUP BY COALESCE(strand, program) ORDER BY strand`,
      params
    )
    const [byYear] = await db.query(
      `SELECT school_year, COUNT(*)::int AS count FROM submissions s WHERE 1=1 ${groupFilter} GROUP BY school_year ORDER BY school_year DESC`,
      params
    )
    const [published] = await db.query(
      `SELECT s.submission_id, s.title, s.authors, s.strand, s.section, s.school_year, s.published_at, s.citation, rg.group_name
       FROM submissions s JOIN research_groups rg ON rg.group_id = s.group_id
       WHERE s.is_published = TRUE ${groupFilter.replace('s.group_id', 's.group_id')} ORDER BY s.published_at DESC`,
      params
    )
    const [accessStats] = await db.query(
      `SELECT r.status, COUNT(*)::int AS count FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE 1=1 ${groupFilter} GROUP BY r.status`,
      params
    )

    res.json({
      data: {
        byStatus,
        byStrand,
        byYear,
        published,
        accessStats,
        totalSubmissions: byStatus.reduce((a, b) => a + b.count, 0),
        totalPublished: published.length,
      },
    })
  } catch (err) {
    console.error('getReports error:', err)
    res.status(500).json({ message: 'Failed to fetch reports' })
  }
}

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id
    const role = String(req.user?.role || '').toLowerCase()

    let groupFilter = ''
    const params = []
    if (role === 'adviser') {
      groupFilter = ' AND s.group_id IN (SELECT group_id FROM research_groups WHERE adviser_id = ? OR created_by = ?)'
      params.push(userId, userId)
    }

    const [postCounts] = await db.query(
      `SELECT COUNT(*)::int AS total_posts FROM forum_posts fp
       LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
       WHERE 1=1 ${groupFilter.replace('s.group_id', 'fp.group_id')}`,
      params
    )
    const [commentCounts] = await db.query(
      `SELECT COUNT(*)::int AS total_comments FROM forum_comments fc
       JOIN forum_posts fp ON fp.post_id = fc.post_id
       LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
       WHERE 1=1 ${groupFilter.replace('s.group_id', 'fp.group_id')}`,
      params
    )
    const [likeCounts] = await db.query(
      `SELECT COUNT(*)::int AS total_likes FROM forum_post_likes fpl
       JOIN forum_posts fp ON fp.post_id = fpl.post_id
       LEFT JOIN research_groups rg ON rg.group_id = fp.group_id
       WHERE 1=1 ${groupFilter.replace('s.group_id', 'fp.group_id')}`,
      params
    )
    const [accessCounts] = await db.query(
      `SELECT COUNT(*)::int AS total_requests FROM paper_access_requests r
       JOIN submissions s ON s.submission_id = r.submission_id
       WHERE 1=1 ${groupFilter}`,
      params
    )
    const [downloadCounts] = await db.query(
      `SELECT COUNT(*)::int AS total_downloads FROM paper_access_logs l
       JOIN submissions s ON s.submission_id = l.submission_id
       WHERE l.action = 'download_success' ${groupFilter}`,
      params
    )

    res.json({
      data: {
        totalPosts: postCounts[0]?.total_posts || 0,
        totalComments: commentCounts[0]?.total_comments || 0,
        totalLikes: likeCounts[0]?.total_likes || 0,
        totalAccessRequests: accessCounts[0]?.total_requests || 0,
        totalDownloads: downloadCounts[0]?.total_downloads || 0,
      },
    })
  } catch (err) {
    console.error('getAnalytics error:', err)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
}

module.exports = {
  getGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  getGroupMembers, addGroupMember, removeGroupMember,
  getPanel, assignPanel, removeFromPanel,
  getFacultyList, getStudentList,
  getSubmissions, getSubmissionById,
  updateStage, updateStatus,
  getDashboardStats,
  uploadSubmissionFile, deleteSubmissionFile, publishSubmission, unpublishSubmission, setFeatured,
  getReports, getAnalytics,
}
