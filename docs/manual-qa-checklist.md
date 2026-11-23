# Manual QA checklist

**Purpose:** track the manual tests that change data and should be run through the actual app after a role's frontend, backend, and Phase R verification are complete.

**Last updated:** 2026-11-24

## Rules

- Only add tests for a role after that role's frontend and backend are complete and Phase R is verified.
- Run these tests only on a test/staging database or disposable seeded data.
- Do not run these tests against production data or real user accounts.
- Record the account, paper/post/group IDs, actual result, and date for every test.
- Reset or reseed the test data after the run so later QA is not affected.
- A role is QA-ready only when every required test is marked `Pass` or `N/A` with a reason.

## Status legend

- `Not run` — not tested yet.
- `Pass` — result matched the expected result.
- `Fail` — result did not match; needs investigation.
- `Blocked` — could not test; explain why in notes.
- `N/A` — not applicable; explain why in notes.

## Environment

- Local API base URL confirmed during Student Phase R: `http://localhost:5000/api`
- Use dedicated seeded test accounts and disposable records.
- Do not store passwords in this file. Use the project setup guide for seeded credentials.

---

## Student

**Phase R status:** read-only contract verified on 2026-11-24.
**Manual QA status:** ready.

Read-only items already verified during Phase R (do not need to be re-run here):

- `GET /papers/my` returns owned papers with the expected fields.
- `GET /papers/:id` returns a real single `file` object when a file exists.
- Detail responses include `statusHistory`, consent fields, `video_url`, and `comments.resolved`.
- Approved/published papers correctly reject file replacement.

| ID | Test | Setup needed | Steps in app | Expected result | Status | Actual result / notes |
|---|---|---|---|---|---|---|
| ST-01 | Grant consent | Editable paper with consent `pending` | Open paper, grant consent, reload page | Consent shows `granted`, timestamp recorded, persists after reload | Not run | |
| ST-02 | Withdraw consent | Editable paper with consent `granted` | Open paper, withdraw consent, reload page | Consent shows `declined`, persists after reload | Not run | |
| ST-03 | Resolve feedback | Paper with an unresolved feedback note | Open feedback, resolve the note, reload page | Note marked resolved, persists after reload | Not run | |
| ST-04 | Dismiss feedback | Disposable feedback note | Open feedback, dismiss the note, reload page | Note is removed and does not reappear | Not run | |
| ST-05 | Clear video URL | Editable paper with a video URL set | Edit paper, clear video URL, save, reload page | Field is actually cleared; empty after reload | Not run | |
| ST-06 | Replace file | Editable paper with a real file | Upload a new file, reload detail page | New file shown via single `file` object; no new version row | Not run | |
| ST-07 | Change password | Throwaway student account | Change password, log out, log in with new password | New password works; reset to seeded value afterward | Not run | |

---

## Adviser

**Phase R status:** not verified yet.
**Manual QA status:** not ready — add tests after Adviser Phase R is verified.

| ID | Test | Setup needed | Steps in app | Expected result | Status | Actual result / notes |
|---|---|---|---|---|---|---|
| — | Pending | | | | Not run | |

---

## Admin

**Phase R status:** not verified yet.
**Manual QA status:** not ready — add tests after Admin Phase R is verified.

| ID | Test | Setup needed | Steps in app | Expected result | Status | Actual result / notes |
|---|---|---|---|---|---|---|
| — | Pending | | | | Not run | |

---

## External Panelist

**Phase R status:** not verified yet.
**Manual QA status:** not ready — add tests after External Panelist Phase R is verified.

| ID | Test | Setup needed | Steps in app | Expected result | Status | Actual result / notes |
|---|---|---|---|---|---|---|
| — | Pending | | | | Not run | |

---

## Public Reader

**Phase R status:** not verified yet.
**Manual QA status:** not ready — add tests after Public Reader Phase R is verified.

| ID | Test | Setup needed | Steps in app | Expected result | Status | Actual result / notes |
|---|---|---|---|---|---|---|
| — | Pending | | | | Not run | |
