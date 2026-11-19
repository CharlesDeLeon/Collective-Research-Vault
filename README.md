
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
│  │  │  │  └─ ModalShell.jsx
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
│  │  │  ├─ useLoginShowcase.js
│  │  │  ├─ useNotifications.js
│  │  │  ├─ usePaperDetail.js
│  │  │  ├─ useResearchGallery.js
│  │  │  └─ useStudentDashboard.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  ├─ AdminDashboard.jsx
│  │  │  │  ├─ AdminLayout.jsx
│  │  │  │  ├─ AuditTrail.jsx
│  │  │  │  ├─ ManageStorage.jsx
│  │  │  │  └─ ManageUsers.jsx
│  │  │  ├─ coordinator
│  │  │  │  ├─ CoordinatorDashboard.jsx
│  │  │  │  ├─ CoordinatorLayout.jsx
│  │  │  │  ├─ CoordinatorNotif.jsx
│  │  │  │  ├─ FacultyAssignment.jsx
│  │  │  │  ├─ ManageGroups.jsx
│  │  │  │  └─ ManageSubmissions.jsx
│  │  │  ├─ faculty
│  │  │  │  ├─ AssignmentsList.jsx
│  │  │  │  ├─ FacultyDashboard.jsx
│  │  │  │  ├─ FacultyLayout.jsx
│  │  │  │  └─ SubmissionDetail.jsx
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
│  │  │  ├─ adminService.js
│  │  │  ├─ api.js
│  │  │  ├─ authService.js
│  │  │  ├─ dashboardMocks.js
│  │  │  ├─ feedData.js
│  │  │  ├─ forumPlaceholder.js
│  │  │  ├─ galleryData.js
│  │  │  ├─ loginShowcase.js
│  │  │  ├─ notificationService.js
│  │  │  ├─ paperService.js
│  │  │  ├─ studentPapers.js
│  │  │  └─ uploadService.js
│  │  └─ utils
│  │     ├─ avatarColors.js
│  │     ├─ citation.js
│  │     ├─ clipboard.js
│  │     ├─ formatDate.js
│  │     ├─ helpers.js
│  │     ├─ paperRules.js
│  │     ├─ roleHome.js
│  │     ├─ roles.js
│  │     ├─ siteInfo.js
│  │     ├─ strands.js
│  │     └─ videoLinks.js
│  └─ vite.config.js
├─ database
│  ├─ migrations
│  │  └─ 001_research_papers_research_id.sql
│  ├─ package-lock.json
│  ├─ schema.sql
│  ├─ seed.sql
│  └─ setup.js
├─ netlify.toml
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
│  │  ├─ adminController.js
│  │  ├─ authController.js
│  │  ├─ coordinatorController.js
│  │  ├─ facultyController.js
│  │  ├─ notificationController.js
│  │  ├─ paperController.js
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
│  │  ├─ admin.routes.js
│  │  ├─ auth.routes.js
│  │  ├─ coordinator.routes.js
│  │  ├─ coordinatorSubmission.routes.js
│  │  ├─ faculty.routes.js
│  │  ├─ notification.routes.js
│  │  ├─ paper.routes.js
│  │  └─ review.routes.js
│  ├─ scripts
│  │  ├─ db-check.js
│  │  └─ db-setup.js
│  └─ utils
│     └─ auditLogger.js
└─ SUPABASE_SETUP.md

```