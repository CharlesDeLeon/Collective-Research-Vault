# Student backend contract — current state

**Purpose:** record of the backend contract the Student frontend consumes. The server endpoints, schema and migration are implemented. This document records their current shape and the remaining backend work; it is not a request list.

**Source of truth:** `docs/handoff.md`. Its hard rules still apply:

1. **Student opt-in is required before an adviser can publish.** No self-attestation-only path.
2. **No edits after publish** (server must enforce, not just the UI).
3. **No versioning.** Replacing a file overwrites the current file; it must not create a new version row or a new "version" in the UI.

**Current status:** all four Student capability flags are `true` — `studentConsent`, `statusHistory`, `profileSync`, `changePassword` (`client/src/services/backendSupport.js:4,7,12,13`). Remaining work is listed in §10 and belongs to the backend developer.

**Note:** `docs/handoff.md:5` still reads "Status: locked plan, pre-implementation." It remains the source of truth and is not edited here.

Base URL is `/api` (`client/src/services/api.js`). Routes use the JWT `Authorization: Bearer <token>` header. Student paper routes check ownership (`submission.submitted_by === req.user.user_id`); detail also allows group members and the group creator (`paperController.js:323-330`); upload checks group membership (`paperController.js:84-95`). Publish and adviser-side consent are adviser routes; auth routes have no ownership check.

---

## 0. Implemented contract (verified in `server/routes` / `server/controllers`)

| Route | Current state | Evidence |
|---|---|---|
| `GET /papers/my-groups` | Returns `{ data: [...] }` | `server/controllers/paperController.js:48-65`, route `server/routes/paper.routes.js:43` |
| `GET /papers/my` | Returns a bare array of **all** the student's papers with `section`, `updated_at`, `video_url`, `consent_status`, `consent_at`, `file_path`, `file_name`, `strand`, `program`, `group_name` | `paperController.js:277-309`, route `paper.routes.js:44` |
| `GET /papers/:id` | Returns submission + `statusHistory` / `status_history`, single `file`, consent variants, `video_url` / `videoUrl`, `section`, `reviews[].comments[].resolved`. Still returns `versions[]` | `paperController.js:311-432`, route `paper.routes.js:45` |
| `POST /papers/upload` | Multipart; `video_url` accepted and persisted. Still inserts a `document_versions` row on first submission | `paperController.js:69,120-135,141-158` |
| `PATCH /papers/:id` | Accepts title, abstract, keywords, authors, program, school_year, `video_url` / `videoUrl`; ownership and status gate enforced | `paperController.js:442-466`, route `paper.routes.js:46` |
| `POST /papers/:id/versions` | Legacy version-creating route still live — **do not use for student edits** | `paper.routes.js:56-62`, `paperController.js:203-275` |
| `POST /papers/:id/resubmit` | Implemented; writes a status-history row | `paperController.js:479-508`, route `paper.routes.js:47` |
| `POST /papers/:id/file` | Multipart replacement; overwrites current file only, no version row | `paper.routes.js:66-72`, `paperController.js:546-577` |
| `POST /papers/:id/consent` | Student consent; stores status/timestamp, notifies adviser, 409 when published | `paper.routes.js:64`, `paperController.js:510-544` |
| `POST /coordinator/submissions/:id/consent` | Adviser-side consent endpoint still live — see §10 gap 1 | `coordinatorSubmission.routes.js:41`, `coordinatorController.js:712-742` |
| `POST /coordinator/submissions/:id/publish` | Consent gate implemented; `consentGranted` body field ignored server-side | `coordinatorController.js:608-672` |
| `POST /papers/:id/feedback/:noteId/resolve` | One-way `resolved = true` | `paper.routes.js:74`, `paperController.js:579-610` |
| `POST /papers/:id/feedback/:noteId/dismiss` | Hard `DELETE` of the comment | `paper.routes.js:75`, `paperController.js:612-643` |
| `POST /auth/login` | Implemented | `auth.routes.js:6` |
| `PATCH /auth/profile` | Implemented; `currentPassword` required for email change | `auth.routes.js:7`, `authController.js:59-103` |
| `POST /auth/change-password` | Implemented; camelCase body | `auth.routes.js:8`, `authController.js:105-133` |
| Access flow | Student `GET /student/access-requests`, `POST /student/access-requests/:id/consume`; adviser `GET/POST /adviser/access-requests*`, revoke; public request | `student.routes.js:10-11`, `access.routes.js:12-16` (mounted `server/index.js:57`), `public.routes.js:12` |
| Schema + migration | Fresh-DB schema and an existing-data migration are present; migration is not wired into any npm script — see §10 gap 6 | `database/schema.sql:28,98-103,164-173,193`, `server/scripts/migrate_student_backend.js:1-64` |

