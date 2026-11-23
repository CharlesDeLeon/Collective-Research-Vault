const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  getAllUsers,
  getUserDetail,
  createUser,
  deleteUser,
  updateUserRole,
  updateUser,
  resetUserPassword,
  updateUserGroups,
  getRolePermissions,
  getAllRolePermissions,
  getUserStats,
  getOverviewStats,
  getAuditLogsList,
  getAuditLogsSummary
} = require('../controllers/adminController')
const storage = require('../controllers/adminStorageController')
const announcements = require('../controllers/adminAnnouncementsController')
const settings = require('../controllers/adminSettingsController')

// All admin endpoints require authentication and sysadmin role
router.use(authMiddleware)
router.use(roleMiddleware('sysadmin'))

// User management
router.get('/users', getAllUsers)
router.post('/users', roleMiddleware('sysadmin'), createUser)
router.get('/users/:userId', getUserDetail)
router.put('/users/:userId', roleMiddleware('sysadmin'), updateUser)
router.delete('/users/:userId', roleMiddleware('sysadmin'), deleteUser)
router.patch('/users/:userId/role', roleMiddleware('sysadmin'), updateUserRole)
router.post('/users/:userId/reset-password', roleMiddleware('sysadmin'), resetUserPassword)
router.put('/users/:userId/groups', roleMiddleware('sysadmin'), updateUserGroups)

// Role and permissions
router.get('/roles/permissions', getAllRolePermissions)
router.get('/roles/:role/permissions', getRolePermissions)

// Statistics
router.get('/stats/users', getUserStats)
router.get('/stats/overview', getOverviewStats)
router.get('/audit-logs', getAuditLogsList)
router.get('/audit-summary', getAuditLogsSummary)

// Storage
router.get('/storage/summary', storage.getSummary)
router.get('/storage/largest-files', storage.getLargestFiles)
router.get('/storage/orphans', storage.getOrphans)
router.get('/storage/backup-status', storage.getBackupStatus)
router.get('/storage/exports/:table', storage.exportTable)
router.get('/storage/file-manifest', storage.getFileManifest)

// Announcements
router.get('/notifications', announcements.listAnnouncements)
router.post('/notifications', announcements.createAnnouncement)

// Settings
router.get('/settings', settings.getSettings)
router.put('/settings', settings.updateSettings)

module.exports = router
