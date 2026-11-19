# CORE-V — UI/UX Handoff: Screens, Components & Workflows

**Purpose:** checklist for the UI/UX developer covering every screen, component, workflow, and edge case for the CORE-V overhaul.

**Status:** locked plan, pre-implementation.
**Roles:** Student, Adviser, External Panelist, System Admin, Public Reader (no account).
**Platform:** React SPA, Express API, Supabase Postgres + Storage, deployed on Netlify + Render.

---

## 0. Product context (what the UI is expressing)

CORE-V replaces the school's Facebook-group research workflow:

- Students post **titles, abstracts, and updates** in a feed.
- Everyone registered — students, advisers, external panelists — can **comment and like**.
- Advisers review, request revisions, approve, upload the **final and defended papers**, and **publish** to a public gallery.
- The public can browse **title, abstract, metadata, and APA citation** anonymously.
- Full papers are gated behind a **72-hour, single-use access link** approved by the group adviser.
- There is **no versioning** and **no reservation** concept.
- Feed and gallery are the same record: a paper is a post with a status workflow.

### Status → flair

| DB status | Flair shown |
|---|---|
| `proposal` | `[Proposal]` |
| `under_review` | `[Under Review]` |
| `for_revision` | `[For Revision]` |
| `approved` | `[Approved]` |
| `published` | `[Approved/Vault]` |

### Hard rules the UI must reflect

- Advisers create their own groups; admins can create for recovery.
- Advisers see only their own groups.
- Advisers alone publish papers and approve access requests.
- **Admins cannot publish papers or approve access requests.**
- Every group must have an adviser before its papers can be published.
- Publishing requires status `approved` + at least one uploaded paper file.
- After publish, the author cannot edit; the adviser can unpublish with a reason.
- Discussion posts are freely editable/deletable by their author.
- Likes only — no other reactions.
- Moderation is manual; no AI moderation.

---

## 1. Navigation map

| Role | Primary nav |
|---|---|
| Student | Feed · My Papers · Groups · Notifications · Profile |
| Adviser | Dashboard · Groups · Reviews · Access Inbox · Moderation · Reports · Analytics · Notifications · Profile |
| External Panelist | Dashboard · Groups · Notifications · Profile |
| System Admin | Dashboard · Users · Groups · Posts · Moderation · Reports · Audit · Storage · Analytics · Settings · Profile |
| Public reader | Gallery · About · Request Status (no account) |

Responsive:
- Student and Panelist: mobile-first with bottom nav.
- Adviser and Admin: desktop-first, usable on tablet.
- Public: mobile-first.

---

## 2. Shared components (build once, reuse everywhere)