---

## 1. Consent

### `POST /api/papers/:id/consent` — implemented

Request:

```json
{ "granted": true }
```

`true` grants public release, `false` withdraws it.

Response (`client/src/pages/student/PaperDetail.jsx:83-96` consumes this shape):

```json
{ "consent": { "status": "granted", "at": "2026-11-23T10:00:00Z" }, "status": "published" }
```

Implemented behaviour (`paperController.js:510-544`):

- `consent_status` set to `granted` / `declined`, `consent_at = NOW()`, and `author_consent_at` populated on grant and reset to `NULL` on withdrawal (`:527-535`).
- 409 if the paper is `published` (`:523-525`).
- Adviser notified on every call via `notifyAdviser` (`:26-46`, `:537`).

### Publish gate — implemented

- `coordinatorController.js:613-617` selects `consent_status` and `author_consent_at`.
- `coordinatorController.js:630-632` returns 409 `"Author consent is required before publishing"` when neither is present.
- `consentGranted` is not read by the server (`:610` destructures only `citation`), so a forged body field cannot bypass the gate. The client still sends it (`client/src/services/adviserService.js:91-93`, `client/src/pages/adviser/AdviserReview.jsx:237`).

### Consent in read responses — implemented

`GET /papers/:id` returns `consent`, `consent_status`, and `author_consent_at` variants (`paperController.js:404,424-426`). `GET /papers/my` returns flat `consent_status` / `consent_at` (`:291-292`); the client normalizes both shapes (`client/src/services/paperService.js:60`).

### Deviations from the original brief

- Ownership failures return **404**, not 403 (`paperController.js:516-522`).
- Notifications are unconditional; no duplicate suppression. The returned `at` comes from `new Date()` rather than the database value (`:527-539`).
- The legacy `author_consent_at` fallback and adviser `setConsent` endpoint remain — see §10 gaps 1 and 2.

---

## 2. Paper detail data

### `GET /api/papers/my` — implemented

Returns every row where `submitted_by = req.user.user_id`, as a bare array (`paperController.js:277-304`). Sample row:

```json
{
  "submission_id": 12,
  "title": "...",
  "status": "for_revision",
  "group_name": "Group 4",
  "program": "IT",
  "school_year": "2025-2026",
  "strand": "IT",
  "section": "A",
  "updated_at": "2026-11-20T09:00:00Z",
  "consent_status": "pending",
  "consent_at": null,
  "video_url": null
}
```

### `GET /api/papers/:id` — implemented

Current response includes:

```json
{
  "video_url": "https://www.youtube.com/watch?v=...",
  "section": "A",
  "consent": { "status": "granted", "at": "2026-11-23T10:00:00Z" },
  "statusHistory": [
    { "status": "proposal", "at": "2026-11-01T08:00:00Z", "note": "Submitted", "by": "Juan Dela Cruz" }
  ],
  "file": { "fileName": "research.pdf", "filePath": "/uploads/...pdf" },
  "reviews": [
    {
      "review_id": 3,
      "comments": [
        {
          "comment_id": 9,
          "author_name": "Adviser Name",
          "comment_text": "Fix the abstract",
          "created_at": "2026-11-05T00:00:00Z",
          "resolved": false
        }
      ]
    }
  ]
}
```

History rows are written on submit (`paperController.js:162-164`), resubmit (`:496-501`), adviser status change (`coordinatorController.js:497-508`), publish (`:653-665`) and unpublish (`:678-688`). Read-side mapping resolves actor IDs to names (`paperController.js:372-398`).

### Deviations from the original brief

- `versions[]` is still returned alongside `file` (`paperController.js:430`); the client prefers `file` (`paperService.js:30-36`).
- Comments are nested under `reviews` and filtered by `rc.author_id = review.reviewer_id` (`:348-369`). Adviser comments inserted without a `reviews` row (`facultyController.js:84-89`, review row created at `:174-177`) may not appear in student detail.
- `updateStage` writes no history row — see §10 gap 5.
- `backendSupport.statusHistory` is already `true`; the original "keep the flag false if delayed" instruction no longer applies.

---

## 3. File replacement, video URL, schema

### `POST /api/papers/:id/file` — implemented

