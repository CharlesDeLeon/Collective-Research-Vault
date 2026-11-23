const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
        console.log('Query result for email:', email, '| Rows found:', rows.length)

        if (rows.length === 0) {
            console.log('User not found for email:', email)
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const user = rows[0]
        if (Number(user.is_active) === 0) {
            return res.status(403).json({ message: 'This account is inactive. Please contact an administrator.' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        console.log('Password match result:', isMatch)

        if (!isMatch) {
            console.log('Password mismatch for user:', email)
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        // Track last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE user_id = ?', [user.user_id])

        const token = jwt.sign(
            { user_id: user.user_id, name: user.name, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )

        res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
            },
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server Error'})
    }
}

const updateProfile = async (req, res) => {
  const userId = req.user.user_id
  const { name, email, currentPassword } = req.body

  if (!name && !email) {
    return res.status(400).json({ message: 'Provide name or email to update' })
  }
  if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    const user = rows[0]

    // If changing email, verify current password
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to change email' })
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' })
      }
      // Check email uniqueness
      const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, userId])
      if (existing.length) {
        return res.status(409).json({ message: 'Email already in use' })
      }
    }

    const updates = []
    const params = []
    if (name) { updates.push('name = ?'); params.push(name) }
    if (email) { updates.push('email = ?'); params.push(email) }
    updates.push('updated_at = NOW()')
    params.push(userId)

    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, params)

    const [updated] = await pool.query('SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?', [userId])
    res.json({ message: 'Profile updated', user: updated[0] })
  } catch (err) {
    console.error('updateProfile error:', err)
    res.status(500).json({ message: 'Failed to update profile' })
  }
}

const changePassword = async (req, res) => {
  const userId = req.user.user_id
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE user_id = ?', [userId])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?', [hashed, userId])

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('changePassword error:', err)
    res.status(500).json({ message: 'Failed to change password' })
  }
}

module.exports = { login, updateProfile, changePassword }
