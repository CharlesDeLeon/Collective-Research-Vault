const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { listAccessRequests, consumeAccessRequest } = require('../controllers/studentController')

router.use(authMiddleware)
router.use(roleMiddleware('student'))

router.get('/access-requests', listAccessRequests)
router.post('/access-requests/:id/consume', consumeAccessRequest)

module.exports = router