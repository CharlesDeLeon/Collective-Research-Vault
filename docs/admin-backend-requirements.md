# Admin backend contract — current state

**Purpose:** implementation checklist for the Admin backend contract the frontend is prepared to consume. Most Admin capabilities are capability-gated; this document records the exact endpoints, fields and response shapes the frontend expects and the work still owned by the backend developer. It is not a redesign.

**Source of truth:** `docs/handoff.md`. If anything here conflicts with the handoff, `docs/handoff.md` wins and is not edited here. Admin-relevant hard rules still apply:

**Backend status:** substantial implementation landed. See `docs/backend-status-report.md` for the current state, required migrations, and Phase R flag guidance.

1. **Advisers alone publish papers and approve/decline access requests.** Admins have oversight only.
2. **Admins cannot publish papers or approve access requests** (`docs/handoff.md:39`, `:354`).
3. **Every group must have an adviser before its papers can be published** (`docs/handoff.md:40`).
4. **No destructive delete of paper files; archive only** (`docs/handoff.md:372`).
5. **Roles are fixed.** The permission matrix is read-only for now; editable roles are an optional later item (`docs/handoff.md:318-322`).
6. **Audit is immutable.** No edit/delete actions; export events must be written to the audit log and download links must expire (`docs/handoff.md:357-382`).
7. **Database restore is an ops task, not a UI action** (`docs/handoff.md:382`).

**Current status:** all Admin-specific capability flags are `false` (`client/src/services/backendSupport.js:14-31,35-39`). The shared `changePassword` and `profileSync` flags are `true` and are used by Admin Profile. Gated UI stays disabled or caveated until the matching endpoint/field is verified in Phase R; flip one feature area at a time. `adminEditRoles` is intentionally `false` and is not a backend gap.

**Note:** `docs/handoff.md:5` still reads "Status: locked plan, pre-implementation." It remains the source of truth and is not edited here.

Base URL is `/api` (`client/src/services/api.js:5-7`). Routes use the JWT `Authorization: Bearer <token>` header. Every `/admin/*` route is behind `authMiddleware` and `roleMiddleware('sysadmin')` (`server/routes/admin.routes.js:19-21`). Legacy role `admin` normalizes to `sysadmin` in admin controllers (`server/controllers/adminController.js:6-16`). Posts, groups and access requests are reused from the adviser/faculty surfaces; do not add admin publish/approve routes.

---

## 0. Implemented contract (verified in `server/routes` / `server/controllers`)