- `multipart/form-data`, field name `file`, PDF/DOC/DOCX, 20 MB (`paper.routes.js:15-41,66-72`).
- Overwrites `submissions.file_path` / `file_name` only; no `document_versions` insert (`paperController.js:546-577`).
- 409 for approved / published (`:562-564`). The server also blocks `under_review`, stricter than the original brief.
- Response: `{ "file": { "fileName": "...", "filePath": "..." } }` (`:572`).

### `video_url` — implemented

Accepted on `POST /papers/upload` (`paperController.js:69,120-135`) and `PATCH /papers/:id` (`:442,456`), stored on `submissions.video_url` and returned by both read endpoints (`:153-158,293,422-423`). Format validation is client-side only (`client/src/utils/videoLinks.js`); PATCH uses `COALESCE` (`:466`), so `null` cannot clear an existing value.

### Schema and migration — implemented

- Fresh-DB schema: `database/schema.sql:28,98-103,164-173,193`.
- Existing-data migration: `server/scripts/migrate_student_backend.js:1-64` (status enum, consent columns, `resolved`, history table/index, consent/file/history backfills).
- Not wired into any npm script — see §10 gap 6. Existing deployments require `node server/scripts/migrate_student_backend.js`.

---

## 4. Feedback note actions

Implemented (`paper.routes.js:74-75`, `paperController.js:579-643`):

- `POST /api/papers/:id/feedback/:noteId/resolve` — one-way `resolved = TRUE`, 200 with `message`.
- `POST /api/papers/:id/feedback/:noteId/dismiss` — hard `DELETE`, 200 with `message`.
- Both check student ownership and that the note belongs to the paper; failures return 404 rather than 403.

The detail endpoint returns `resolved` (`paperController.js:361`), the client maps it (`paperService.js:101-108`) and renders Resolve / Dismiss (`client/src/components/paper/FeedbackNotes.jsx:21-37`).

---

## 5. Account endpoints

### `PATCH /api/auth/profile` — implemented

Request: `{ "name": "...", "email": "...", "currentPassword": "..." }` (`currentPassword` required only when the email changes — `client/src/services/authService.js:8-10`). Response: `{ "message": "...", "user": { "name": "...", "email": "..." } }` (`authController.js:97-98`). Email uniqueness is checked with 409 (`:82-85`) and the current password verified with bcrypt (`:73-80`). Email **format** is validated client-side only (`client/src/pages/student/Profile.jsx:66`).

### `POST /api/auth/change-password` — implemented

Request: `{ "currentPassword": "...", "newPassword": "..." }`. Minimum 8 characters, bcrypt verification, 401 on wrong current password, `{ "message": "Password changed successfully" }` on success (`authController.js:105-133`). The client does not depend on the exact message text (`Profile.jsx:106-110`).

`backendSupport.profileSync` and `backendSupport.changePassword` are already `true` (`backendSupport.js:12-13`).

---

## 6. Error contract — partial

Controllers and middleware return JSON `{ "message": "..." }` on failures (e.g. `paperController.js:64,114,524,563,608,641`; `authController.js:9,75,122`; `authMiddleware.js:8,16`; `roleMiddleware.js:7`). A 401 triggers session-expired handling (`client/src/services/api.js:23-27`).

Gaps:

- Multer `fileFilter` throws a plain `Error` (`paper.routes.js:30-32`) and there is no Express error-handling middleware in `server/index.js`, so invalid file type / oversize returns Express's default HTML error.
- `getConnection()` is called outside the `try` in `paperController.js:80`, so a pool failure also produces a non-JSON error.
- `authMiddleware.js:16` returns 403 for an invalid token; the client still handles it because the message contains "token".

---

## 7. Capability flags — current values

| Flag | Value | Endpoint / data |
|---|---|---|
| `studentConsent` | `true` (`backendSupport.js:4`) | `POST /papers/:id/consent` + consent in read responses |
| `statusHistory` | `true` (`backendSupport.js:7`) | `statusHistory` in `GET /papers/:id` |
| `profileSync` | `true` (`backendSupport.js:13`) | `PATCH /auth/profile` |
| `changePassword` | `true` (`backendSupport.js:12`) | `POST /auth/change-password` |

Related flags still `false`: `requestConsent` (`:5`) and `statusNote` (`:6`). The adviser status-note field is disabled (`AdviserReview.jsx:435,440`) and `adviserService.js:73-75` never sends a note, so status-history notes from the UI are always null.

---

## 8. Acceptance checklist — current status

