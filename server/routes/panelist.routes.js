const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { listPapers, listAssignedGroups } = require('../controllers/panelistController')

router.get('/groups', authMiddleware, roleMiddleware('external_panelist', 'adviser', 'sysadmin'), listAssignedGroups)
router.get('/papers', authMiddleware, roleMiddleware('external_panelist', 'adviser', 'sysadmin'), listPapers)

module.exports = router