| Route | Current state | Evidence |
|---|---|---|
| `GET /admin/users` | Paginated list with `role`, `search`, `status` filters. Returns `{ data, pagination }`; rows omit `groups` and `last_login_at`; `groupId` is ignored | `admin.routes.js:24`, `adminController.js:19-90` |
| `GET /admin/users/:userId` | Returns user fields plus `permissions`; no `groups` or `last_login_at` | `admin.routes.js:26`, `adminController.js:93-117` |
| `POST /admin/users` | Creates user and returns `{ message, userId }`; `groupIds` is ignored | `admin.routes.js:25`, `adminController.js:279-338` |
| `PUT /admin/users/:userId` | Updates name/email/program/status/role; `groupIds` is ignored | `admin.routes.js:27`, `adminController.js:186-276` |
| `PATCH /admin/users/:userId/role` | Implemented with self/last-sysadmin guards and audit insert | `admin.routes.js:29`, `adminController.js:120-183` |
| `DELETE /admin/users/:userId` | Soft deactivation with self/last-active-sysadmin guards | `admin.routes.js:28`, `adminController.js:341-397` |
| `GET /admin/roles/permissions`, `GET /admin/roles/:role/permissions` | Implemented; matrix is read-only in the UI | `admin.routes.js:32-33`, `adminController.js:400-426` |
| `GET /admin/stats/users` | Bare `[{ role, count }]` array | `admin.routes.js:36`, `adminController.js:429-442` |
| `GET /admin/audit-logs`, `GET /admin/audit-summary` | Paginated logs and summary exist, but `search`, `request_id` and before/after fields are absent | `admin.routes.js:37-38`, `adminController.js:445-480`, `auditLogger.js:45-147` |
| `GET /forum/posts`, `GET /forum/posts/:id` | List supports `groupId`, `strand`, `section`, `yearLevel`, `schoolYear`, `status`, `search`, `reported`, `page`, `limit`; always excludes `removed = TRUE`; no total count | `forum.routes.js:14-16`, `forumController.js:43-107,157-193` |
| `POST /forum/posts/:id/hide`, `POST /forum/posts/:id/remove` | Implemented for `adviser` and `sysadmin`; no audit write from these handlers | `forum.routes.js:21-22`, `forumController.js:274-297` |
| `POST /forum/posts/:id/report` | Only sets `reported = TRUE`; no reason or reporter captured | `forum.routes.js:20`, `forumController.js:262-272` |
| `GET /forum/posts/:id/comments` | Returns normalized comments with `hidden`/`removed`; no per-comment hide/remove route | `forum.routes.js:25`, `forumController.js:299-315,29-40` |
| `GET /groups`, `GET /groups/:id`, `POST /groups`, `PUT /groups/:id`, `DELETE /groups/:id` | Implemented; create sets `adviser_id = req.user.user_id`; update ignores `adviser_id`; delete is hard delete; no archive | `group.routes.js:13-22`, `groupController.js:3-118` |
| `GET /adviser/access-requests`, `GET /adviser/access-requests/:id` | Sysadmin allowed by role middleware and reused by Admin oversight; approve/decline routes exist but must stay adviser-only workflows | `access.routes.js:9-16`, `adminService.js:134-142` |
| `GET /api/health` | Returns `{ status, database }`; no `storage` field | `server/index.js:67-75` |
| `/admin/storage/*`, `POST /admin/users/:id/reset-password`, `/admin/notifications`, `/admin/settings`, `/admin/reports` | Not registered | `admin.routes.js:23-38`, `server/index.js:46-61` |

---

## 1. Users and roles

### `GET /api/admin/users` — extend, do not replace

Existing query params: `page`, `limit`, `role`, `search`, `status`. Keep `{ data, pagination }`.

Required additions:

- Include `last_login_at` on every row. The column exists (`database/schema.sql:44`) and is written on login (`authController.js:34-35`), but the admin SELECT omits it (`adminController.js:24-28`).
- Accept `groupId` and filter through `group_members`.
- When `backendSupport.adminUserGroups` is verified, each row must include `groups` as `[{ group_id, group_name }]` or the UI falls back to a count (`client/src/pages/admin/ManageUsers.jsx:37-40`).

`backendSupport.adminUserGroups` unlocks the Groups filter/column; `backendSupport.adminLastLogin` unlocks the last sign-in column.

### `GET /api/admin/users/:userId` — extend

Add `groups: [{ group_id, group_name }]` and `last_login_at` while preserving the existing `permissions` object (`adminController.js:109-112`). Recent posts are loaded separately through `GET /forum/posts?authorId=:userId`, so no `recentPosts` field is required.

### `POST /api/admin/users/:userId/reset-password` — missing

Request: no body. Response consumed by `client/src/services/adminService.js:163-166` and `ResetPasswordModal.jsx:16`:

```json
{ "temporaryPassword": "GeneratedValue123!" }
```

Accept `{ data: { temporaryPassword } }` as well. Hash with bcrypt, force a password change or mark the temporary password as such if the auth layer supports it, and write an audit entry. Do not return an existing password hash.

### `POST /api/admin/users` / `PUT /api/admin/users/:userId` — extend

Both must accept and persist `groupIds: []` on `group_members`. The client sends it from `UserFormModal.jsx` only when `adminUserGroups` is enabled. Create must return `userId`, which the client already reads (`adminService.js:15-18`); group assignment should be atomic with user creation.

### Deviations from the original brief

