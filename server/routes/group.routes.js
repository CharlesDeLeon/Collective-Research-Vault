const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  listGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addMember, removeMember, searchStudents,
} = require('../controllers/groupController')

router.use(authMiddleware)

// All authenticated users can list/view groups
router.get('/', listGroups)
router.get('/search/students', roleMiddleware('adviser', 'sysadmin'), searchStudents)
router.get('/:id', getGroup)

// Adviser + admin can manage
router.post('/', roleMiddleware('adviser', 'sysadmin'), createGroup)
router.put('/:id', roleMiddleware('adviser', 'sysadmin'), updateGroup)
router.delete('/:id', roleMiddleware('adviser', 'sysadmin'), deleteGroup)
router.post('/:id/members', roleMiddleware('adviser', 'sysadmin'), addMember)
router.delete('/:id/members/:userId', roleMiddleware('adviser', 'sysadmin'), removeMember)

module.exports = router