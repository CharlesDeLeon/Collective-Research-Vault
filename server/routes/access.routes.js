const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  listRequests, getRequest, approveRequest, declineRequest, revokeLink, resendRequest,
} = require('../controllers/accessController')

router.use(authMiddleware)
router.use(roleMiddleware('adviser', 'sysadmin'))

router.get('/access-requests', listRequests)
router.get('/access-requests/:id', getRequest)
router.post('/access-requests/:id/approve', approveRequest)
router.post('/access-requests/:id/decline', declineRequest)
router.post('/access-requests/:id/resend', resendRequest)
router.post('/access-links/:id/revoke', revokeLink)

module.exports = router