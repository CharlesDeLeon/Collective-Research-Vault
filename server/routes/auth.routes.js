const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { login, updateProfile, changePassword } = require('../controllers/authController')

router.post('/login', login)
router.patch('/profile', authMiddleware, updateProfile)
router.post('/change-password', authMiddleware, changePassword)

module.exports = router