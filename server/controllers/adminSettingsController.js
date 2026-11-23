const { query } = require('../config/db')

const DEFAULTS = {
  institutionName: '',
  strands: ['STEM', 'ABM', 'HUMSS', 'GAS'],
  sections: [],
  schoolYears: [],
  linkExpiryHours: 72,
  maxUploadMb: 20,
  fileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maintenance: false,
}

const getSettings = async (req, res) => {
  try {
    const [rows] = await query(`SELECT settings FROM app_settings ORDER BY id DESC LIMIT 1`)
    const settings = rows.length ? { ...DEFAULTS, ...(rows[0].settings || {}) } : DEFAULTS
    res.json(settings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateSettings = async (req, res) => {
  try {
    const settings = { ...DEFAULTS, ...req.body }
    await query(
      `INSERT INTO app_settings (settings, updated_at) VALUES (?, NOW())`,
      [JSON.stringify(settings)]
    )
    res.json({ message: 'Settings saved', settings })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getSettings, updateSettings }