# Backend status report — for frontend

**Date:** 2026-11-23  
**Scope:** Student, Adviser, External Panelist, Public Reader, System Admin  
**Source of truth:** `docs/handoff.md` (unchanged)

This report summarizes what the backend now implements, what migrations are required on the live Supabase database, and which capability flags can be flipped in Phase R. It complements (does not replace) the per-role requirement docs.

---

## 1. Production database migrations required

Run each once in the Supabase SQL Editor (or via the npm scripts). All statements are idempotent.

### Student (npm: `db:migrate` / `server/scripts/migrate_student_backend.js`)
```sql
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'proposal';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'for_revision';
DO $$ BEGIN CREATE TYPE consent_status AS ENUM ('pending','granted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consent_status consent_status NOT NULL DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS video_url VARCHAR(2048) DEFAULT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_path VARCHAR(512) DEFAULT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE review_comments ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS submission_status_history (
  id SERIAL PRIMARY KEY, submission_id INT NOT NULL REFERENCES submissions(submission_id),
  status VARCHAR(50) NOT NULL, note TEXT, changed_by INT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_status_history_submission ON submission_status_history(submission_id);
ALTER TABLE submission_status_history ENABLE ROW LEVEL SECURITY;
-- backfill consent/file/history (see migrate script)
```

### Adviser (npm: `db:migrate:adviser` / `server/scripts/migrate_adviser_backend.js`)
```sql
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reported_by INT REFERENCES users(user_id);
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS report_reason TEXT;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;
```

### Public reader (npm: `db:migrate:public` / `server/scripts/migrate_public_backend.js`)
```sql
ALTER TABLE paper_access_requests ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE;
```

### Admin (npm: `db:migrate:admin` / `server/scripts/migrate_admin_backend.js`)
```sql
ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id SERIAL PRIMARY KEY, title VARCHAR(200) NOT NULL, body TEXT NOT NULL,
  audience VARCHAR(20) NOT NULL DEFAULT 'all', role VARCHAR(50), group_id INT REFERENCES research_groups(group_id),
  created_by INT REFERENCES users(user_id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY, settings JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
```

### RLS already enabled manually (verify)
`panelist_invitations`, `submission_status_history` — confirm `rowsecurity = true` in `pg_tables`.

---

## 2. What is now implemented (by area)

### Student
- `POST /papers/:id/consent`, `POST /papers/:id/file`, `POST /papers/:id/feedback/:noteId/resolve|dismiss`
- `GET /papers/my` returns all owned papers; `GET /papers/:id` returns consent, video_url, statusHistory, single file, comments.resolved
- `PATCH /papers/:id` accepts video_url/videoUrl (clearable with null)
- Publish gate: only stored `consent_status = 'granted'` satisfies it; adviser `setConsent` endpoint removed
- Adviser upload blocked on published papers; `updateStage` writes history
- `PATCH /auth/profile`, `POST /auth/change-password` (camelCase)
- Email format validation added

### Adviser
- Group CRUD with ownership checks, duplicate-name validation, adviser reassignment, archive
- Submission list/detail scoped to adviser-owned groups; filters `groupId/strand/section/status/stage/search`; real total
- Detail returns `statusHistory` with actor names + notes
- Dashboard adviser-scoped; reports/analytics scoped
- Access inbox: date filters, expired count, resend route, real delivery status
- Moderation: restore, dismiss-report, report reason/reporter, totals, audit entries; comment hide/remove
- Invite creation returns real delivery status

### External panelist
- Platform-wide read/comment access: `GET /groups`, `GET /groups/:id`, `GET /forum/posts`, `GET /forum/posts/:id`, and `GET /panelist/papers` are no longer assignment-scoped
- `GET /panelist/groups` still available (now returns all groups) for compatibility
- `GET /panelist/papers` returns `group_id` + stable `hasFile` for every submission
- Hard rule preserved: panelists cannot set status, upload files, publish, or approve access; moderation endpoints stay adviser/admin-only

### Public reader
- `POST /public/access-requests` requires consent; stores `consent_given`
- `consumeLink` returns proxy `fileUrl` (no raw path); `confirmLink`/`consumeLink` check published state
- Unpublish revokes active links
- `GET /public/access/:token/file` streams file

### Admin
- Users: `last_login_at`, `groups`, `groupId` filter, `groupIds` persistence, `reset-password`, `updateUserGroups`
- Groups: `adviser_id` update, `archive`
- Posts: `type/authorId/visibility/dateFrom/dateTo/includeRemoved` filters, totals, comment hide/remove
- Audit: `search`, `request_id`, `before_values`/`after_values`
- Health: `storage` field; overview stats endpoint
- Storage: summary, largest-files, orphans, backup-status, exports, file-manifest
- Announcements: list/create with audience targeting + notification delivery
- Settings: GET/PUT persisted

---

## 3. Capability flags — recommended Phase R actions

| Flag | Action |
|---|---|
| `studentConsent` | Already true — keep |
| `statusHistory` | Already true — keep |
| `profileSync` / `changePassword` | Already true — keep |
| `statusNote` | Still false (UI never sends notes) — leave until UI collects them |
| `groupCreateReturnsId` / `groupFieldsSavedOnCoordinatorRoutes` | Stale; do not flip without decision |
| `panelistScopedGroups` / `panelistPaperList` | Stale; repoint to new scoped endpoints in Phase R |
| `adminUserGroups`, `adminLastLogin`, `adminResetPassword` | Can flip after Phase R verifies real values |
| `adminAuditSearch`, `adminAuditDiff` | Can flip after verification |
| `adminOverviewStats`, `adminStorage`, `adminStorageBackup` | Can flip after verification |
| `adminModerationReason`, `adminDismissReport`, `adminRestoreRemoved`, `adminCommentModeration` | Can flip (endpoints now exist) |
| `adminReassignAdviser`, `adminArchiveGroup` | Can flip after verification |
| `adminListTotals`, `adminPostFilters` | Can flip after verification |
| `adminAnnouncements`, `adminSettings` | Can flip after verification |
| `adminEditRoles` | **Do not flip** — roles fixed by design |

---

## 4. Production migrations still required

If not yet run, execute the SQL in §1 (or the npm scripts). Verify with the per-doc acceptance checklists.

---

## 5. Outstanding / deferred

- True short-lived signed URLs require Supabase Storage migration (still pending). Proxy endpoint is the interim control.
- Analytics time-series and download/active-user counts need server-derived sources.
- Reports over submission statuses need a server report query.
- Facets for large catalogs (500-row cap) needs a dedicated endpoint + frontend change.
- `statusNote` UI collection.
- `unpublishReasonStored` read path verification.