- Legacy role names are normalized, not rejected (`adminController.js:6-16`). Keep this behavior for existing data.
- Role changes remain allowed from Users, but `/admin/roles` stays read-only; `adminEditRoles` is intentionally `false` (`backendSupport.js:31`, `unsupportedNote.adminEditRoles`).
- `last_login_at` exists in the schema but is not surfaced by any admin read query yet.

---

## 2. Groups and access oversight

### `PUT /api/groups/:id` — extend

Accept and persist `adviser_id`. The reassignment modal sends `{ adviser_id }` through `updateAdminGroup()` (`client/src/components/admin/ReassignAdviserModal.jsx:31-42`, `adminService.js:121-123`). Validate that the target is an active adviser. Keep existing group fields unchanged. Write an audit entry.

### `POST /api/groups/:id/archive` — missing

Request: no body. Response: `{ "message": "Group archived" }`.

Persist an archive state and expose it on `GET /groups` and `GET /groups/:id` as `archived: true` or `status: 'archived'`. Archiving must hide the group from active lists without deleting members, submissions or files. This is the only group-deletion behavior allowed by `docs/handoff.md:372`.

### `POST /api/groups` — current behavior matters

`createGroup()` sets `created_by` and `adviser_id` to `req.user.user_id` (`groupController.js:70-85`). A sysadmin-created recovery group therefore has the sysadmin as adviser until `adminReassignAdviser` is used. Do not rely on `POST /groups` to assign a real adviser; the UI shows the reassignment note for this reason.

### `GET /api/adviser/access-requests` — reuse only

Admin Access Requests is read-only oversight (`client/src/pages/admin/AdminAccessRequests.jsx`). Keep `counts` in the response (`adminService.js:134-137`) and keep filters working. Do **not** add admin approve/decline buttons or routes; stuck requests point to adviser reassignment instead.

### Acceptance condition

`adminReassignAdviser` and `adminArchiveGroup` flip only after the write succeeds, list/detail reflect the new adviser and archive state, and audit entries are returned through `GET /admin/audit-logs`.

---

## 3. Posts, papers and moderation

### `GET /api/forum/posts` — extend

Keep current params and add:

| Param | Values | Meaning |
|---|---|---|
| `type` | `update`, `video`, `paper` | Post type |
| `authorId` | user id | Posts by one author; used by `AdminUserDetail` recent posts |
| `visibility` | `visible`, `hidden`, `reported` | `reported` maps to `fp.reported = TRUE` |
| `dateFrom`, `dateTo` | `YYYY-MM-DD` | Created-at range |
| `includeRemoved` | `true` | Include `removed = TRUE` rows for restore actions |

`adminPostFilters` gates the first five params. `includeRemoved` is separately gated by `adminRestoreRemoved` (`client/src/pages/admin/AdminPosts.jsx:56-65,208-246`).

