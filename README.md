
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
│  │  │  │  ├─ Pager.jsx
│  │  │  │  ├─ PostDetailModal.jsx
│  │  │  │  ├─ PostSummary.jsx
│  │  │  │  ├─ RequestStatusChip.jsx
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
│  │  │  │  ├─ AttachmentList.jsx
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
│  │  │  │  ├─ SortSelect.jsx
│  │  │  │  └─ UserMenu.jsx
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
│  │  │  │  ├─ AttachField.jsx
│  │  │  │  ├─ AuthorsCard.jsx
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
│  │  │  │  ├─ ProfileModal.jsx
│  │  │  │  └─ ProfileTrigger.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  ├─ public
│  │  │  │  ├─ AccessBlocked.jsx
│  │  │  │  ├─ CitationCard.jsx
│  │  │  │  ├─ PublicShell.jsx
│  │  │  │  └─ StatePanel.jsx
│  │  │  ├─ SessionExpiredModal.jsx
│  │  │  ├─ StatusBadge.jsx
│  │  │  ├─ ui
│  │  │  │  ├─ ConfirmModal.jsx
│  │  │  │  ├─ ErrorScreen.jsx
│  │  │  │  ├─ ModalShell.jsx
│  │  │  │  └─ Select.jsx
│  │  │  └─ upload
│  │  │     ├─ Field.jsx
│  │  │     ├─ FileDropzone.jsx
│  │  │     └─ programs.js
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  ├─ forumContext.js
│  │  │  ├─ ForumProvider.jsx
│  │  │  ├─ toastContext.js
│  │  │  ├─ ToastProvider.jsx
│  │  │  ├─ useAuth.js
│  │  │  ├─ useForum.js
│  │  │  └─ useToast.js
│  │  ├─ hooks
│  │  │  ├─ useAccessGate.js
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
│  │  │  │  ├─ AdminDashboard.jsx
│  │  │  │  ├─ AdminGroupDetail.jsx
│  │  │  │  ├─ AdminGroups.jsx
│  │  │  │  ├─ AdminLayout.jsx
│  │  │  │  ├─ AdminModeration.jsx
│  │  │  │  ├─ AdminPosts.jsx
│  │  │  │  ├─ AdminRoles.jsx
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
│  │  │  │  ├─ AdviserReports.jsx
│  │  │  │  ├─ AdviserReview.jsx
│  │  │  │  └─ AdviserSubmissions.jsx
│  │  │  ├─ Forbidden.jsx
│  │  │  ├─ GalleryPaper.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ NotFoundPage.jsx
│  │  │  ├─ public
│  │  │  │  ├─ About.jsx
│  │  │  │  ├─ AccessDownload.jsx
│  │  │  │  ├─ AccessLink.jsx
│  │  │  │  ├─ AccessView.jsx
│  │  │  │  ├─ Landing.jsx
│  │  │  │  ├─ RequestStatus.jsx
│  │  │  │  └─ RequestSubmitted.jsx
│  │  │  ├─ ResearchGallery.jsx
│  │  │  └─ student
│  │  │     ├─ ActivityHistory.jsx
│  │  │     ├─ Feed.jsx
│  │  │     ├─ Forum.jsx
│  │  │     ├─ GroupDetail.jsx
│  │  │     ├─ Groups.jsx
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
│  │  │  ├─ adminService.js
│  │  │  ├─ adviserService.js
│  │  │  ├─ api.js
│  │  │  ├─ authService.js
│  │  │  ├─ backendSupport.js
│  │  │  ├─ feedData.js
│  │  │  ├─ galleryData.js
│  │  │  ├─ galleryService.js
│  │  │  ├─ loginShowcase.js
│  │  │  ├─ notificationService.js
│  │  │  ├─ paperService.js
│  │  │  └─ uploadService.js
│  │  └─ utils
│  │     ├─ adminRoles.js
│  │     ├─ avatarColors.js
│  │     ├─ citation.js
│  │     ├─ clipboard.js
│  │     ├─ csv.js
│  │     ├─ formatDate.js
│  │     ├─ helpers.js
│  │     ├─ paperRules.js
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
│  ├─ handoff.md
│  └─ README.md
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
│  │  ├─ adminController.js
│  │  ├─ authController.js
│  │  ├─ coordinatorController.js
│  │  ├─ facultyController.js
│  │  ├─ forumController.js
│  │  ├─ groupController.js
│  │  ├─ notificationController.js
│  │  ├─ paperController.js
│  │  ├─ publicController.js
│  │  └─ reviewController.js
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
│  │  ├─ notification.routes.js
│  │  ├─ paper.routes.js
│  │  ├─ public.routes.js
│  │  └─ review.routes.js
│  ├─ scripts
│  │  ├─ db-check.js
│  │  ├─ db-setup.js
│  │  ├─ migrate_forum.js
│  │  └─ migrate_gallery.js
│  └─ utils
│     └─ auditLogger.js
├─ SUPABASE_SETUP.md
└─ vercel.json

```