- [ ] App shell: role-aware sidebar/topbar, mobile drawer, active state, user menu
- [ ] Avatar + role badge (`Student`, `Adviser`, `Panelist`, `Admin`)
- [ ] Post card: author, tags, timestamp, flair, body, media, like/comment counts, overflow menu
- [ ] Composer: type selector (Update / Video / Paper), text area, media URL field, submit
- [ ] Media slot: video player (frontend developer's component), image, PDF preview
- [ ] Flair badge for the five statuses
- [ ] Like button + count
- [ ] Comment list: threaded one level, edit/delete own, report
- [ ] Comment composer
- [ ] Filter bar: strand, section, group, year level, school year, flair, search; active-filter chips; clear all
- [ ] Empty state (no posts / no groups / no requests / no results)
- [ ] Loading skeletons
- [ ] Error state + retry
- [ ] Permission-denied (403) and not-found (404) pages
- [ ] Confirmation modal (publish, delete, remove, approve, decline)
- [ ] Toast notifications
- [ ] Pagination or infinite scroll
- [ ] Citation card (APA 7) + copy button
- [ ] File upload dropzone (adviser only)
- [ ] Notification dropdown + full page
- [ ] Profile/settings form
- [ ] Search results page

---

## 3. Student screens

| Screen | Route | Components | Notes |
|---|---|---|---|
| Feed | `/feed` | Composer, filter bar, post cards, pagination | All registered users' posts |
| Group feed | `/groups/:id` | Group header, members preview, filtered feed | Same feed, scoped |
| Paper form | `/submit` | Title, abstract, keywords, authors, strand/section/year (prefilled), video URL, submit | Edit allowed while `proposal` / `for_revision` |
| My Papers | `/my-papers` | Cards/table: title, flair, updated, actions (view, edit, resubmit) | **Resubmit for Review** button after revision |
| Paper detail | `/posts/:id` | Content, media, comments, status history, like | Metadata read-only once approved/published |
| Notifications | `/notifications` | List, mark read, filters | |
| Profile | `/profile` | Name, email, password, preferences | |

---

## 4. Adviser screens

### 4.1 Dashboard — `/adviser`

- [ ] Welcome header with name + role
- [ ] KPI cards: My Groups · Pending Reviews · Access Requests · Published Papers
- [ ] Quick actions: Create Group · Review Queue · Access Inbox
- [ ] Recent activity feed (comments, status changes, new requests)
- [ ] Empty state when no groups exist → **Create your first group**

### 4.2 My Groups — `/adviser/groups`

- [ ] Group cards: name, strand, section, year level, school year, member count, paper count, pending reviews
- [ ] Create Group CTA
- [ ] Search/filter
- [ ] Empty state

### 4.3 Create / Edit Group — `/adviser/groups/new`, `/adviser/groups/:id/settings`

- [ ] Group name
- [ ] Strand dropdown (STEM, ABM, HUMSS, GAS)
- [ ] Section (free text or dropdown)
- [ ] Year level (11 / 12)
- [ ] School year
- [ ] Adviser (auto-filled, read-only)
- [ ] Save / cancel
- [ ] Validation: duplicate group name within section, required fields

### 4.4 Group Detail — `/adviser/groups/:id`

Header:
- [ ] Group name, strand/section/year, adviser, member count
- [ ] Edit group · Manage members · Invite panelist
- [ ] Previous / Next group navigation + group switcher dropdown

Tabs:
- [ ] **Feed** — group-scoped posts, composer, filter bar, moderation menu
- [ ] **Members** — table: name, email, year level, joined, status; Add Student; Remove
- [ ] **Panelists** — table: name, email, assigned date, status; Invite; Revoke
- [ ] **Papers** — table: title, author, flair, last updated, files, actions (Review, Publish)
- [ ] **Analytics** — group-level cards and charts

Add Student modal:
- [ ] Search existing accounts by name/email
- [ ] If not found: "Ask a System Admin to create the account"
- [ ] Confirm add

Invite Panelist modal:
- [ ] Personal email
- [ ] Send invite
- [ ] Pending invite list (later, once email delivery exists)

### 4.5 Review Queue — `/adviser/reviews`

- [ ] Count header
- [ ] Previous / Next group navigation
- [ ] Filters: group, strand, section, status, search
- [ ] Table: title, author, group, flair, last updated, waiting since, action
- [ ] Empty state: "Nothing waiting for review"

### 4.6 Review Screen — `/adviser/reviews/:postId`

Content:
- [ ] Breadcrumb
- [ ] Paper header: title, flair, author, group, tags, timestamps
- [ ] Abstract + metadata
- [ ] Media player
- [ ] Discussion thread + comment composer
- [ ] Status history timeline

Adviser action panel (sticky):
- [ ] Status selector: `Under Review` → `For Revision` → `Approved`
- [ ] Note field attached to status change
- [ ] Comment box
- [ ] Abstract editing (adviser override at publish time)
- [ ] Author consent status: granted / pending / declined
- [ ] **Request consent** action (notifies the author)
- [ ] File upload: **Final paper** and **Defended paper** (dropzone, progress, replace, remove)
- [ ] Citation preview (APA 7) + copy
- [ ] Publish checklist: approved? files present? citation generated? author consent granted?
- [ ] **Publish to Gallery** button (disabled with reason until checklist passes)
- [ ] Unpublish action (with reason)
- [ ] Publish confirmation modal: shows public preview + citation + consent timestamp
- [ ] Success toast + link to gallery entry
- [ ] Previous / Next group navigation

### 4.7 Access Inbox — `/adviser/inbox`

- [ ] Counters: Pending · Approved · Declined · Expired
- [ ] Filters: status, group, paper, date
- [ ] Table: requester, email, paper, group, purpose snippet, requested date, status, action
- [ ] Empty state

Request detail:
- [ ] Requester name, email, institution
- [ ] Paper card (title, abstract snippet, group)
- [ ] Full purpose
- [ ] Approve / Decline buttons
- [ ] Decision note field
- [ ] Link status after approval: sent, expiry (72h), used, revoked
- [ ] Resend / revoke link
- [ ] Confirmation modals

### 4.8 Moderation — `/adviser/moderation`

- [ ] Report queue: type, content snippet, reporter, reason, date
- [ ] Detail: full content, hide / remove / restore, reason
- [ ] Audit note
- [ ] Filters

### 4.9 Analytics — `/adviser/analytics`

- [ ] Group selector
- [ ] Date range picker
- [ ] KPI cards: posts, papers by flair, comments, likes, access requests, approvals, downloads
- [ ] Charts: activity over time, papers by status, request outcomes
- [ ] Export CSV (later)

### 4.10 Notifications / Profile

- [ ] Notification list with type filters
- [ ] Profile form

### 4.11 Author Consent Step — `/posts/:id` + `/adviser/reviews/:postId`

Student side:
- [ ] "Allow public release" toggle on their paper
- [ ] Consent text explaining what becomes public (title, abstract, citation, metadata)
- [ ] Consent timestamp shown once granted
- [ ] Withdraw consent while not yet published
- [ ] Notification to adviser when consent changes

Adviser side:
- [ ] Consent status chip: granted / pending / declined
- [ ] **Request consent** action
- [ ] Publish blocked with reason if consent is not granted
- [ ] Consent timestamp shown in the publish confirmation modal
- [ ] Consent changes written to the audit log

Rules:
- Student opt-in is required before a paper can be published.
- Adviser confirms consent at publish; no self-attestation-only path.
- Withdrawing consent after publish requires unpublish first.

### 4.12 Reports on Research Outputs — `/adviser/reports`

- [ ] Filters: strand, section, year level, school year, group, date range
- [ ] Report table: papers by status, published outputs, access requests, approvals/declines, downloads
- [ ] Group-level and strand-level totals
- [ ] Export CSV
- [ ] Print-friendly view
- [ ] Empty state
- [ ] Admin global equivalent at `/admin/reports`

Note: Reports are exportable snapshots; Analytics is trends over time.

---

## 5. External panelist screens

| Screen | Route | Components |
|---|---|---|
| Dashboard | `/panelist` | Assigned group cards, recent posts, notifications |
| Group feed | `/panelist/groups/:id` | Group header, feed, comment |
| Paper detail | `/panelist/posts/:id` | Abstract, media player, comments, like |
| Notifications | `/panelist/notifications` | List |
| Profile | `/panelist/profile` | Form |
| Invite acceptance | `/invite/:token` | Set password (deferred until email works) |

Panelists can read and comment, but cannot set status, upload files, publish, or approve access.

---

## 6. System Admin screens

### 6.1 Dashboard — `/admin`

- [ ] System health strip: database, storage, API
- [ ] KPI cards: users by role, groups, posts, published papers, pending access requests, storage used
- [ ] Recent audit events
- [ ] Quick actions: Create User · Audit Log · Storage

### 6.2 Users — `/admin/users`

- [ ] Create User button
- [ ] Filters: search, role, active/inactive, group
- [ ] Table: name, email, role, status, groups, last login, actions
- [ ] Row actions: View · Edit · Change Role · Reset Password · Deactivate
- [ ] Bulk actions (optional)
- [ ] Empty state

Create/Edit User:
- [ ] Name, email, role dropdown
- [ ] Temporary password
- [ ] Program/strand (for students)
- [ ] Active toggle
- [ ] Group assignment (optional)
- [ ] Save / cancel

User Detail — `/admin/users/:id`:
- [ ] Profile card
- [ ] Role + status
- [ ] Group memberships
- [ ] Recent posts
- [ ] Audit trail for this user
- [ ] Deactivate / reactivate
- [ ] Change role modal with warning
- [ ] Reset password modal

### 6.3 Roles — `/admin/roles`

- [ ] Read-only permission matrix: capabilities × 4 roles
- [ ] Explanation that roles are fixed
- [ ] Optional later: editable matrix / per-paper overrides

### 6.4 Groups — `/admin/groups`

- [ ] Filters: strand, section, year, adviser, status
- [ ] Table: group, strand, section, adviser, members, papers, status
- [ ] Group detail: overview, members, panelists, papers
- [ ] **Reassign Adviser** modal (critical when an adviser leaves)
- [ ] Archive group with confirmation
- [ ] Admin can create a group for recovery

### 6.5 Posts / Papers — `/admin/posts`

- [ ] Filters: type, flair, group, author, visibility, date
- [ ] Table: title, type, author, group, flair, visibility, comments, updated
- [ ] Detail drawer: content preview, media, metadata
- [ ] Actions: hide, remove, restore (no publish/unpublish)
- [ ] Note in UI: admins cannot publish or approve access

### 6.6 Moderation — `/admin/moderation`

- [ ] Global report queue
- [ ] Filters: type, group, status, date
- [ ] Detail: content, reporter, reason
- [ ] Hide / remove / restore with reason
- [ ] Audit entry created automatically

### 6.7 Access Requests (oversight) — `/admin/access-requests`

- [ ] Read-only table: requester, paper, adviser, status, requested date, decision
- [ ] Filters
- [ ] Detail view
- [ ] No approve/decline buttons — shows "Handled by group adviser"
- [ ] Link to reassign adviser if stuck

### 6.8 Audit Log — `/admin/audit`

- [ ] Filters: actor, action, target type, date range, search
- [ ] Table: timestamp, actor, action, target, IP, request ID
- [ ] Detail drawer: before/after JSON diff, metadata
- [ ] Export CSV
- [ ] "Immutable" badge
- [ ] No edit/delete actions

### 6.9 Storage & Backup — `/admin/storage`

- [ ] Usage summary: total, by bucket, file count
- [ ] Largest files table
- [ ] Missing/orphaned files
- [ ] Upload policy note (size/type)
- [ ] No destructive delete of paper files; archive only

Backup & Recovery panel:
- [ ] Last backup timestamp + provider status
- [ ] Backup frequency / retention (from Supabase plan)
- [ ] Export data: CSV/JSON per table (users, groups, posts, requests, audit)
- [ ] Export file manifest
- [ ] Download links expire
- [ ] Export events written to the audit log
- [ ] Restore guidance + "request restore" contact/runbook
- [ ] Note: actual database restore is an ops task, not a UI action

### 6.10 Analytics — `/admin/analytics`

- [ ] Global KPI cards
- [ ] Date range
- [ ] Charts: users by role, posts over time, papers by flair, access requests, downloads, active users
- [ ] Export CSV

### 6.11 Announcements / Notifications — `/admin/notifications`

- [ ] Compose: title, body, audience (all / role / group)
- [ ] Preview
- [ ] Send confirmation
- [ ] Sent history

### 6.12 Settings — `/admin/settings`

- [ ] Institution name/logo
- [ ] Strands list (STEM, ABM, HUMSS, GAS)
- [ ] Sections per strand
- [ ] School years
- [ ] Access link expiry (default 72h)
- [ ] Upload size/type limits
- [ ] Email transport status (placeholder)
- [ ] Maintenance mode
- [ ] Save/cancel

### 6.13 Profile

- [ ] Profile form, password change

---

## 7. Public reader screens

| Screen | Route | Components |
|---|---|---|
| Landing | `/` | Hero, search, featured papers, CTA to gallery |
| Gallery | `/gallery` | Search, filters (strand, section, year), paper cards, pagination |
| Paper page | `/paper/:slug` | Title, authors, abstract, keywords, strand/section/year, adviser, published date, APA citation + copy, **Request Full Paper** |
| Request form | `/paper/:slug/request` or modal | Name, email, institution, purpose, consent checkbox, submit |
| Request submitted | `/request/submitted` | Reference code, status link, what happens next |
| Request status | `/access/status/:ref` | Pending / approved / declined + reason, re-request link |
| Access confirm | `/access/:token` | Paper title, **Open Full Paper** / **Download PDF** buttons (does not consume on page load) |
| Unlocked paper view | `/access/:token/view` | Inline PDF viewer using a short-lived signed URL; download button; token already consumed |
| Access result | `/access/:token/download` | Success, already used, expired, revoked |
| About | `/about` | Project info, contact |

No account, no nav, no profile.

---

## 8. Adviser workflow (step by step)

```
First login
  └─ no group → Create Group
       └─ Add students (existing accounts)
       └─ Invite external panelists (later: email)

Group feed
  ├─ open paper post → comment → set For Revision
  │     └─ student edits → Resubmit for Review → Under Review
  ├─ defense done → mark Approved
  ├─ upload Final + Defended PDFs
  ├─ Publish to Gallery → confirmation modal → appears publicly
  └─ Access Inbox → review request → approve/decline → 72h link

Analytics → own groups
Moderation → own group reports
```

UI rules:
- Publish is blocked until status is `Approved`, at least one file exists, and the author has granted public-release consent.
- After publish, the author can't edit; adviser can unpublish with a reason.
- Adviser sees only their own groups.
- No admin override for publish or access approval.
- "Next group" navigation lets the adviser cycle groups without returning to the list.

---

## 9. System Admin workflow (step by step)

```
Login → Dashboard
  ├─ Users: create / edit / deactivate / change role / reset password
  ├─ Groups: view all → reassign adviser / archive / create for recovery
  ├─ Posts: view → hide / remove / restore (no publish)
  ├─ Moderation: global report queue
  ├─ Access Requests: read-only oversight
  ├─ Audit: filter → detail diff → export
  ├─ Storage: usage → largest files → orphans
  ├─ Analytics: global
  └─ Settings: strands / sections / school years / link expiry
```

UI rules:
- Admin cannot publish papers or approve access requests.
- If a group is stuck, the admin reassigns the adviser; the new adviser handles it.
- Admin actions on content are moderation only, and every action lands in the audit log.
- Deactivating a user keeps their posts and history intact.

---

## 10. Edge cases the UI must cover

- [ ] Adviser has no groups → create CTA
- [ ] Group has no adviser → admin must assign before publish
- [ ] Paper approved but no files → publish disabled with reason
- [ ] Author edits after `For Revision` → **Resubmit for Review** button
- [ ] Access link expired / used / revoked → status page + re-request
- [ ] Email send failure → show link in adviser inbox for manual copy
- [ ] Deactivated user → login blocked, content remains
- [ ] Archived paper → removed from gallery, links revoked
- [ ] Duplicate group name in the same section
- [ ] Strand/section mismatch
- [ ] Student moves group → old posts keep original tags
- [ ] Empty search results
- [ ] Unauthorized route → 403 page
- [ ] Session expired → modal + redirect to login

---

## 11. Priority for the UI/UX developer

### P0 — first working demo
- [ ] Login, app shell, post card, composer, comment thread, like
- [ ] Feed + filter bar
- [ ] Paper form
- [ ] Adviser review screen + status panel + file upload + publish modal
- [ ] Gallery + paper page + citation
- [ ] Request form + adviser inbox
- [ ] Admin users list + create/edit user

### P1 — completes the workflows
- [ ] Group detail (members, panelists, papers tabs)
- [ ] My Papers + resubmit
- [ ] Author consent step
- [ ] Previous / Next group navigation
- [ ] Reports on research outputs
- [ ] Invite/accept screen (placeholder email transport)
- [ ] Unlocked full-paper viewer
- [ ] Moderation queue
- [ ] Audit log
- [ ] Notifications

### P2 — polish
- [ ] Analytics charts
- [ ] Settings
- [ ] Announcements
- [ ] Role matrix
- [ ] Storage screen
- [ ] Backup & recovery panel
- [ ] Google Sign-In (if approved)
- [ ] Export CSV

---

## 12. Open UX questions to settle

1. **Add student:** search existing accounts, or send an email invite? (Currently accounts are admin-created.)
2. **Resubmit:** explicit button, or automatic on edit? (Recommend explicit button.)
3. **Navigation:** sidebar for adviser/admin, bottom nav for student/panelist — confirm.
4. **Publish checklist:** inline panel or modal wizard?
5. **Analytics depth:** KPI cards only, or charts from day one?
6. **Role matrix:** read-only documentation, or editable permissions?
7. **Announcements:** needed for MVP, or later?
8. **Brand:** keep the navy/gold CORE-V palette, or full visual redesign?
9. **Author consent:** student opt-in toggle, adviser attestation, or both? (Recommend both; student opt-in is required.)
10. **Google Sign-In:** keep email/password only, or add Google OAuth? Personal email login already works with email/password; Google is a separate auth provider and a larger change.
11. **Reports format:** CSV only, print-friendly page, or PDF export?
12. **Backup/restore:** read-only backup status + data export, or full restore UI? (Actual DB restore is an ops runbook.)
13. **Full paper:** download only, or inline PDF viewer after the single-use link is consumed?

---

## 13. Deliverables to request from UI/UX

- [ ] Low-fidelity wireframes for every P0 screen
- [ ] High-fidelity screens for adviser review, publish flow, admin users, public gallery
- [ ] Component library with states: default, hover, focus, disabled, loading, empty, error
- [ ] Responsive layouts: desktop, tablet, mobile
- [ ] Design tokens: colors, typography, spacing, radius, shadows
- [ ] Status/flair color system
- [ ] Icon set
- [ ] Interaction specs: modals, toasts, confirmations, destructive actions
- [ ] Copy deck: labels, empty states, error messages, confirmation text
- [ ] Accessibility notes: contrast, focus order, keyboard, alt text
- [ ] Clickable prototype for adviser review → publish and admin user management
- [ ] Figma handoff with auto-layout and named components

---

## 14. Cross-check against the existing implementation checklist

Legend: **Covered** = already in this plan · **Gap** = added to this plan · **Obsolete** = conflicts with the locked role model · **Dependency** = existing frontend work must be merged/rewired.

### Adviser

| Existing checklist item | Status | Action |
|---|---|---|
| Build Access Request Inbox | Covered | `/adviser/inbox` in §4.7 |
| Build Request Review Screen (approve/decline) | Covered | Request detail in §4.7 |
| Build Group Board | Covered | Group Detail → Feed tab in §4.4 |
| Build Author Consent Step | **Gap → added** | §4.11; student opt-in + adviser confirmation; publish blocked without it |
| Add "Filter by strand" UI | Covered | Shared filter bar in §2 |
| Add "Next group" navigation | **Gap → added** | §4.4, §4.5, §4.6 |
| Build Dedicated Publish Flow (final paper + abstract) | Covered + expanded | §4.6: final/defended upload, abstract edit, consent gate, checklist, modal |
| Build Analytics View | Covered | §4.9 |
| Build Reports on Research Outputs | **Gap → added** | §4.12 + `/admin/reports` |
| Add Discussion Moderation UI | Covered | §4.8 + post overflow menu |
| Populate Coordinator Dashboard | **Obsolete** | Coordinator removed; delete stub or redirect to `/adviser` |
| Populate Coordinator Notifications | **Obsolete** | Coordinator removed; use shared `/notifications` |

### Outside Panelist

| Existing checklist item | Status | Action |
|---|---|---|
| Add role to client router | Covered, renamed | Register `external_panelist`; remove `faculty`/`coordinator` |
| Build Invite and Accept Screen | Covered, deferred → P1 | `/invite/:token`; test with placeholder email transport |
| Build Panelist Portal | Covered | `/panelist` in §5 |
| Build Paper and Video Viewing Page | Covered | `/panelist/posts/:id`; media player slot |
| Build Commenting Interface | Covered | Shared comment thread in §2 |

### Public Reader

| Existing checklist item | Status | Action |
|---|---|---|
| Build Request Status Page | Covered | `/access/status/:ref` in §7 |
| Build Unlocked Full-Paper View | **Partial → added** | `/access/:token/view` inline viewer in §7 |
| Connect Public Gallery to Real Data | **Dependency** | Existing gallery is UI-only; wire to `GET /api/public/papers`, remove mock data |
| Wire Up Access Request Form | **Dependency** | Existing form saves nothing; wire to `POST /api/public/access-requests`, show reference code |

### System Admin

| Existing checklist item | Status | Action |
|---|---|---|
| Populate "Manage Storage" (backup/restore) | **Partial → added** | §6.9: usage + backup status + data/file export + restore runbook; full restore is ops |
| Add Personal Email / Google Sign-In UI | **Partial / decision** | Personal email works with email/password; Google OAuth is a separate provider — see §12 Q10 |
| User Management & Audit Trail | Covered, adapt | Preserve existing UI; update role names, immutable audit, hide publish/approve actions |

### Stale references to remove or remap

- **"Adviser (Coordinator & Principal)"** — coordinator and principal/moderator are removed. Their duties are absorbed by the Adviser.
- **Coordinator Dashboard / Coordinator Notifications** — delete the stubs or redirect to the adviser dashboard and shared notifications.
- **Client router roles** — replace `faculty`, `coordinator`, `admin` with `adviser`, `external_panelist`, `sysadmin` (plus `student`).
- **"Published" status dropdown** — replaced by the dedicated publish flow with checklist, consent, and files.
- **Moderator/Principal access inbox** — now the adviser inbox; no moderator role.

### Existing frontend work to preserve

- [ ] User Management and Audit Trail UI — keep, adapt to the four new roles and immutable audit
- [ ] Public gallery UI — keep, replace hardcoded data with the public API
- [ ] Access request form UI — keep, connect it to the API and add validation/error states
- [ ] Media player — integrate from the frontend developer's branch when merged; leave a media slot in the post card
- [ ] Tailwind setup — already on `main` (commit `6d967b2`); keep it

### Merge order

1. Merge the frontend developer's branch (media player, gallery, request form) into `main` first.
2. Reconcile duplicate components against this plan.
3. Then start Phase 0/1 so the role and schema migration doesn't collide with their work.
