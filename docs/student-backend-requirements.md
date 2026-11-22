# Student frontend → backend requirements

**Purpose:** the Student frontend work is complete. These are the server changes needed to make it actually persist data. The frontend already calls these endpoints and degrades with inline errors when they are missing, so nothing will crash — but the affected features do not work until the server implements them.

**Source of truth:** `docs/handoff.md`. Its hard rules still apply:

1. **Student opt-in is required before an adviser can publish.** No self-attestation-only path.
2. **No edits after publish** (server must enforce, not just the UI).
3. **No versioning.** Replacing a file overwrites the current file; it must not create a new version row or a new "version" in the UI.

Base URL is `/api` (see `client/src/services/api.js`). All routes below require the existing JWT `Authorization: Bearer <token>` header and student ownership checks (`submission.submitted_by === req.user.user_id`, or membership via `group_members`).

---

## 0. What the server already has (verified in `server/routes` / `server/controllers`)

| Existing route | Current state |
|---|---|
| `GET /papers/my-groups` | returns `{ data: [...] }` — fine |
| `GET /papers/my` | returns raw array, but selects **one submission per group** and no consent / video / section / updated_at |
| `GET /papers/:id` | returns submission + `versions[]` + `reviews[].comments[]`; no consent, status history, video URL, current file, or section |
| `POST /papers/upload` | multipart; accepts title, authors, program, year, school_year, abstract, keywords, group_id, file — **drops `video_url`** |
| `PATCH /papers/:id` | accepts title, abstract, keywords, authors, program, school_year — **drops `video_url`** |
| `POST /papers/:id/versions` | creates a new `document_versions` row — **do not use for student edits** (violates no-versioning) |
| `POST /papers/:id/resubmit` | exists — fine |
| `POST /coordinator/submissions/:id/consent` | adviser-side consent only; returns `author_consent_at` |
| `POST /coordinator/submissions/:id/publish` | currently accepts `consentGranted` from the adviser — **must be changed** |
| `GET/POST /student/access-requests...` | existing access flow — no change needed |
| `POST /auth/login` | the **only** auth route |

---

## 1. Consent (blocker for the whole publish rule)

### `POST /api/papers/:id/consent`

Request:
```json
{ "granted": true }
```
`true` = grant public release, `false` = withdraw it.

Response (any of these shapes works — the frontend normalizes them):
```json
{ "consent": { "status": "granted", "at": "2026-11-23T10:00:00Z" } }
```
or `{ "status": "granted", "at": "..." }` or `{ "author_consent_at": "..." }`.

Rules:
- Store on the submission: `consent_status` (`pending` | `granted` | `declined`) and `consent_at`. Use `declined` for withdrawal.
- Only the submitting student may call this (403 otherwise).
- Reject with **409** if the paper is already `published` (consent is locked after publish).
- Notify the adviser on every change (existing notification infrastructure).
- Idempotency is fine — granting twice should not produce duplicate notifications if possible.

### Change `POST /api/coordinator/submissions/:id/publish`

- Publish must be rejected with **409** unless the stored student consent status is `granted`.
- Remove the adviser's `consentGranted` checkbox/attestation fallback in the publish path. The existing `AdviserReview.jsx` UI already checks `author_consent_at`; keep that field populated from the same stored consent record so both roles agree.

### Return consent from read endpoints

Both `GET /papers/my` and `GET /papers/:id` must include:
```json
"consent": { "status": "granted", "at": "2026-11-23T10:00:00Z" }
```
For legacy compatibility the frontend also understands `consent_status`, `author_consent_at`, and a boolean `granted`.

---

## 2. Paper detail data

### `GET /api/papers/my`

