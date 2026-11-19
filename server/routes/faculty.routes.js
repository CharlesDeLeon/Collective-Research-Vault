const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { 
  listFaculties,
  getAssignedSubmissions,
  addFeedbackComment,
  submitReview,
  getPanelAssignments,
  getAssignmentDetail,
  getSubmissionComments
} = require('../controllers/facultyController')

router.get('/list', authMiddleware, roleMiddleware('student'), listFaculties)
router.get('/submissions', authMiddleware, roleMiddleware('adviser'), getAssignedSubmissions)
router.get('/assignments', authMiddleware, roleMiddleware('adviser'), getPanelAssignments)
router.get('/assignments/:group_id', authMiddleware, roleMiddleware('adviser'), getAssignmentDetail)
router.get('/submissions/:submission_id/comments', authMiddleware, roleMiddleware('adviser'), getSubmissionComments)

router.post('/submissions/:submission_id/comment', authMiddleware, roleMiddleware('adviser'), addFeedbackComment)
router.post('/submissions/:submission_id/review', authMiddleware, roleMiddleware('adviser'), submitReview)

module.exports = router
