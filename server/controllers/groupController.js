const { query } = require('../config/db')

const listGroups = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase()
    const userId = req.user.user_id
    let sql = `
      SELECT rg.group_id, rg.group_name, rg.program, rg.strand, rg.section,
             rg.year_level, rg.school_year, rg.created_by, rg.adviser_id,
             rg.created_at,
             (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = rg.group_id) AS member_count,
             (SELECT COUNT(*)::int FROM submissions s WHERE s.group_id = rg.group_id) AS submission_count
      FROM research_groups rg
    `
    const params = []

    if (role === 'student') {
      sql += ` JOIN group_members gm ON gm.group_id = rg.group_id WHERE gm.user_id = ?`
      params.push(userId)
    } else if (role === 'adviser') {
      sql += ` WHERE rg.adviser_id = ? OR rg.created_by = ?`
      params.push(userId, userId)
    }

    sql += ` ORDER BY rg.group_name ASC`
    const [rows] = await query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('listGroups error:', err)
    res.status(500).json({ message: 'Failed to fetch groups' })
  }
}

const getGroup = async (req, res) => {
  try {
    const { id } = req.params
    const [groups] = await query(
      `SELECT rg.group_id, rg.group_name, rg.program, rg.strand, rg.section,
              rg.year_level, rg.school_year, rg.created_by, rg.adviser_id,
              rg.created_at,
              u.name AS adviser_name
       FROM research_groups rg
       LEFT JOIN users u ON u.user_id = rg.adviser_id
       WHERE rg.group_id = ?`,
      [id]
    )
    if (!groups.length) return res.status(404).json({ message: 'Group not found' })

    const group = groups[0]
    const [members] = await query(
      `SELECT u.user_id, u.name, u.email, u.role, u.program
       FROM group_members gm JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = ? ORDER BY u.name`,
      [id]
    )
    const [panel] = await query(
      `SELECT pa.assignment_id, pa.faculty_id AS user_id, u.name, u.email, pa.role_in_panel, pa.assigned_at
       FROM panel_assignments pa JOIN users u ON u.user_id = pa.faculty_id
       WHERE pa.group_id = ?`,
      [id]
    )

    res.json({ data: { ...group, members, panel } })
  } catch (err) {
    console.error('getGroup error:', err)
    res.status(500).json({ message: 'Failed to fetch group' })
  }
}

const createGroup = async (req, res) => {
  try {
    const { group_name, strand, section, year_level, school_year, program } = req.body
    if (!group_name) return res.status(400).json({ message: 'group_name is required' })
    const userId = req.user.user_id
    const [result] = await query(
      `INSERT INTO research_groups (group_name, program, strand, section, year_level, school_year, created_by, adviser_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [group_name, program || strand || null, strand || null, section || null, year_level || null, school_year || null, userId, userId]
    )
    res.status(201).json({ data: { group_id: result.insertId } })
  } catch (err) {
    console.error('createGroup error:', err)
    res.status(500).json({ message: 'Failed to create group' })
  }
}

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params
    const { group_name, strand, section, year_level, school_year, program } = req.body
    await query(
      `UPDATE research_groups
       SET group_name = COALESCE(?, group_name),
           program = COALESCE(?, program),
           strand = COALESCE(?, strand),
           section = COALESCE(?, section),
           year_level = COALESCE(?, year_level),
           school_year = COALESCE(?, school_year)
       WHERE group_id = ?`,
      [group_name || null, program || null, strand || null, section || null, year_level || null, school_year || null, id]
    )
    res.json({ message: 'Group updated' })
  } catch (err) {
    console.error('updateGroup error:', err)
    res.status(500).json({ message: 'Failed to update group' })
  }
}

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params
    await query('DELETE FROM research_groups WHERE group_id = ?', [id])
    res.json({ message: 'Group deleted' })
  } catch (err) {
    console.error('deleteGroup error:', err)
    res.status(500).json({ message: 'Failed to delete group' })
  }
}

const addMember = async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.body
    if (!user_id) return res.status(400).json({ message: 'user_id is required' })
    await query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [id, user_id])
    res.status(201).json({ message: 'Member added' })
  } catch (err) {
    console.error('addMember error:', err)
    res.status(500).json({ message: 'Failed to add member' })
  }
}

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params
    await query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId])
    res.json({ message: 'Member removed' })
  } catch (err) {
    console.error('removeMember error:', err)
    res.status(500).json({ message: 'Failed to remove member' })
  }
}

const searchStudents = async (req, res) => {
  try {
    const search = req.query.search || ''
    const [rows] = await query(
      `SELECT user_id, name, email, program FROM users WHERE role = 'student' AND is_active = TRUE
       AND (name ILIKE ? OR email ILIKE ?) ORDER BY name LIMIT 20`,
      [`%${search}%`, `%${search}%`]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('searchStudents error:', err)
    res.status(500).json({ message: 'Failed to search students' })
  }
}

module.exports = {
  listGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addMember, removeMember, searchStudents,
}