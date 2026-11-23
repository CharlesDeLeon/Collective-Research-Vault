const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const { sendEmail } = require('../services/mailer')

const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
const INVITE_TTL_HOURS = 72

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function makeTempPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12)
}

const createInvite = async (req, res) => {
  const { email, name } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required' })

  const cleanEmail = String(email).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: 'Invalid email address' })
  }

  try {
    // Reuse or create the external_panelist account
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail])
    let user = existing[0] || null

    const tempPassword = makeTempPassword()
    const hashedTemp = await bcrypt.hash(tempPassword, 10)

    if (user) {
      if (String(user.role).toLowerCase() !== 'external_panelist') {
        return res.status(409).json({ message: 'An account with this email already exists under a different role' })
      }
      if (Number(user.is_active) === 1) {
        return res.status(409).json({ message: 'This panelist already has an active account' })
      }
      await pool.query(
        'UPDATE users SET name = COALESCE(?, name), password = ?, is_active = FALSE, updated_at = NOW() WHERE user_id = ?',
        [name || null, hashedTemp, user.user_id]
      )
      user.name = name || user.name
    } else {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, is_active, program)
         VALUES (?, ?, ?, 'external_panelist', FALSE, NULL)
         RETURNING user_id`,
        [name || cleanEmail.split('@')[0], cleanEmail, hashedTemp]
      )
      const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [result.insertId])
      user = rows[0]
    }

    // Revoke any prior pending invitations for this email
    await pool.query(
      `UPDATE panelist_invitations SET expires_at = NOW() WHERE email = ? AND accepted_at IS NULL`,
      [cleanEmail]
    )

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO panelist_invitations (email, name, user_id, token_hash, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanEmail, name || null, user.user_id, tokenHash, req.user.user_id, expiresAt]
    )

    const inviteUrl = `${APP_URL}/invite/${rawToken}`
    const subject = 'You have been invited to CORE-V as an External Panelist'
    const text = [
      `Hello${name ? ' ' + name : ''},`,
      '',
      'You have been invited to join CORE-V as an External Panelist.',
      '',
      `Invite link: ${inviteUrl}`,
      `Temporary password: ${tempPassword}`,
      '',
      `This invitation expires in ${INVITE_TTL_HOURS} hours and can be used only once.`,
      '',
      'Open the link and set your name and a new password to activate your account.',
      '',
      '— CORE-V',
    ].join('\n')

    let delivery = { status: 'unknown', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: null, error: null }
    try {
      const result = await sendEmail({ to: cleanEmail, subject, text })
      delivery = { status: result && result.ok ? 'sent' : 'failed', provider: (result && result.transport) || (process.env.MAIL_TRANSPORT || 'console'), sentAt: new Date().toISOString(), error: result && result.ok ? null : ((result && result.error) || null) }
    } catch (e) {
      console.error('invite email failed:', e.message)
      delivery = { status: 'failed', provider: process.env.MAIL_TRANSPORT || 'console', sentAt: new Date().toISOString(), error: e.message }
    }

    res.status(201).json({
      message: 'Invitation created',
      email: cleanEmail,
      inviteUrl,
      tempPassword,
      expiresAt,
      delivery,
    })
  } catch (err) {
    console.error('createInvite error:', err)
    res.status(500).json({ message: 'Failed to create invitation' })
  }
}

const validateInvite = async (req, res) => {
  const { token } = req.params
  try {
    const tokenHash = hashToken(token)
    const [rows] = await pool.query(
      `SELECT pi.email, pi.name, pi.expires_at, pi.accepted_at, u.name AS user_name
       FROM panelist_invitations pi
       LEFT JOIN users u ON pi.user_id = u.user_id
       WHERE pi.token_hash = ?`,
      [tokenHash]
    )
    if (!rows.length) return res.status(404).json({ message: 'Invitation not found' })
    const inv = rows[0]
    if (inv.accepted_at) return res.status(410).json({ message: 'This invitation has already been used' })
    if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ message: 'This invitation has expired' })
    res.json({
      email: inv.email,
      name: inv.name || inv.user_name || '',
      expiresAt: inv.expires_at,
    })
  } catch (err) {
    console.error('validateInvite error:', err)
    res.status(500).json({ message: 'Failed to validate invitation' })
  }
}

const acceptInvite = async (req, res) => {
  const { token } = req.params
  const { tempPassword, name, password } = req.body

  if (!tempPassword) return res.status(400).json({ message: 'Temporary password is required' })
  if (!password || String(password).length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }

  try {
    const tokenHash = hashToken(token)
    const [rows] = await pool.query(
      `SELECT pi.*, u.password AS user_password, u.user_id
       FROM panelist_invitations pi
       JOIN users u ON pi.user_id = u.user_id
       WHERE pi.token_hash = ?`,
      [tokenHash]
    )
    if (!rows.length) return res.status(404).json({ message: 'Invitation not found' })
    const inv = rows[0]
    if (inv.accepted_at) return res.status(410).json({ message: 'This invitation has already been used' })
    if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ message: 'This invitation has expired' })

    const isTempMatch = await bcrypt.compare(tempPassword, inv.user_password)
    if (!isTempMatch) return res.status(401).json({ message: 'Temporary password is incorrect' })

    const hashedNew = await bcrypt.hash(password, 10)
    const displayName = (name && String(name).trim()) || inv.name || inv.email.split('@')[0]

    await pool.query(
      `UPDATE users SET name = ?, password = ?, is_active = TRUE, updated_at = NOW() WHERE user_id = ?`,
      [displayName, hashedNew, inv.user_id]
    )
    await pool.query(
      `UPDATE panelist_invitations SET accepted_at = NOW(), name = COALESCE(name, ?) WHERE invitation_id = ?`,
      [displayName, inv.invitation_id]
    )

    const [urows] = await pool.query('SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?', [inv.user_id])
    const user = urows[0]

    const jwtToken = jwt.sign(
      { user_id: user.user_id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      message: 'Account activated',
      token: jwtToken,
      user,
    })
  } catch (err) {
    console.error('acceptInvite error:', err)
    res.status(500).json({ message: 'Failed to accept invitation' })
  }
}


const listInvites = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pi.invitation_id, pi.email, pi.name, pi.expires_at, pi.accepted_at, pi.created_at,
              u.name AS invited_by_name
       FROM panelist_invitations pi
       LEFT JOIN users u ON u.user_id = pi.invited_by
       ORDER BY pi.created_at DESC`
    )
    const data = rows.map(r => ({
      id: r.invitation_id,
      email: r.email,
      name: r.name,
      invitedBy: r.invited_by_name,
      expiresAt: r.expires_at,
      acceptedAt: r.accepted_at,
      createdAt: r.created_at,
      status: r.accepted_at ? 'accepted' : (new Date(r.expires_at) < new Date() ? 'expired' : 'pending'),
    }))
    res.json({ data })
  } catch (err) {
    console.error('listInvites error:', err)
    res.status(500).json({ message: 'Failed to load invitations' })
  }
}

module.exports = { createInvite, validateInvite, acceptInvite, listInvites }
