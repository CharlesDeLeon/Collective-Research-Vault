const GROUPS = [
  {
    title: 'Papers and reviews',
    labels: {
      canUploadPapers: 'Upload papers',
      canViewOwnSubmissions: 'View own submissions',
      canViewSubmissions: 'View submissions',
      canAddComments: 'Add review comments',
      canSubmitReview: 'Submit reviews',
      canSetStatus: 'Change paper status',
      canUploadFinalPaper: 'Upload final paper',
      canPublish: 'Publish papers',
      canApproveAccess: 'Approve access requests',
    },
  },
  {
    title: 'Groups',
    labels: {
      canManageAssignments: 'Manage assignments',
      canManageGroups: 'Manage own groups',
      canManageAllGroups: 'Manage all groups',
      canManageMembers: 'Manage members',
      canInvitePanelists: 'Invite panelists',
    },
  },
  {
    title: 'Forum and notifications',
    labels: {
      canViewComments: 'View comments',
      canPostToFeed: 'Post to the feed',
      canComment: 'Comment',
      canLike: 'Like posts',
      canViewNotifications: 'View notifications',
      canModerateOwnGroup: 'Moderate own group',
      canModerateGlobal: 'Moderate everything',
    },
  },
  {
    title: 'Administration',
    labels: {
      canManageUsers: 'Manage users',
      canManageRoles: 'Manage roles',
      canViewAuditLogs: 'View audit logs',
      canExportData: 'Export data',
      canManageBackups: 'Manage backups',
      canConfigureSystem: 'Configure the system',
      canViewGroupAnalytics: 'View group analytics',
      canViewGlobalAnalytics: 'View global analytics',
    },
  },
]

const KNOWN = Object.assign({}, ...GROUPS.map((g) => g.labels))

export const permissionLabel = (key) =>
  KNOWN[key] ??
  String(key)
    .replace(/^can/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())

export function groupPermissions(matrix) {
  const present = new Set(Object.values(matrix ?? {}).flatMap((perms) => Object.keys(perms ?? {})))
  const groups = GROUPS.map((g) => ({
    title: g.title,
    keys: Object.keys(g.labels).filter((k) => present.has(k)),
  }))
  const known = new Set(Object.keys(KNOWN))
  const other = [...present].filter((k) => !known.has(k))
  if (other.length > 0) groups.push({ title: 'Other', keys: other })
  return groups.filter((g) => g.keys.length > 0)
}