| # | Check | Status |
|---:|---|---|
| 1 | Student toggles **Allow public release** → reload → still on with a real timestamp | Code-complete; needs live DB + migration |
| 2 | Student withdraws consent → adviser publish blocked | Code-complete; needs live DB. Adviser UI shows "Pending" rather than "withdrawn" (`AdviserReview.jsx:180,498`) |
| 3 | Adviser cannot publish with pending/declined consent, even with `consentGranted: true` | **Gap** — body field ignored, but adviser `setConsent` and legacy `author_consent_at` fallback remain (§10 gaps 1-2) |
| 4 | Replacement file saves → one file shown, no new version | Code-complete with caveat — initial upload still creates a version and `versions[]` is still returned (§10 gap 4) |
| 5 | Video URL persists and renders | Code-complete; needs live DB |
| 6 | Status changes appear with date and actor | **Partial** — stage changes write no history and UI notes are never sent (§10 gap 5) |
| 7 | Resolve persists, Dismiss removes | Code-complete with caveat — comments may not surface until a `reviews` row exists (§2); needs live DB |
| 8 | Name / email / password changes persist | Code-complete; needs live DB. Server does not validate email format |
| 9 | Edit or replace file on `approved` / `published` returns 409 with server message | Code-complete; needs live DB |
| 10 | `GET /papers/my` returns every paper the student owns | Code-complete; needs live DB |

---

## 9. Frontend files that consume this contract

- `client/src/services/paperService.js` — detail/list normalization, consent, feedback note calls
- `client/src/services/uploadService.js` — upload, `replacePaperFile`, video URL payload
- `client/src/services/authService.js` — `updateProfile`, `changePassword`
- `client/src/pages/student/PaperDetail.jsx`, `UploadForm.jsx`, `MyPapers.jsx`, `Profile.jsx`, `MyAccess.jsx`

The backend contract above is implemented in `server/routes/*.js`, `server/controllers/*.js`, `database/schema.sql`, and `server/scripts/migrate_student_backend.js` by the backend developer. No backend files were modified as part of the Student frontend work.

---

## 10. Remaining backend work

Owner: backend developer. None of these block the Student frontend; they are required for full conformance with `docs/handoff.md`.

### Hard-rule violations

1. **Adviser-side consent loophole.** `POST /coordinator/submissions/:id/consent` (`coordinatorSubmission.routes.js:41`, `coordinatorController.js:712-742`) sets `consent_status`, `consent_at` and `author_consent_at` with no student action, no published lock and no notification. Violates handoff §0 line 7 and §4.11 line 250.
2. **Legacy publish fallback.** `coordinatorController.js:630-632` accepts a populated `author_consent_at` on its own. Combined with gap 1 this creates a self-attestation path. Remove the fallback so only stored `consent_status = 'granted'` satisfies the gate.
3. **Adviser file upload has no published guard.** `coordinatorController.js:575-606` lacks the status check that student routes enforce. Violates handoff §0 line 8 ("no edits after publish").
4. **Versioning still reachable.** First submission inserts a `document_versions` row (`paperController.js:141-151`) and `POST /papers/:id/versions` remains live (`paper.routes.js:56-62`). Violates handoff §0 line 9. Replacement itself is correctly in-place.

### Functional gaps

5. **`updateStage` writes no status history.** `coordinatorController.js:428-479` changes status and sends notifications without a history insert, while submit, resubmit, adviser status change, publish and unpublish do write one. Add the insert and wire the `statusNote` flag so adviser notes reach the history row.
6. **Migration not wired.** `server/package.json:6-11` has only `start`, `dev`, `db:check`, `db:setup`; the root `package.json` has no `scripts`. Add a `db:migrate` script for `server/scripts/migrate_student_backend.js` and run it on existing deployments. Acceptance items 1-10 depend on it.

### Contract and data-shape gaps

7. **Multer and pool errors are not JSON** — add Express error handling (`paper.routes.js:30-32`, `server/index.js`, `paperController.js:80`).
8. **Ownership failures return 404 instead of 403** — `paperController.js:520-522,449-451,559-561,588-590,621-623` and peers.
9. **Consent notification is not idempotent** — every call inserts a notification (`paperController.js:527-537`); skip when the status is unchanged.
10. **Validation gaps** — server-side email format check for `PATCH /auth/profile` (`authController.js:59-103`); allow clearing `video_url` with `null` instead of `COALESCE` (`paperController.js:466`).
11. **Comment visibility** — adviser comments inserted without a `reviews` row may not appear in student detail (`facultyController.js:84-89,174-177`, `paperController.js:348-369`).