Return **all** of the student's papers (not one per group). Each row should include:

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
  "consent": { "status": "pending", "at": null },
  "video_url": null
}
```
Accept either a bare array or `{ "data": [...] }` — the frontend handles both.

### `GET /api/papers/:id`

Keep all current fields and add:

```json
{
  "video_url": "https://www.youtube.com/watch?v=...",
  "section": "A",
  "consent": { "status": "granted", "at": "2026-11-23T10:00:00Z" },
  "statusHistory": [
    {
      "status": "proposal",
      "at": "2026-11-01T08:00:00Z",
      "note": "Submitted",
      "by": "Juan Dela Cruz"
    }
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

Accept aliases `status_history` / `history` and `videoUrl`. `statusHistory` items accept `created_at` / `changed_at` / `timestamp`, `notes`, and `changed_by` / `actor`.

`statusHistory` should be written on **every** status transition (submit, adviser status change, resubmit, approve, publish, unpublish) with who made the change and the optional note. If this is delayed, keep the flag `backendSupport.statusHistory = false` — the UI already shows a "will appear here" note.

`file` should be the **single current file**, not a version list. The frontend currently falls back to `versions[0]` until this is provided. Once `file` is returned, the `versions` array can be removed from the student response.

---

## 3. File replacement and video URL (no versioning)

### `POST /api/papers/:id/file`

- `multipart/form-data`, field name **`file`** (same multer config: PDF/DOC/DOCX, 20 MB max).
- Overwrite the current file — **do not insert into `document_versions`**, do not bump a version number.
- Response: `200` with e.g. `{ "file": { "fileName": "...", "filePath": "..." } }`.
- Enforce ownership and the same status gate as editing: only `proposal` / `for_revision` (normalized: `needs_revision` → `for_revision`, `submitted` → `under_review`). Reject approved/published with **409**.

### Persist `video_url`

- Accept `video_url` on `POST /papers/upload` (multipart field) and `PATCH /papers/:id` (JSON field).
- Store it on `submissions.video_url` (nullable VARCHAR, ~2048 chars) and return it from both read endpoints.
- Any `http(s)://` string is accepted; the frontend validates the URL format.

**Suggested schema additions:**
```sql
ALTER TABLE submissions
  ADD COLUMN video_url VARCHAR(2048) NULL,
  ADD COLUMN consent_status ENUM('pending','granted','declined') NOT NULL DEFAULT 'pending',
  ADD COLUMN consent_at TIMESTAMP NULL,
  ADD COLUMN file_path VARCHAR(512) NULL,
  ADD COLUMN file_name VARCHAR(255) NULL;

CREATE TABLE submission_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT NULL,
  changed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE review_comments ADD COLUMN resolved BOOLEAN NOT NULL DEFAULT FALSE;
```
(Adjust syntax for the actual Postgres/Supabase setup — the repo also contains `pg`.)

---

## 4. Feedback note actions

The detail page renders adviser comments as feedback notes with **Resolve** and **Dismiss** buttons. Add:

- `POST /api/papers/:id/feedback/:noteId/resolve` → set `review_comments.resolved = true` (one-way, not toggle).
- `POST /api/papers/:id/feedback/:noteId/dismiss` → remove or hide the comment for the student.

Both require student ownership of the paper. Return `200` on success; the frontend shows the API `message` on failure.

---

## 5. Account endpoints

### `PATCH /api/auth/profile`

Request: `{ "name": "...", "email": "..." }`
Response: `{ "user": { "name": "...", "email": "..." } }` (or a flat `{ name, email }` — both work).

Validate email uniqueness and format. The frontend updates `localStorage.user` and the auth context from the response.

### `POST /api/auth/change-password`

Request:
```json
{ "currentPassword": "...", "newPassword": "..." }
```
Response: `200` with `{ "message": "Password changed." }`.

Verify the current password against the stored hash; reject wrong current password with **400/401** and a human-readable `message`. Minimum 8 characters (frontend validates this too).

After these land, flip `backendSupport.profileSync` and `backendSupport.changePassword` to `true` in `client/src/services/backendSupport.js` so any remaining "not available yet" notes disappear.

---

## 6. Error contract

All failures should return a JSON body with a human-readable `message`:
```json
{ "message": "You cannot edit this paper after it has been published." }
```
The frontend displays `error.response.data.message` directly in toasts/inline banners and falls back to a generic message. A 401 triggers the existing session-expired handling.

---

## 7. Flags to flip in `client/src/services/backendSupport.js`

Only flip when the corresponding endpoint is confirmed live:

| Flag | Endpoint |
|---|---|
| `studentConsent` | `POST /papers/:id/consent` + consent in read responses |
| `statusHistory` | `statusHistory` in `GET /papers/:id` |
| `profileSync` | `PATCH /auth/profile` |
| `changePassword` | `POST /auth/change-password` |

---

## 8. Acceptance checklist (end-to-end)

1. Student toggles **Allow public release** on → reload → toggle still on, with a real timestamp.
2. Student withdraws consent → adviser's publish button is blocked with a clear message.
3. Adviser cannot publish a paper whose consent is `pending` or `declined`, even if someone posts `consentGranted: true`.
4. Student edits metadata, attaches a replacement file → saves → **one** file is shown in detail, no new version appears.
5. Student submits a video URL → reload → the video section renders (embed for YouTube/Vimeo, plain link otherwise).
6. Status changes appear in **Status history** with a date and actor.
7. Adverse feedback note → **Resolve** persists after reload; **Dismiss** removes it.
8. Student changes name/email/password → reload → values persist and login still works with the new password.
9. Attempt to edit or replace the file of an `approved`/`published` paper returns **409**; the UI shows the server message.
10. `GET /papers/my` returns every paper the student owns, not just one per group.

---

## 9. Frontend files that consume this contract

- `client/src/services/paperService.js` — detail/list normalization, consent, feedback note calls
- `client/src/services/uploadService.js` — upload, `replacePaperFile`, video URL payload
- `client/src/services/authService.js` — `updateProfile`, `changePassword`
- `client/src/pages/student/PaperDetail.jsx`, `UploadForm.jsx`, `MyPapers.jsx`, `Profile.jsx`, `MyAccess.jsx`

No backend files were modified as part of the frontend work.
