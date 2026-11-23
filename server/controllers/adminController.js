const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const { logAction, getAuditLogs, getAuditSummary } = require('../utils/auditLogger')
const { rolePermissions, validRoles } = require('../constants/rbac')

const roleAliases = {
  admin: 'sysadmin',
  moderator: 'adviser',
  user: 'student'
}

const normalizeRole = (role) => {
  if (!role) return null
  const value = String(role).toLowerCase()
  return validRoles.includes(value) ? value : roleAliases[value] || null
}

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role = '', search = '', status = '', groupId = '' } = req.query
    const offset = (page - 1) * limit

    let query = `SELECT u.user_id, u.name, u.email, u.role, u.is_active,
                        CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END AS status,
                        u.program, u.created_at, u.updated_at, u.last_login_at
                 FROM users u
                 WHERE 1=1`
    const params = []

    if (groupId) {
      query += ` AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = u.user_id AND gm.group_id = ?)`
      params.push(groupId)
    }

    if (role) {
      query += ` AND u.role = ?`
      params.push(role)
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    if (status === 'active') {
      query += ` AND u.is_active = TRUE`
    } else if (status === 'inactive') {
      query += ` AND u.is_active = FALSE`
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), offset)

    const [users] = await pool.query(query, params)

    // Attach groups to each user
    const userIds = users.map(u => u.user_id)
    let groupsByUser = {}
    if (userIds.length) {
      const placeholders = userIds.map(() => '?').join(',')
      const [gm] = await pool.query(
        `SELECT gm.user_id, rg.group_id, rg.group_name
         FROM group_members gm JOIN research_groups rg ON rg.group_id = gm.group_id
         WHERE gm.user_id IN (${placeholders})`,
        userIds
      )
      for (const g of gm) {
        if (!groupsByUser[g.user_id]) groupsByUser[g.user_id] = []
        groupsByUser[g.user_id].push({ group_id: g.group_id, group_name: g.group_name })
      }
    }
    const enriched = users.map(u => ({ ...u, groups: groupsByUser[u.user_id] || [] }))

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`
    const countParams = []

    if (groupId) {
      countQuery += ` AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = u.user_id AND gm.group_id = ?)`
      countParams.push(groupId)
    }

    if (role) {
      countQuery += ` AND u.role = ?`
      countParams.push(role)
    }

    if (search) {
      countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm)
    }

    if (status === 'active') {
      countQuery += ` AND u.is_active = TRUE`
    } else if (status === 'inactive') {
      countQuery += ` AND u.is_active = FALSE`
    }

    const [countResult] = await pool.query(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get single user details
const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, is_active, program, created_at, updated_at, last_login_at
       FROM users 
       WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = users[0]
    const [gm] = await pool.query(
      `SELECT rg.group_id, rg.group_name FROM group_members gm JOIN research_groups rg ON rg.group_id = gm.group_id WHERE gm.user_id = ?`,
      [userId]
    )
    res.json({
      ...user,
      groups: gm.map(g => ({ group_id: g.group_id, group_name: g.group_name })),
      permissions: rolePermissions[user.role] || {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const role = normalizeRole(req.body.role)

    if (!role) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Check user exists
    const [users] = await pool.query(
      `SELECT user_id, role FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]

    if (String(existingUser.role).toLowerCase() === role) {
      return res.json({ message: 'User already has this role' })
    }

    if (req.user.user_id === parseInt(userId, 10) && role !== 'sysadmin') {
      return res.status(400).json({ message: 'You cannot remove your own system administrator access' })
    }

    if (String(existingUser.role).toLowerCase() === 'sysadmin' && role !== 'sysadmin') {
      const [sysadmins] = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin'`
      )

      if (sysadmins[0].total <= 1) {
        return res.status(400).json({ message: 'At least one system administrator must remain assigned' })
      }
    }

    // Update role
    await pool.query(
      `UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?`,
      [role, userId]
    )

    // Log the action
    await logAction(
      req.user.user_id,
      'update_role',
      'user',
      userId,
      {
        previous_role: existingUser.role,
        new_role: role,
        updated_by: req.user.user_id
      }
    )

    res.json({ message: 'User role updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user profile and optionally role/status
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = []
    const values = []

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, is_active, program FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]

    if (req.body.name !== undefined) {
      updates.push('name = ?')
      values.push(String(req.body.name).trim())
    }

    if (req.body.email !== undefined) {
      updates.push('email = ?')
      values.push(String(req.body.email).trim().toLowerCase())
    }

    if (req.body.program !== undefined) {
      updates.push('program = ?')
      values.push(req.body.program ? String(req.body.program).trim() : null)
    }

    if (req.body.status !== undefined) {
      const isActive = String(req.body.status).toLowerCase() === 'active' ? 1 : 0
      updates.push('is_active = ?')
      values.push(isActive)
    }

    if (req.body.role !== undefined) {
      const role = normalizeRole(req.body.role)
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' })
      }

      if (String(existingUser.role).toLowerCase() !== role) {
        if (req.user.user_id === parseInt(userId, 10) && role !== 'sysadmin') {
          return res.status(400).json({ message: 'You cannot remove your own system administrator access' })
        }

        if (String(existingUser.role).toLowerCase() === 'sysadmin' && role !== 'sysadmin') {
          const [sysadmins] = await pool.query(
            `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin'`
          )

          if (sysadmins[0].total <= 1) {
            return res.status(400).json({ message: 'At least one system administrator must remain assigned' })
          }
        }

        updates.push('role = ?')
        values.push(role)
      }
    }

    if (!updates.length) {
      return res.json({ message: 'No changes to update' })
    }

    values.push(userId)
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      values
    )

    await logAction(
      req.user.user_id,
      'update_user',
      'user',
      userId,
      {
        previous_data: existingUser,
        updated_by: req.user.user_id
      }
    )

    if (req.body.groupIds !== undefined && Array.isArray(req.body.groupIds)) {
      await pool.query('DELETE FROM group_members WHERE user_id = ?', [userId])
      for (const gid of req.body.groupIds) {
        await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [gid, userId])
      }
    }

    res.json({ message: 'User updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, program, groupIds } = req.body
    const normalizedRole = normalizeRole(role || 'student')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (!normalizedRole) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [String(email).trim().toLowerCase()]
    )

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, program, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       RETURNING user_id`,
      [
        String(name).trim(),
        String(email).trim().toLowerCase(),
        hashedPassword,
        normalizedRole,
        program ? String(program).trim() : null
      ]
    )

    await logAction(
      req.user.user_id,
      'create_user',
      'user',
      result.insertId,
      {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role: normalizedRole,
        program: program ? String(program).trim() : null,
        created_by: req.user.user_id
      }
    )

    if (Array.isArray(groupIds)) {
      for (const gid of groupIds) {
        await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [gid, result.insertId])
      }
    }

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Deactivate a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    const [users] = await pool.query(
      `SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingUser = users[0]
    const existingRole = String(existingUser.role).toLowerCase()

    if (req.user.user_id === parseInt(userId, 10)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' })
    }

    if (existingRole === 'sysadmin') {
      const [sysadmins] = await pool.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'sysadmin' AND is_active = TRUE`
      )

      if (sysadmins[0].total <= 1 && Number(existingUser.is_active) === 1) {
        return res.status(400).json({ message: 'At least one active system administrator must remain assigned' })
      }
    }

    if (Number(existingUser.is_active) === 0) {
      return res.json({ message: 'User is already inactive' })
    }

    await pool.query(
      `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE user_id = ?`,
      [userId]
    )

    await logAction(
      req.user.user_id,
      'delete_user',
      'user',
      userId,
      {
        previous_data: existingUser,
        deleted_by: req.user.user_id,
        soft_deleted: true
      }
    )

    res.json({ message: 'User deactivated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get role permissions
const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params

    if (!rolePermissions[role]) {
      return res.status(404).json({ message: 'Role not found' })
    }

    res.json({
      role,
      permissions: rolePermissions[role]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get all available roles and their permissions
const getAllRolePermissions = async (req, res) => {
  try {
    res.json(rolePermissions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get overview stats for admin dashboard
const getOverviewStats = async (req, res) => {
  try {
    const [[{ c: total_groups }]] = await pool.query(`SELECT COUNT(*) AS c FROM research_groups`)
    const [[{ c: total_posts }]] = await pool.query(`SELECT COUNT(*) AS c FROM forum_posts WHERE removed = FALSE`)
    const [[{ c: total_published }]] = await pool.query(`SELECT COUNT(*) AS c FROM submissions WHERE is_published = TRUE OR status = 'published'`)
    const [[{ c: total_requests }]] = await pool.query(`SELECT COUNT(*) AS c FROM paper_access_requests`)
    const [[{ c: storage_bytes }]] = await pool.query(`SELECT COALESCE(SUM(file_size),0) AS c FROM document_versions`)
    res.json({
      data: {
        totalGroups: Number(total_groups),
        totalPosts: Number(total_posts),
        totalPublished: Number(total_published),
        totalAccessRequests: Number(total_requests),
        storageUsed: Number(storage_bytes),
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get user count by role
const getUserStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       GROUP BY role`
    )

    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get audit logs
const getAuditLogsList = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, targetType, targetId, userId, dateFrom, dateTo, search } = req.query

    const filters = {}
    if (action) filters.action = action
    if (targetType) filters.targetType = targetType
    if (targetId) filters.targetId = targetId
    if (userId) filters.userId = userId
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (search) filters.search = search

    const result = await getAuditLogs(filters, parseInt(page), parseInt(limit))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get audit summary
const getAuditLogsSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const filters = {}
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo

    const result = await getAuditSummary(filters)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Reset a user's password (admin)
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params
    const [users] = await pool.query('SELECT user_id, name, email FROM users WHERE user_id = ?', [userId])
    if (!users.length) return res.status(404).json({ message: 'User not found' })

    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const hashed = await bcrypt.hash(tempPassword, 10)
    await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?', [hashed, userId])

    await logAction(req.user.user_id, 'reset_password', 'user', userId, { reset_by: req.user.user_id })

    res.json({ temporaryPassword: tempPassword, data: { temporaryPassword: tempPassword } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Create/update group assignment for a user
const updateUserGroups = async (req, res) => {
  try {
    const { userId } = req.params
    const { groupIds } = req.body
    if (!Array.isArray(groupIds)) return res.status(400).json({ message: 'groupIds must be an array' })

    // Remove existing memberships
    await pool.query('DELETE FROM group_members WHERE user_id = ?', [userId])
    for (const gid of groupIds) {
      await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [gid, userId])
    }
    res.json({ message: 'Groups updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAllUsers,
  getUserDetail,
  createUser,
  deleteUser,
  updateUserRole,
  updateUser,
  resetUserPassword,
  updateUserGroups,
  getRolePermissions,
  getAllRolePermissions,
  getUserStats,
  getOverviewStats,
  getAuditLogsList,
  getAuditLogsSummary
}
