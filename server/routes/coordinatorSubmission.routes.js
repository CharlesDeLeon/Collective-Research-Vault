const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  getSubmissions, getSubmissionById, updateStage, updateStatus,
  removeFromPanel, getDashboardStats, getFacultyList, getStudentList,
  uploadSubmissionFile, publishSubmission, unpublishSubmission, setConsent,
  getReports, getAnalytics,
} = require('../controllers/coordinatorController')

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

router.use(authMiddleware)
router.use(roleMiddleware('adviser'))

// Reports & Analytics (must come before /:id)
router.get('/reports', getReports)
router.get('/analytics', getAnalytics)

// Submissions
router.get('/', getSubmissions)
router.get('/:id', getSubmissionById)
router.patch('/:id/stage', updateStage)
router.patch('/:id/status', updateStatus)

// Adviser review / publish
router.post('/:id/files', upload.single('file'), uploadSubmissionFile)
router.post('/:id/publish', publishSubmission)
router.post('/:id/unpublish', unpublishSubmission)
router.post('/:id/consent', setConsent)

// Panel removal
router.delete('/:assignmentId', removeFromPanel)

module.exports = router