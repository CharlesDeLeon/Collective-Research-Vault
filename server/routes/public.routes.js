const express = require('express')
const router = express.Router()
const {
  listPapers, getPaper, submitAccessRequest, getRequestStatus, confirmLink, consumeLink, serveFile, serveFileByRef,
} = require('../controllers/publicController')

// Public gallery
router.get('/papers', listPapers)
router.get('/papers/:slug', getPaper)

// Access requests
router.post('/access-requests', submitAccessRequest)
router.get('/access/status/:ref', getRequestStatus)
router.get('/access/:token', confirmLink)
router.get('/access/:token/view', consumeLink)
router.get('/access/:token/file', serveFile)
router.get('/access-requests/:ref/file', serveFileByRef)

module.exports = router