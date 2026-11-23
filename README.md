
```
Collective-Research-Vault
├─ client
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  ├─ icons.svg
│  │  └─ _redirects
│  ├─ README.md
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ components
│  │  │  ├─ admin
│  │  │  │  ├─ AccessRequestModal.jsx
│  │  │  │  ├─ AdminDrawer.jsx
│  │  │  │  ├─ adminNav.js
│  │  │  │  ├─ AdviserChip.jsx
│  │  │  │  ├─ AuditDetailModal.jsx
│  │  │  │  ├─ ChangeRoleModal.jsx
│  │  │  │  ├─ charts.jsx
│  │  │  │  ├─ CreateGroupModal.jsx
│  │  │  │  ├─ Pager.jsx
│  │  │  │  ├─ PostDetailModal.jsx
│  │  │  │  ├─ PostSummary.jsx
│  │  │  │  ├─ ReassignAdviserModal.jsx
│  │  │  │  ├─ RequestStatusChip.jsx
│  │  │  │  ├─ ResetPasswordModal.jsx
│  │  │  │  ├─ UserActivity.jsx
│  │  │  │  ├─ UserBits.jsx
│  │  │  │  └─ UserFormModal.jsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ constants.js
│  │  │  │  ├─ DashboardHeader.jsx
│  │  │  │  ├─ icons.jsx
│  │  │  │  ├─ NotificationsPanel.jsx
│  │  │  │  ├─ PaperCard.jsx
│  │  │  │  ├─ Sidebar.jsx
│  │  │  │  ├─ StartDraftCard.jsx
│  │  │  │  └─ StatusPill.jsx
│  │  │  ├─ forum
│  │  │  │  ├─ CommentThread.jsx
│  │  │  │  ├─ FeedFilters.jsx
│  │  │  │  ├─ FeedList.jsx
│  │  │  │  ├─ ForumPostCard.jsx
│  │  │  │  ├─ LinkifiedText.jsx
│  │  │  │  ├─ NotificationsPreview.jsx
│  │  │  │  ├─ PostMenu.jsx
│  │  │  │  ├─ RoleBadge.jsx
│  │  │  │  └─ VideoEmbed.jsx
│  │  │  ├─ gallery
│  │  │  │  ├─ AccessRequestModal.jsx
│  │  │  │  ├─ FeaturedRow.jsx
│  │  │  │  ├─ FilterFields.jsx
│  │  │  │  ├─ FilterSheet.jsx
│  │  │  │  ├─ GalleryCard.jsx
│  │  │  │  ├─ GalleryNavbar.jsx
│  │  │  │  ├─ ThemeToggle.jsx
│  │  │  │  └─ UserMenu.jsx
│  │  │  ├─ group
│  │  │  │  ├─ GroupCard.jsx
│  │  │  │  └─ GroupSwitcher.jsx
│  │  │  ├─ login
│  │  │  │  ├─ belt.css
│  │  │  │  ├─ fallbackCards.js
│  │  │  │  └─ ShowcaseBelt.jsx
│  │  │  ├─ Logo.jsx
│  │  │  ├─ notifications
│  │  │  │  ├─ NotificationIcon.jsx
│  │  │  │  ├─ NotificationRow.jsx
│  │  │  │  ├─ NotificationSection.jsx
│  │  │  │  └─ RichMessage.jsx
│  │  │  ├─ paper
│  │  │  │  ├─ AddPostModal.jsx
│  │  │  │  ├─ Avatar.jsx
│  │  │  │  ├─ ConsentCard.jsx
│  │  │  │  ├─ FeedbackNotes.jsx
│  │  │  │  ├─ ForumSection.jsx
│  │  │  │  ├─ PaperSummaryCard.jsx
│  │  │  │  ├─ ResubmitModal.jsx
│  │  │  │  ├─ SectionHeading.jsx
│  │  │  │  ├─ StatusHistory.jsx
│  │  │  │  └─ VersionHistory.jsx
│  │  │  ├─ profile
│  │  │  │  └─ ProfileTrigger.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  ├─ public
│  │  │  │  ├─ AccessBlocked.jsx
│  │  │  │  ├─ CitationCard.jsx
│  │  │  │  ├─ PublicShell.jsx
│  │  │  │  └─ StatePanel.jsx
│  │  │  ├─ SessionExpiredModal.jsx
│  │  │  ├─ ui
│  │  │  │  ├─ ConfirmModal.jsx
│  │  │  │  ├─ ErrorBanner.jsx
│  │  │  │  ├─ ErrorScreen.jsx
│  │  │  │  ├─ ModalShell.jsx
│  │  │  │  ├─ Select.jsx
│  │  │  │  └─ StatTile.jsx
│  │  │  └─ upload
│  │  │     ├─ Field.jsx
│  │  │     └─ FileDropzone.jsx
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  ├─ forumContext.js
│  │  │  ├─ ForumProvider.jsx
│  │  │  ├─ themeContext.js
│  │  │  ├─ ThemeProvider.jsx
│  │  │  ├─ toastContext.js
│  │  │  ├─ ToastProvider.jsx
│  │  │  ├─ useAuth.js
│  │  │  ├─ useForum.js
│  │  │  ├─ useTheme.js
│  │  │  └─ useToast.js
│  │  ├─ hooks
│  │  │  ├─ useAccessGate.js
│  │  │  ├─ useAssignedGroups.js
│  │  │  ├─ useDebouncedValue.js
│  │  │  ├─ useLoginShowcase.js
│  │  │  ├─ useNotifications.js
│  │  │  ├─ usePostActions.js
│  │  │  ├─ useResearchGallery.js
│  │  │  └─ useStudentDashboard.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  ├─ AdminAccessRequests.jsx
│  │  │  │  ├─ AdminAnalytics.jsx
│  │  │  │  ├─ AdminAnnouncements.jsx
│  │  │  │  ├─ AdminDashboard.jsx
│  │  │  │  ├─ AdminGroupDetail.jsx
│  │  │  │  ├─ AdminGroups.jsx
│  │  │  │  ├─ AdminLayout.jsx
│  │  │  │  ├─ AdminModeration.jsx
│  │  │  │  ├─ AdminPosts.jsx
│  │  │  │  ├─ AdminProfile.jsx
│  │  │  │  ├─ AdminReports.jsx
│  │  │  │  ├─ AdminRoles.jsx
│  │  │  │  ├─ AdminSettings.jsx
│  │  │  │  ├─ AdminUserDetail.jsx
│  │  │  │  ├─ AuditTrail.jsx
│  │  │  │  ├─ ManageStorage.jsx
│  │  │  │  └─ ManageUsers.jsx
│  │  │  ├─ adviser
│  │  │  │  ├─ AdviserAnalytics.jsx
│  │  │  │  ├─ AdviserDashboard.jsx
│  │  │  │  ├─ AdviserGroupDetail.jsx
│  │  │  │  ├─ AdviserGroups.jsx
│  │  │  │  ├─ AdviserInbox.jsx
│  │  │  │  ├─ AdviserLayout.jsx
│  │  │  │  ├─ AdviserModeration.jsx
│  │  │  │  ├─ AdviserPanelists.jsx
│  │  │  │  ├─ AdviserReports.jsx
│  │  │  │  ├─ AdviserReview.jsx
│  │  │  │  └─ AdviserSubmissions.jsx
│  │  │  ├─ Forbidden.jsx
│  │  │  ├─ GalleryPaper.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ NotFoundPage.jsx
│  │  │  ├─ panelist
│  │  │  │  ├─ PanelistDashboard.jsx
│  │  │  │  ├─ PanelistForum.jsx
│  │  │  │  ├─ PanelistGroupDetail.jsx
│  │  │  │  ├─ PanelistGroups.jsx
│  │  │  │  ├─ PanelistLayout.jsx
│  │  │  │  └─ PanelistPostDetail.jsx
│  │  │  ├─ public
│  │  │  │  ├─ About.jsx
│  │  │  │  ├─ AccessDownload.jsx
│  │  │  │  ├─ AccessLink.jsx
│  │  │  │  ├─ AccessView.jsx
│  │  │  │  ├─ InviteAccept.jsx
│  │  │  │  ├─ Landing.jsx
│  │  │  │  ├─ RequestStatus.jsx
│  │  │  │  └─ RequestSubmitted.jsx
│  │  │  ├─ ResearchGallery.jsx
│  │  │  └─ student
│  │  │     ├─ ActivityHistory.jsx
│  │  │     ├─ Feed.jsx
│  │  │     ├─ GroupDetail.jsx
│  │  │     ├─ Groups.jsx
│  │  │     ├─ MyAccess.jsx
│  │  │     ├─ MyPapers.jsx
│  │  │     ├─ NotFound.jsx
│  │  │     ├─ PaperDetail.jsx
│  │  │     ├─ Profile.jsx
│  │  │     ├─ StudentDashboard.jsx
│  │  │     ├─ StudentLayout.jsx
│  │  │     └─ UploadForm.jsx
│  │  ├─ services
│  │  │  ├─ accessLinkService.js
│  │  │  ├─ accessRequestService.js
│  │  │  ├─ accessService.js
│  │  │  ├─ adminInsights.js
│  │  │  ├─ adminService.js
│  │  │  ├─ adviserService.js
│  │  │  ├─ api.js
│  │  │  ├─ authService.js
│  │  │  ├─ backendSupport.js
│  │  │  ├─ galleryData.js
│  │  │  ├─ galleryService.js
│  │  │  ├─ inviteService.js
│  │  │  ├─ loginShowcase.js
│  │  │  ├─ notificationService.js
│  │  │  ├─ panelistService.js
│  │  │  ├─ paperService.js
│  │  │  ├─ studentAccessService.js
│  │  │  └─ uploadService.js
│  │  ├─ theme
│  │  │  └─ themeRoutes.js
│  │  └─ utils
│  │     ├─ accessGrant.js
│  │     ├─ adminRoles.js
│  │     ├─ avatarColors.js
│  │     ├─ citation.js
│  │     ├─ clipboard.js
│  │     ├─ csv.js
│  │     ├─ downloadCsv.js
│  │     ├─ downloadJson.js
│  │     ├─ formatBytes.js
│  │     ├─ formatDate.js
│  │     ├─ helpers.js
│  │     ├─ paperRules.js
│  │     ├─ parseDetails.js
│  │     ├─ permissionLabels.js
│  │     ├─ roleHome.js
│  │     ├─ roles.js
│  │     ├─ siteInfo.js
│  │     ├─ strands.js
│  │     ├─ submissionCitation.js
│  │     └─ videoLinks.js
│  ├─ vercel.json
│  └─ vite.config.js
├─ database
│  ├─ migrations
│  │  └─ 001_research_papers_research_id.sql
│  ├─ package-lock.json
│  ├─ schema.sql
│  ├─ seed.sql
│  └─ setup.js
├─ docs
│  ├─ admin-backend-requirements.md
│  ├─ adviser-backend-requirements.md
│  ├─ backend-status-report.md
│  ├─ handoff.md
│  ├─ panelist-backend-requirements.md
│  ├─ public-reader-backend-requirements.md
│  ├─ README.md
│  └─ student-backend-requirements.md
├─ package-lock.json
├─ package.json
├─ README.md
├─ server
│  ├─ ca.pem
│  ├─ config
│  │  └─ db.js
│  ├─ constants
│  │  └─ rbac.js
│  ├─ controllers
│  │  ├─ accessController.js
│  │  ├─ adminAnnouncementsController.js
│  │  ├─ adminController.js
│  │  ├─ adminSettingsController.js
│  │  ├─ adminStorageController.js
│  │  ├─ authController.js
│  │  ├─ coordinatorController.js
│  │  ├─ facultyController.js
│  │  ├─ forumController.js
│  │  ├─ groupController.js
│  │  ├─ inviteController.js
│  │  ├─ notificationController.js
│  │  ├─ panelistController.js
│  │  ├─ paperController.js
│  │  ├─ publicController.js
│  │  ├─ reviewController.js
│  │  └─ studentController.js
│  ├─ generateHash.js
│  ├─ index.js
│  ├─ middleware
│  │  ├─ auditMiddleware.js
│  │  ├─ authMiddleware.js
│  │  ├─ permissionMiddleware.js
│  │  ├─ roleMiddleware.js
│  │  └─ uploadMiddleware.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ access.routes.js
│  │  ├─ admin.routes.js
│  │  ├─ auth.routes.js
│  │  ├─ coordinator.routes.js
│  │  ├─ coordinatorSubmission.routes.js
│  │  ├─ faculty.routes.js
│  │  ├─ forum.routes.js
│  │  ├─ group.routes.js
│  │  ├─ invite.routes.js
│  │  ├─ notification.routes.js
│  │  ├─ panelist.routes.js
│  │  ├─ paper.routes.js
│  │  ├─ public.routes.js
│  │  └─ student.routes.js
│  ├─ scripts
│  │  ├─ db-check.js
│  │  ├─ db-setup.js
│  │  ├─ migrate_admin_backend.js
│  │  ├─ migrate_adviser_backend.js
│  │  ├─ migrate_forum.js
│  │  ├─ migrate_gallery.js
│  │  ├─ migrate_panelist_invites.js
│  │  ├─ migrate_public_backend.js
│  │  └─ migrate_student_backend.js
│  ├─ services
│  │  └─ mailer.js
│  └─ utils
│     └─ auditLogger.js
├─ SUPABASE_SETUP.md
└─ vercel.json

```