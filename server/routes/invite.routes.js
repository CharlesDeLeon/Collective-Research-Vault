const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { createInvite, validateInvite, acceptInvite } = require('../controllers/inviteController')

router.post('/', authMiddleware, roleMiddleware('adviser', 'sysadmin'), createInvite)
router.get('/:token', validateInvite)
router.post('/:token/accept', acceptInvite)

module.exports = router
