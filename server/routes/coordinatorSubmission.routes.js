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
  uploadSubmissionFile, deleteSubmissionFile, publishSubmission, unpublishSubmission, setFeatured,
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
const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'The file is too large. Please upload a file under 20 MB.' })
      }
      return res.status(400).json({ message: err.message || 'Invalid file upload.' })
    }
    // Server-side type validation (defense in depth beyond the client accept filter)
    if (req.file) {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowed.includes(req.file.mimetype)) {
        // clean up the saved file
        try { if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path) } catch (e) {}
        return res.status(400).json({ message: 'Only PDF or Word files can be uploaded.' })
      }
    }
    next()
  })
}
router.post('/:id/files', uploadSingle, uploadSubmissionFile)
router.delete('/:id/files/:versionId', deleteSubmissionFile)
router.post('/:id/publish', publishSubmission)
router.post('/:id/unpublish', unpublishSubmission)
router.patch('/:id/featured', setFeatured)

// Panel removal
router.delete('/:assignmentId', removeFromPanel)

module.exports = router