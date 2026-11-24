export const ROUTES = {
  home: '/student',
  forum: '/student/forum',
  groups: '/student/groups',
  group: (id) => `/student/groups/${id}`,
  profile: '/student/profile',
  gallery: '/gallery',
  upload: '/student/upload',
  myPapers: '/student/my-papers',
  editPaper: (id) => `/student/my-papers/${id}/edit`,
  history: '/student/notifications',
  paper: (id) => `/student/paper/${id}`,
}

export const glass =
  'bg-panel border border-white/10 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20'

export const STATUS_STYLES = {
  proposal: { label: 'Proposal', cls: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  submitted: { label: 'Under Review', cls: 'bg-violet-500/20 text-violet-300 border-violet-400/30' },
  under_review: { label: 'Under Review', cls: 'bg-violet-500/20 text-violet-300 border-violet-400/30' },
  needs_revision: { label: 'For Revision', cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  for_revision: { label: 'For Revision', cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  published: { label: 'Approved/Vault', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  rejected: { label: 'Rejected', cls: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
}