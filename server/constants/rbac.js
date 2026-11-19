const rolePermissions = {
  student: {
    canUploadPapers: true,
    canViewOwnSubmissions: true,
    canViewComments: true,
    canViewNotifications: true,
    canPostToFeed: true,
    canComment: true,
    canLike: true,
  },
  adviser: {
    canUploadPapers: true,
    canViewSubmissions: true,
    canAddComments: true,
    canSubmitReview: true,
    canManageAssignments: true,
    canManageGroups: true,
    canManageMembers: true,
    canInvitePanelists: true,
    canSetStatus: true,
    canUploadFinalPaper: true,
    canPublish: true,
    canApproveAccess: true,
    canModerateOwnGroup: true,
    canViewGroupAnalytics: true,
    canViewNotifications: true,
    canViewAuditLogs: false,
  },
  external_panelist: {
    canViewSubmissions: true,
    canAddComments: true,
    canViewNotifications: true,
  },
  sysadmin: {
    canUploadPapers: true,
    canViewSubmissions: true,
    canAddComments: true,
    canSubmitReview: true,
    canManageAssignments: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageGroups: true,
    canManageAllGroups: true,
    canModerateGlobal: true,
    canViewNotifications: true,
    canViewAuditLogs: true,
    canExportData: true,
    canManageBackups: true,
    canConfigureSystem: true,
    canViewGlobalAnalytics: true,
  },
}

const validRoles = Object.keys(rolePermissions)

module.exports = {
  rolePermissions,
  validRoles,
}