For `adminListTotals`, return a total alongside `data`, matching the admin list convention:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 25, "total": 0, "pages": 0 }
}
```

`client/src/services/adminService.js:72-75` currently discards everything except `data`; Phase R must update that helper when the total is available. `AdminPosts` currently infers `hasNext` from `posts.length === PAGE_SIZE`.

### Report details — missing

`reportPost()` only sets `reported = TRUE` (`forumController.js:262-272`). Extend report capture and read responses with:

```json
{
  "reason": "Inappropriate content",
  "reporterName": "Juan Dela Cruz",
  "reporterEmail": "juan@example.edu"
}
```

Snake_case variants `reasonText`, `reporter_name`, `reporter_email` and `reporter` are accepted by `client/src/components/admin/PostDetailModal.jsx:58-60`. Store the reason/reporter when the report is created and include them in both list and detail responses. `adminModerationReason` flips only when these fields are populated.

### Post actions — missing endpoints

Existing: `POST /forum/posts/:id/hide` accepts `{ "hidden": true|false }`; `POST /forum/posts/:id/remove` sets `removed = TRUE` (`forumController.js:274-297`).

Add:

- `POST /api/forum/posts/:id/restore` → clear `removed`, return `{ "message": "Post restored" }`. Gate `adminRestoreRemoved`.
- `POST /api/forum/posts/:id/dismiss-report` → clear `reported` without changing hidden/removed state, return `{ "message": "Report dismissed" }`. Gate `adminDismissReport`.

### Comment actions — missing endpoints

Add under `roleMiddleware('adviser', 'sysadmin')` where appropriate:

- `POST /api/forum/comments/:id/hide` with `{ "hidden": true|false }`, setting `forum_comments.hidden` (`database/schema.sql:276`).
- `POST /api/forum/comments/:id/remove` setting `removed = TRUE`, not hard-deleting (`database/schema.sql:277`).

`normalizeComment()` already returns `hidden` and `removed` (`forumController.js:29-40`), and the detail modal calls these from `usePostActions` (`PostDetailModal.jsx:44-50`). Gate both with `adminCommentModeration`.

### Audit requirement

Every hide, remove, restore, dismiss-report and comment action must write an immutable audit entry through `req.audit.log(...)` or an equivalent helper that stores `request_id`. The current forum handlers do not audit their moderation writes.

---

## 4. Audit log and dashboard

### `GET /api/admin/audit-logs` — extend

Existing params: `page`, `limit`, `action`, `targetType`, `targetId`, `userId`, `dateFrom`, `dateTo` (`adminController.js:445-458`). Add `search` and match against action, actor name/email, target and details. Preserve `{ data, pagination }`.

Rows must include:

```json
{
  "log_id": 12,
  "user_id": 4,
  "user_name": "Ana Reyes",
  "user_email": "ana@example.edu",
  "action": "update_user",
  "target_type": "user",
  "target_id": 9,
  "details": "{}",
  "ip_address": "127.0.0.1",
  "request_id": "req-8e1c...",
  "before_values": { "role": "student" },
  "after_values": { "role": "adviser" },
  "created_at": "2026-11-23T10:00:00Z"
}
```

`getAuditLogs()` currently selects none of `request_id`, `changes`, `before_values` or `after_values` (`auditLogger.js:50-63`). `database/schema.sql:220,225` already has `changes` and `request_id`; either expose `changes.before`/`changes.after` as `before_values`/`after_values`, or add explicit columns. Both are read by `AuditDetailModal.jsx:29-30,46`. Gate search with `adminAuditSearch` and the diff fields with `adminAuditDiff`.

### Audit write path

`server/middleware/auditMiddleware.js:10-15` already writes `request_id`, `correlation_id`, `changes`, `actor_name` and `user_agent`. `adminController.js` uses `logAction()` instead, which inserts only `user_id`, `action`, `target_type`, `target_id`, `details` and `ip_address` (`auditLogger.js:21-32`). Either route admin writes through `req.audit.log(...)` or extend `logAction()` to accept request context. `details` must remain valid JSON/text.

### Dashboard

- `GET /api/health` add `storage`: `{ "status": "ok", "database": "connected", "storage": "connected" }`. Use `connected`, `disconnected` or `unavailable` to match the existing `database` handling (`AdminDashboard.jsx:67-75`). Phase R wires the hardcoded Storage chip at `:113` to this value.
- `adminOverviewStats` needs real totals for groups, posts, published papers, access requests and storage. Until then the dashboard counts capped lists (`POST_LIMIT = 500`) and shows `unsupportedNote.adminOverviewStats` (`adminInsights.js:4-27`, `AdminDashboard.jsx:76-100`). A dedicated `GET /admin/stats/overview` with those five totals is the expected endpoint; keep `GET /admin/stats/users` unchanged.
- `adminDownloads` and `adminActiveUsers` remain false while downloads and sign-in activity have no admin-facing server source.

---

## 5. Storage and backup

All routes below are missing from `server/routes/admin.routes.js`. Apply `authMiddleware`, `roleMiddleware('sysadmin')` and JSON errors.

### `GET /api/admin/storage/summary`

```json
{
  "totalBytes": 1024,
  "fileCount": 4,
  "byBucket": [
    { "bucket": "papers", "bytes": 800, "files": 3 },
    { "bucket": "avatars", "bytes": 224, "files": 1 }
  ]
}
```

`total_bytes`, `file_count` and `by_bucket` are accepted as alternatives (`client/src/pages/admin/ManageStorage.jsx:102-104`). This also feeds the Dashboard "Storage used" KPI through `loadInsights()`.

### `GET /api/admin/storage/largest-files?limit=10`

Return an array. Accepted row fields: `file_id`/`id`, `path`/`file_name`/`name`, `size_bytes`/`size`, `bucket`, `updated_at`/`created_at` (`ManageStorage.jsx:105-111`).

### `GET /api/admin/storage/orphans`

```json
{
  "missingFiles": [],
  "orphanedRecords": []
}
```

Snake_case alternatives are accepted (`ManageStorage.jsx:112-113`). These reports are informational; do not delete files from this screen.

### `GET /api/admin/storage/backup-status`

```json
{
  "lastBackupAt": "2026-11-22T02:00:00Z",
  "provider": "Supabase",
  "frequency": "daily",
  "retention": "30 days"
}
```

Snake_case `last_backup_at` is accepted (`ManageStorage.jsx:114`). Gate with `adminStorageBackup`.

### Exports

- `GET /api/admin/storage/exports/:table` for `users`, `groups`, `posts`, `requests`, `audit`. Return an array of rows.
- `GET /api/admin/storage/file-manifest`. Return an array of file records.

The client converts both to CSV/JSON locally (`adminService.js:188-196`, `ManageStorage.jsx`). Links must expire, and every export must write an audit entry. Restore guidance stays a runbook/contact panel; do not add a database restore action.

---

## 6. Analytics, reports, announcements and settings

These areas have frontend scaffolds and false flags. Keep them gated until their server data is verified.

### Analytics — `adminDownloads`, `adminActiveUsers`

`client/src/pages/admin/AdminAnalytics.jsx` currently derives charts from `loadInsights()` with a 500-post cap and disables download/active-user coverage (`AdminAnalytics.jsx:120-140,219-220`). Provide server-derived totals/time series for users by role, posts over time, papers by flair, access requests, downloads and active users over `7`, `30`, `90` or `all` days. Keep CSV export client-side.

### Reports — `adminReportStatuses`

`client/src/pages/admin/AdminReports.jsx` derives statuses from forum posts, so papers that were never posted are not counted (`unsupportedNote.adminReportStatuses`). Provide a server report over `submissions.status` plus groups, access requests and downloads, honoring the existing filters and returning group-level and strand-level totals.

### Announcements — `adminAnnouncements`

Missing routes: `GET /api/admin/notifications` and `POST /api/admin/notifications`. The current `/api/notifications` router is user-scoped (`server/routes/notification.routes.js:11-16`).

Compose payload from `client/src/pages/admin/AdminAnnouncements.jsx`:

```json
{
  "title": "Maintenance window",
  "body": "The vault will be unavailable at 22:00.",
  "audience": "role",
  "role": "student",
  "groupId": ""
}
```

Audience values are `all`, `role`, `group` (`AdminAnnouncements.jsx:17`). `listAnnouncements()` expects an array (`adminService.js:149-157`). Sent history must be persisted and returned; `unsupportedNote.adminAnnouncementHistory` has no separate flag and stays visible until history exists. Write an audit entry on send.

### Settings — `adminSettings`

Missing routes: `GET /api/admin/settings` and `PUT /api/admin/settings`. Persist the fields in `client/src/pages/admin/AdminSettings.jsx:13-22`: `institutionName`, logo, `strands`, `sections`, `schoolYears`, `linkExpiryHours` (default `72`), `maxUploadMb`, `fileTypes`, `maintenance`. `unsupportedNote.adminEmailStatus` also has no flag; email transport status needs a health/settings field before that note is removed.

---

## 7. Capability flags — current values

All rows are `false` in `client/src/services/backendSupport.js`. "Flip" means verify the endpoint/field on the server, enable the flag, remove the matching caveat from `unsupportedNote`, and re-run targeted ESLint plus `npm run build` in Phase R.

| Flag | Value | Activation condition |
|---|---|---|
| `adminResetPassword` | `false` | `POST /admin/users/:id/reset-password` returns `temporaryPassword` |
| `adminUserGroups` | `false` | `groupIds` write + `groups` in user list/detail + `groupId` filter |
| `adminUserPosts` | `false` | `GET /forum/posts?authorId=` returns that author's posts |
| `adminLastLogin` | `false` | `last_login_at` in admin user rows |
| `adminAuditSearch` | `false` | `GET /admin/audit-logs?search=` filters correctly |
| `adminAuditDiff` | `false` | `request_id`, `before_values`, `after_values` returned on audit rows |
| `adminOverviewStats` | `false` | Dedicated group/post/published/request/storage totals available |
| `adminStorage` | `false` | Summary, largest-files and orphans endpoints verified |
| `adminStorageBackup` | `false` | Backup status, audited exports and file manifest verified |
| `adminModerationReason` | `false` | Report reason/reporter stored and returned |
| `adminDismissReport` | `false` | `POST /forum/posts/:id/dismiss-report` verified |
| `adminRestoreRemoved` | `false` | `POST /forum/posts/:id/restore` and `includeRemoved` verified |
| `adminCommentModeration` | `false` | Comment hide/remove endpoints verified |
| `adminReassignAdviser` | `false` | `PUT /groups/:id` persists `adviser_id` |
| `adminArchiveGroup` | `false` | `POST /groups/:id/archive` and archive status verified |
| `adminListTotals` | `false` | `GET /forum/posts` returns a real total |
| `adminPostFilters` | `false` | `type`, `authorId`, `visibility`, `dateFrom`, `dateTo` verified |
| `adminEditRoles` | `false` | **Do not flip.** Roles are fixed; matrix is read-only by design |
| `adminDownloads` | `false` | Admin-facing download counts available |
| `adminActiveUsers` | `false` | Sign-in activity/active-user counts available |
| `adminReportStatuses` | `false` | Server report over submission statuses available |
| `adminAnnouncements` | `false` | Admin notification list/send/history verified |
| `adminSettings` | `false` | Settings GET/PUT persistence verified |

Two caveats have no flag: `unsupportedNote.adminAnnouncementHistory` (`backendSupport.js:76`) and `unsupportedNote.adminEmailStatus` (`:78`). They are removed only when the corresponding data exists.

---

## 8. Acceptance checklist — current status

| # | Check | Status |
|---:|---|---|
| 1 | Admin can view users with groups, last sign-in and reset password | **Gap** — §1; all three flags false |
| 2 | Admin can reassign an adviser and archive a group without deleting files | **Gap** — §2; both flags false |
| 3 | Admin posts list filters across pages and shows real totals | **Gap** — §3; `adminPostFilters` and `adminListTotals` false |
| 4 | Hide, remove, restore and dismiss-report all audit correctly | **Partial** — hide/remove exist; restore/dismiss/report details/audit missing |
| 5 | Moderation detail shows reporter, reason and per-comment actions | **Gap** — §3; three flags false |
| 6 | Audit search, request ID and before/after diff work | **Gap** — §4; SELECT and write path incomplete |
| 7 | Dashboard health shows API, database and storage | **Partial** — API/database exist; `health.storage` missing and chip hardcoded |
| 8 | Storage summary, largest files, orphans and backup status load | **Gap** — §5; all routes missing |
| 9 | CSV/JSON exports and manifest are audited and expiring | **Gap** — client can export loaded rows; server routes/audit missing |
| 10 | Analytics and Reports use server data instead of capped lists | **Gap** — §6; five flags false |
| 11 | Announcements send and sent history persist | **Gap** — `/admin/notifications` missing |
| 12 | Settings save/cancel persists values | **Gap** — `/admin/settings` missing |
| 13 | Roles matrix stays read-only | **Complete by design** — `adminEditRoles` intentionally false |
| 14 | Admin cannot publish or approve access requests | **Complete by design** — no such admin routes; keep it that way |

---

## 9. Frontend files that consume this contract

- `client/src/services/adminService.js` — all Admin API calls, storage helpers and export helpers
- `client/src/services/backendSupport.js` — flags and `unsupportedNote` caveats
- `client/src/services/adminInsights.js` — optional storage fetch and capped dashboard lists
- `client/src/hooks/usePostActions.js` — hide/show/remove/restore/dismiss flows
- `client/src/pages/admin/` — `AdminDashboard.jsx`, `ManageUsers.jsx`, `AdminUserDetail.jsx`, `AdminGroups.jsx`, `AdminPosts.jsx`, `AdminModeration.jsx`, `AdminAccessRequests.jsx`, `AuditTrail.jsx`, `ManageStorage.jsx`, `AdminAnalytics.jsx`, `AdminReports.jsx`, `AdminAnnouncements.jsx`, `AdminSettings.jsx`
- `client/src/components/admin/` — `ResetPasswordModal.jsx`, `ReassignAdviserModal.jsx`, `UserFormModal.jsx`, `PostDetailModal.jsx`, `AuditDetailModal.jsx`
- `client/src/services/api.js` — base URL, bearer token and 401 session-expired handling

The backend contract is implemented in `server/routes/*.js`, `server/controllers/*.js`, `server/utils/auditLogger.js`, `server/middleware/auditMiddleware.js`, `server/index.js` and `database/schema.sql` by the backend developer. No backend, database or `docs/handoff.md` files were modified as part of the Admin frontend work.

---

## 10. Remaining backend work

Owner: backend developer. None of these require changes to `docs/handoff.md`. Flags are flipped by the frontend developer only after each item is verified.

### Hard-rule constraints

1. **Do not add admin publish or access-approval routes.** Those remain adviser actions (`docs/handoff.md:38-40,354`).
2. **Do not delete paper files from storage screens.** Archive groups and mark records; never hard-delete paper files (`docs/handoff.md:372`).
3. **Do not make roles editable.** `adminEditRoles` stays false; only assignment to people remains available (`docs/handoff.md:318-322`).
4. **Do not make audit rows editable or deletable.** Export actions must be audited and links must expire (`docs/handoff.md:357-382`).
5. **Do not present database restore as a UI action.** Keep the contact/runbook panel (`docs/handoff.md:382`).

### Functional gaps

6. Add user `last_login_at`, `groups`, `groupId` filtering and `groupIds` persistence; add password reset with `temporaryPassword`.
7. Add `adviser_id` updates, group archive state and `POST /groups/:id/archive`. Set a real adviser on sysadmin-created recovery groups via reassignment before publishing.
8. Extend `GET /forum/posts` with server-side filters and totals; add restore and dismiss-report; capture and return report reason/reporter; add comment hide/remove.
9. Extend audit search/diff and route admin writes through a request-aware logger so `request_id` is stored.
10. Add `storage` to `/api/health` and the five storage endpoints (summary, largest files, orphans, backup status, exports/manifest).
11. Add dedicated overview stats, download/active-user analytics, server report statuses, admin announcements and persisted settings.

### Contract and data-shape gaps

12. Keep all JSON responses in the documented shape; `{ data, pagination }` for lists, bare arrays where the client already expects them (`/admin/stats/users`, `/admin/notifications`, `/admin/storage/largest-files`, exports/manifest).
13. Return JSON `{ "message": "..." }` on failures. A 401 must trigger the client's existing session-expired event (`client/src/services/api.js:17-27`).
14. Preserve camelCase and snake_case aliases where documented; Phase R verification must confirm at least one real value, not just a `null` field.
15. After each backend area lands, verify in Phase R one area at a time, then flip only that area's flag(s), remove its caveat(s), and re-run targeted ESLint and `npm run build`.
