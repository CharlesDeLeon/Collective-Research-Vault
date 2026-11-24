# Roleplay Workflow Checklist (CORE-V)

Quick reference for walking through the app as each role.
Accounts use password `Password123!` unless noted.

---

## 1. System Admin
Login: `sysadmin@corev.test`

- [ ] Log in → lands on Admin dashboard
- [ ] Manage Users: create/edit/deactivate users, assign roles (Student, Adviser, Panelist)
- [ ] Manage Storage: view storage usage
- [ ] Audit Trail: review logged actions
- [ ] Announcements: create/edit/delete announcements
- [ ] App Settings: adjust system settings
- [ ] Admin Analytics / Reports: view aggregates
- [ ] Moderation: review flagged content
- [ ] Verify panelist/forum access is platform-wide (no scoping)

---

## 2. Faculty (Adviser / Coordinator)
Login: `faculty@corev.test` or `faculty2@corev.test` or `coordinator@corev.test`

- [ ] Log in → Adviser dashboard with submission queue
- [ ] Groups: create/edit research groups, manage members
- [ ] Submissions: open a paper in Review
- [ ] Update stage (Proposal → Defense → Final) and status (Under Review / For Revision / Approved / Rejected)
- [ ] Add feedback comments
- [ ] Paper files: upload a file (replaces student's), delete with X button, download
- [ ] Publish to gallery: enter citation, confirm author consent, publish
- [ ] Unpublish (with reason) if needed
- [ ] Access requests inbox: approve (sends one-time 72h link) / decline
- [ ] Analytics & reports
- [ ] Moderation panel

---

## 3. Student
Login: `student2@corev.test` (or student3/student4; `student1` password changed during testing)

- [ ] Log in → Student dashboard
- [ ] Join/create a research group
- [ ] Submit a paper (title, abstract, keywords, authors, strand, file upload, consent)
- [ ] View My Papers list and status
- [ ] Replace/resubmit file before approval (blocked after approved/published → 409)
- [ ] Grant author consent (required for publishing)
- [ ] View feedback comments from adviser
- [ ] Activity history
- [ ] Forum: post/comment/like (if enabled)
- [ ] Gallery: browse published papers

---

## 4. External Panelist
Login: panelist account (created by admin)

- [ ] Log in → Panelist dashboard
- [ ] Forum tab: read, comment, like, report posts (platform-wide)
- [ ] Gallery tab: browse published papers
- [ ] Papers: read-only view
- [ ] Confirm NO ability to: change status, upload files, publish, approve access, moderate
- [ ] Confirm no moderation endpoints accessible (403)

---

## 5. Outside Reader (public, no login)
No account needed.

- [ ] Open landing page → browse featured papers
- [ ] Open Gallery → search/filter
- [ ] Open a paper detail → read abstract/metadata
- [ ] Click "Request access" → fill name/email/purpose, check consent → submit
- [ ] Note the reference code (e.g. CV-XXXXXX)
- [ ] Open "Check status" → enter reference code → see status
- [ ] After adviser approves: status page shows "Download PDF" button → download
- [ ] (If email configured) use the one-time link from email → Open Full Paper / Download PDF
- [ ] Confirm link is single-use: re-opening shows "already used" → "Request again"
- [ ] Submit a new request after a used/expired link

---

## Suggested roleplay order
1. Sysadmin creates accounts (faculty, student, panelist) and sets roles.
2. Student joins group, submits paper, grants consent.
3. Faculty reviews, uploads/replaces file, comments, approves, publishes.
4. Panelist browses gallery, participates in forum.
5. Outside reader requests access → faculty approves → reader downloads.
6. Sysadmin reviews audit trail and analytics.
