# Adviser backend contract — current state

**Purpose:** implementation checklist for the Adviser backend contract the frontend is prepared to consume. The adviser frontend is complete through batch A6; this document records the exact endpoints, fields and response shapes that still need backend support. It is not a redesign and not a request to change `docs/handoff.md`.

**Source of truth:** `docs/handoff.md`. If anything here conflicts with the handoff, `docs/handoff.md` wins and is not edited here. Adviser-relevant hard rules still apply:

1. **Advisers create their own groups; admins can create for recovery** (`docs/handoff.md:35`).
2. **Advisers see only their own groups for group management** (`docs/handoff.md:36`, `:458`).
3. **Any adviser can view and approve/decline access requests for any paper** (`docs/handoff.md:37`, `:195`). Do not add group scoping to the access inbox.
4. **Advisers alone publish papers and approve access requests. Admins cannot** (`docs/handoff.md:38-39`).
5. **Every group must have an adviser before its papers can be published** (`docs/handoff.md:40`).
6. **Publishing requires status `approved`, at least one file, and student consent** (`docs/handoff.md:41`, `:249-250`). No self-attestation-only path.
7. **After publish, the author cannot edit; the adviser can unpublish with a reason** (`docs/handoff.md:42`, `:457`).
8. **Moderation is manual** (`docs/handoff.md:45`). The handoff workflow says "Moderation → own group reports" (`:452`), but the current `/forum/posts` queue is vault-wide; see §6.
9. **No versioning** is stated in the handoff, but server uploads write numbered `document_versions` rows. This interpretation is unresolved and needs product/developer clarification; see §3.

**Current status:** adviser frontend A1–A6 is complete and stopped for backend work. Capability flags were not changed during A6; `adminEditRoles` remains `false` (`client/src/services/backendSupport.js:31`). The frontend currently presents honest interim labels where backend scoping or data is missing. Phase R flips one verified feature area at a time.

**Note:** `docs/handoff.md:5` still reads "Status: locked plan, pre-implementation." It remains the source of truth and is not edited here.

Base URL is `/api` (`client/src/services/api.js`). Routes use the JWT `Authorization: Bearer <token>` header. Adviser-owned means a group where `research_groups.adviser_id = req.user.user_id OR research_groups.created_by = req.user.user_id`, matching `groupController.js:20-23`, `coordinatorController.js:752-755` and `:806-809`.

---

## 0. Implemented contract (verified in `server/routes` / `server/controllers`)

| Route | Current state | Evidence |
|---|---|---|
| `GET /api/groups` | Adviser-scoped list by `adviser_id` or `created_by`; returns `group_id`, group fields, `created_by`, `adviser_id`, `member_count`, `submission_count`; ordered by `group_name`; no `adviser_name` | `group.routes.js:13`, `groupController.js:3-32` |
| `GET /api/groups/:id` | Detail includes `adviser_name`, members, panel assignments and submissions; no ownership check | `group.routes.js:15`, `groupController.js:34-68` |
| `POST /api/groups` | Sets `created_by` and `adviser_id` to the current user; returns `{ data: { group_id } }` using `insertId` | `group.routes.js:18`, `groupController.js:70-85` |
| `PUT /api/groups/:id` | Persists `group_name`, `program`, `strand`, `section`, `year_level`, `school_year`; ignores `adviser_id` | `group.routes.js:19`, `groupController.js:87-118` |
| `POST /api/groups/:id/members`, `DELETE /api/groups/:id/members/:userId` | Implemented | `group.routes.js:21-22` |
| `GET /api/groups/search/students` | Implemented; adviser/sysadmin only | `group.routes.js:14` |
| `GET /api/coordinator/submissions` | Paginated `{ data, pagination }`; filters `stage`, `status`, `program`, `search`; **not adviser-scoped** | `coordinatorSubmission.routes.js:32`, `coordinatorController.js:329-374` |
| `GET /api/coordinator/submissions/:id` | Returns submission plus `versions`, `reviews`, `comments`, `panel`; **no `statusHistory`**; not scoped | `coordinatorSubmission.routes.js:33`, `coordinatorController.js:377-425` |
| `PATCH /api/coordinator/submissions/:id/stage`, `/status` | Implemented. Status accepts `note` and writes `submission_status_history`; stage writes no history | `coordinatorSubmission.routes.js:34-35`, `coordinatorController.js:428-535` |
| `POST /api/coordinator/submissions/:id/files` | Multipart upload; creates a `document_versions` row; `fileRole` is read but not stored; no published guard | `coordinatorSubmission.routes.js:38`, `coordinatorController.js:575-606` |
| `POST /api/coordinator/submissions/:id/publish` | Enforces `approved` + at least one file + consent; also accepts legacy `author_consent_at`; no adviser ownership check | `coordinatorSubmission.routes.js:39`, `coordinatorController.js:608-672` |
| `POST /api/coordinator/submissions/:id/unpublish` | Sets status to `approved`, clears publish flags; stores reason as a history note | `coordinatorSubmission.routes.js:40`, `coordinatorController.js:674-695` |
| `POST /api/coordinator/submissions/:id/consent` | Adviser-side consent route still live; see §3 | `coordinatorSubmission.routes.js:41`, `coordinatorController.js:712-742` |
| `POST /api/faculty/submissions/:submission_id/comment` | Implemented adviser feedback comment | `faculty.routes.js:21` |
| `DELETE /api/coordinator/panel/:assignmentId` | Implemented panel removal | `coordinatorSubmission.routes.js:45` |
| `GET /api/coordinator/groups/dashboard` | Global counts, not adviser-scoped. Frontend no longer calls it | `coordinatorController.js:538-573`, `adviserService.js:6-9` |
| `GET /api/coordinator/submissions/reports` | Adviser-scoped aggregates: `byStatus`, `byStrand`, `byYear`, `published`, `accessStats`, `totalSubmissions`, `totalPublished` | `coordinatorSubmission.routes.js:28`, `coordinatorController.js:744-797` |
| `GET /api/coordinator/submissions/analytics` | Adviser-scoped totals: posts, comments, likes, access requests, downloads | `coordinatorSubmission.routes.js:29`, `coordinatorController.js:799-857` |
| `GET /api/adviser/access-requests`, `GET /api/adviser/access-requests/:id`, `POST .../approve`, `POST .../decline`, `POST /api/adviser/access-links/:id/revoke` | All-adviser scope by design; `status`, `group`, `paper` filters; no date filter or expired count | `access.routes.js:12-16`, `accessController.js:9-216` |
| `POST /api/invites`, `GET /api/invites` | Creates invite and returns link/temp password; no delivery status field | `invite.routes.js:7-8`, `inviteController.js:18-103` |
| `GET /api/forum/posts`, `POST /api/forum/posts/:id/hide`, `POST /api/forum/posts/:id/remove` | Adviser can hide/remove; queue is vault-wide, `created_at DESC LIMIT 100`; no restore/dismiss/reason | `forum.routes.js:14,21-22`, `forumController.js:43-107,262-297` |

---

## 1. Groups

### Current state

Group CRUD is adequate for the adviser frontend. `POST /groups` returns `group_id`, and `PUT /groups/:id` persists all editable group fields. The read-only Adviser field in the UI comes from `useAuth()` in create mode and `getGroup().adviser_name` in edit mode; the client does not send `adviser_id`.

### Backend items

- Keep setting `adviser_id = req.user.user_id` on `POST /groups`; do not trust a client-supplied adviser.
- Add server-side duplicate-name validation within the same section/year/school year. The current validation is client-side only.
- Apply adviser ownership checks to `GET /groups/:id`, `PUT /groups/:id`, member add/remove and panel actions. The adviser list is scoped, but detail/mutation routes are not.
- Keep `adviser_name` on `GET /groups/:id`; it is used by the A6 edit modal.

### Stale flags

- `backendSupport.groupCreateReturnsId` is `false` but `createGroup` already returns `insertId` (`groupController.js:80`).
- `backendSupport.groupFieldsSavedOnCoordinatorRoutes` is `false` but group fields are persisted (`groupController.js:93-101`).

Do not flip either flag as part of this doc. If they are removed or renamed, do it deliberately in Phase R.

### Acceptance condition

Create returns a real `group_id`; edit persists every field; list/detail reflect the change; duplicate names are rejected with JSON `{ "message": "..." }`.

---

## 2. Review queue and paper detail

### Scoping gap

`GET /coordinator/submissions` and `GET /coordinator/submissions/:id` currently return any submission. The Review Queue header honestly says **"All submissions in the vault"**, and the Review Screen paper navigation honestly says it covers **the 100 most recently updated submissions in the vault** (`AdviserReview.jsx:350`). The Group Detail Papers tab also filters a capped 100-row list client-side.

Required backend contract:

- Scope both endpoints to adviser-owned groups, using the same group filter as Reports and Analytics.
- Apply the same ownership check to stage, status, files, publish, unpublish, consent, comment and panel-removal routes.
- Return a real `pagination.total` for the scoped list so the 100-row cap can be removed.

### Filters

`handoff.md:163` requires group, strand, section, status and search filters. Current `getSubmissions` supports only `stage`, `status`, `program` and `search`. Add:

| Param | Meaning |
|---|---|
| `groupId` | Submissions for one adviser-owned group |
| `strand` | Strand or program fallback |
| `section` | Section |
| `status` | Existing status filter |
| `search` | Existing title/authors search |

### Status history

`getSubmissionById` does not return history, even though `updateStatus`, publish and unpublish write `submission_status_history`. Add `statusHistory` (or `status_history`) to the detail response:

```json
{
  "data": {
    "submission_id": 12,
    "statusHistory": [
      {
        "status": "under_review",
        "at": "2026-11-23T10:00:00Z",
        "note": "Please tighten the abstract.",
        "by": "Ana Reyes"
      }
    ]
  }
}
```

The `status`, `at`, `note`, `by` fields are consumed by `AdviserReview.jsx:450-457`. Also write a history row in `updateStage`; today only `updateStatus` writes one.

### Acceptance condition

An adviser can only list/open papers from their own groups; filters work server-side; status changes, notes and stage changes appear in the timeline; non-owned submissions return 404 or 403 with JSON.

---

## 3. Publishing, consent and files

### Publish gate

`publishSubmission` already checks `status === 'approved'`, at least one file, and consent (`coordinatorController.js:619-632`). Keep those checks and add an ownership check.

Two loopholes remain and cross-reference `docs/student-backend-requirements.md:256-257`:

1. `POST /coordinator/submissions/:id/consent` lets an adviser set consent without student action.
2. The publish check accepts `author_consent_at` on its own.

Remove or lock both so only a stored student `consent_status = 'granted'` satisfies the gate. The client already stopped sending `consentGranted`; server ignores it.

### File storage and versioning

`uploadSubmissionFile` inserts a new numbered row into `document_versions` and ignores the `final`/`defended` role. The handoff says no versioning, while the schema and both student and adviser upload paths create versions. This remains unresolved and must be clarified with the other developers before backend work changes the data model.

If final and defended papers are meant to be distinct, add explicit fields/roles and return them in detail. If replacement is meant to be in-place, stop inserting numbered version records. Do not silently keep both interpretations.

### Published lock

Add a published-status guard to the adviser upload route, matching the student route. After publish, the author cannot edit and adviser upload should be blocked until unpublish.

### Reason flags

- `statusNote` is `false`. The server accepts and stores `note` (`coordinatorController.js:504-508`), but the detail endpoint does not return it. Keep the flag false until write and read are both verified.
- `unpublishReasonStored` is `false` but the reason is already stored as a history note (`coordinatorController.js:684-688`). This is a stale write-only flag; verify the read path before any Phase R flip.
- `adviserAbstractEdit` and `requestConsent` remain false; no matching server action exists.

### Acceptance condition

Only student consent can satisfy publish; advisers cannot alter published papers; versioning behavior is explicitly resolved; status notes and unpublish reasons are readable in the timeline.

---

## 4. Dashboard

The frontend no longer calls `getDashboard()`. `AdviserDashboard.jsx` derives scoped KPIs from `GET /groups` plus `GET /coordinator/submissions/reports`, and labels the activity list **"Recently published"** from the report's real `published` rows. This is honest but capped by what Reports returns.

Provide a dedicated adviser-scoped dashboard endpoint when backend work lands:

```json
{
  "data": {
    "total_groups": 4,
    "total_submissions": 18,
    "pending_review": 5,
    "published": 7,
    "by_status": [{ "status": "submitted", "count": 5 }],
    "recent_activity": [
      {
        "submission_id": 12,
        "title": "Study title",
        "group_name": "Group Alpha",
        "type": "status_change",
        "updated_at": "2026-11-23T10:00:00Z"
      }
    ]
  }
}
```

`recent_activity` must be adviser-scoped and include real event types. The current global `getDashboardStats` has `stage/status/recent_activity` across the whole vault and should not be reintroduced. The legacy `getDashboard()` helper in `adviserService.js` is unused and can remain until Phase R cleanup.

Phase R should add a new flag such as `adviserDashboardScoped`; the current shared `getDashboard()` call must not be restored unscoped.

---

## 5. Access inbox

### Scope is complete by design

Do **not** scope the access inbox to the adviser's groups. `handoff.md:37` and `:195` explicitly require all advisers to see all access requests. The current `listRequests` behavior is correct. The UI header says **"People asking for the full text of a paper in the vault. Any adviser can approve or decline a request and share the link."** and makes no email-delivery claim.

### Gaps

- Add `dateFrom` / `dateTo` filters on `r.created_at`.
- Return a real `expired` count. `backendSupport.adviserExpiredCount` is `false`; the UI shows `—` and an explanatory note.
- Add a resend route or link status action; `handoff.md:209` requires resend/revoke.
- Return real link state: `sent`, `expiresAt`, `used`, `revoked`.
- `approveRequest` returns `emailSent: true` unconditionally while `sendEmail` is fire-and-forget (`accessController.js:139,148`). Return a real delivery status such as:

```json
{
  "data": {
    "requestId": 7,
    "linkId": 3,
    "expiresAt": "2026-11-26T10:00:00Z",
    "status": "approved",
    "delivery": {
      "status": "sent",
      "provider": "console",
      "sentAt": "2026-11-23T10:00:00Z",
      "error": null
    }
  }
}
```

Omitting `emailSent` is also acceptable; the frontend must not be asked to claim delivery without a verified result.

### Acceptance condition

All advisers still see all requests; date filter and expired count work; resend/revoke update link state; delivery status is real or absent.

---

## 6. Moderation

### Current state

`GET /forum/posts` supports `groupId`, `strand`, `section`, `yearLevel`, `schoolYear`, `status`, `search`, `reported`, `page`, `limit`, but orders by `created_at DESC LIMIT 100` and excludes removed rows. The adviser UI honestly says the queue covers reported posts across the vault and only the 100 most recent reports are checked.

`handoff.md:452` says "Moderation → own group reports". Either implement an adviser-scoped reported queue or confirm a handoff-level change with the product owner. Do not silently leave the UI claiming vault-wide scope if the intended contract is own-group scope.

### Missing routes and fields

- `POST /api/forum/posts/:id/restore` — clear `removed`, return `{ "message": "Post restored" }`.
- `POST /api/forum/posts/:id/dismiss-report` — clear `reported` without changing hidden/removed state.
- Extend `reportPost` to store and return `reason`, `reporterName` and `reporterEmail` (snake_case aliases accepted).
- Return a real total so the 100-row cap can be removed.
- Write an audit entry for hide, remove, restore and dismiss-report. Current forum handlers do not audit these writes.

The `adminDismissReport`, `adminRestoreRemoved` and `adminModerationReason` flags gate the corresponding adviser UI controls too; they stay false until verified.

### Acceptance condition

The chosen scope is explicit; restore/dismiss work; report details are visible; the queue reports a real total and audits moderation writes.

---

## 7. Panelist invitations

`POST /invites` creates an invite and returns `message`, `email`, `inviteUrl`, `tempPassword`, `expiresAt` (`inviteController.js:97-103`). Email is attempted fire-and-forget; failures are only logged (`:91-95`). There is no `transport` or delivery status.

The adviser UI says **"Create invitation"** / **"Creating…"** and shows **"Invitation created for …"**. It does not claim an email was sent. `backendSupport.panelistInvite` is already `true` from earlier work but is unused by adviser pages; leave it unchanged in this doc pass.

Required when backend work lands:

```json
{
  "message": "Invitation created",
  "email": "panelist@example.edu",
  "inviteUrl": "https://.../invite/...",
  "expiresAt": "2026-11-24T10:00:00Z",
  "delivery": {
    "status": "sent",
    "provider": "console",
    "sentAt": "2026-11-23T10:00:00Z",
    "error": null
  }
}
```

A proposed `adviserInviteDeliveryStatus` flag would unlock sent/queued/failed copy only after a real value is returned.

---

## 8. Analytics and reports

Both endpoints are already adviser-scoped (`coordinatorController.js:752-755`, `:806-809`). Reports return by-status, by-strand, by-year, published, access-stat and total aggregates. Analytics returns total posts, comments, likes, access requests and downloads.

Remaining gaps from `handoff.md:219-225,253-260`:

- Analytics: group selector, date range, time-series charts, papers-by-status and request-outcome charts.
- Reports: filters for strand, section, year level, school year, group and date range; group-level and strand-level totals; print-friendly view; CSV export.
- Downloads must be server-derived, not inferred from capped/forum data.
- Keep CSV export and print client-side until the data source is verified.

The frontend currently uses honest interim notes; do not replace them with fabricated charts.

---

## 9. Capability flags — current values

All values below are current in `client/src/services/backendSupport.js`. "Flip" means verify the endpoint/field on the server, enable the flag, remove the matching caveat and re-run targeted ESLint plus `npm run build` in Phase R.

| Flag | Value | Activation condition |
|---|---|---|
| `statusNote` | `false` | Server stores `note` **and** detail returns it in `statusHistory` |
| `statusHistory` | `true` | Pre-existing/shared flag. Adviser detail still lacks history; UI shows an explicit missing-data note. Add an adviser-specific flag in Phase R if separate control is needed |
| `panelistInvite` | `true` | Pre-existing and unused in adviser pages; leave unchanged |
| `studentConsent` | `true` | Shared flag used by publish gate; keep true |
| `adviserAbstractEdit` | `false` | Server accepts and persists adviser abstract edits |
| `requestConsent` | `false` | Real request-consent action exists |
| `finalAndDefendedFiles` | `false` | Distinct final/defended fields verified |
| `unpublishReasonStored` | `false` | Stale write-only flag; verify the stored reason is returned in history |
| `adviserExpiredCount` | `false` | Access list returns a real expired count |
| `adminDismissReport` | `false` | `POST /forum/posts/:id/dismiss-report` verified |
| `adminRestoreRemoved` | `false` | `POST /forum/posts/:id/restore` verified |
| `adminModerationReason` | `false` | Report reason/reporter stored and returned |
| `groupCreateReturnsId` | `false` | Stale; `createGroup` already returns `insertId`. Do not flip without explicit decision |
| `groupFieldsSavedOnCoordinatorRoutes` | `false` | Stale; group fields already persist. Do not flip without explicit decision |
| `adminEditRoles` | `false` | **Do not flip.** Admin scope; roles are fixed by design |

Proposed new Phase R flags, not added during this doc work:

| Proposed flag | Activation condition |
|---|---|
| `adviserDashboardScoped` | Dedicated adviser-scoped dashboard verified |
| `adviserSubmissionScoping` | Submission list/detail and all adviser mutation routes verified as scoped |
| `adviserGroupPaperFilter` | Group Papers list can be server-filtered without the 100-row cap |
| `adviserModerationScope` | The chosen own-group/vault-wide moderation contract is verified |
| `adviserInviteDeliveryStatus` | Invite response returns a real delivery status |

---

## 10. Acceptance checklist — current status

| # | Check | Status |
|---:|---|---|
| 1 | Adviser can create, edit and navigate groups | **Partial/complete by design** — CRUD works; ownership checks and duplicate validation missing |
| 2 | Review Queue shows only the adviser's papers | **Gap** — §2 |
| 3 | Paper detail shows real status history with notes and actors | **Gap** — §2 |
| 4 | Status changes and stage changes are recorded | **Partial** — status writes history; stage does not |
| 5 | Publish cannot be bypassed by adviser-side consent | **Gap** — §3 |
| 6 | Published papers cannot be edited; versioning interpretation resolved | **Gap/unresolved** — §3 |
| 7 | Dashboard uses adviser-scoped data | **Partial** — frontend derives scoped KPIs; no dedicated endpoint |
| 8 | Access inbox remains all-adviser and gains date/expired/resend/delivery support | **Partial** — scope correct by design; gaps in §5 |
| 9 | Moderation scope is explicit and restore/dismiss/reason work | **Partial/needs clarification** — §6 |
| 10 | Invite creation reports real delivery state | **Partial** — invite record works; delivery status missing |
| 11 | Analytics and Reports have date ranges, filters, charts, export and print | **Partial** — scoped data exists; richer contract missing |
| 12 | Flags remain unchanged until verified | **Complete** — A6 flipped nothing; `adminEditRoles` still false |

---

## 11. Frontend files that consume this contract

- `client/src/services/adviserService.js` — groups, submissions, review actions, publish/unpublish, reports, legacy dashboard helper
- `client/src/services/accessService.js` — adviser access-inbox calls
- `client/src/services/inviteService.js` — panelist invite list/create
- `client/src/services/adminService.js` — shared moderation post helpers used by `AdviserModeration.jsx`
- `client/src/hooks/usePostActions.js` — hide/show/remove flows
- `client/src/services/backendSupport.js` — flags and honest caveats
- `client/src/pages/adviser/` — `AdviserDashboard.jsx`, `AdviserGroups.jsx`, `AdviserGroupDetail.jsx`, `AdviserSubmissions.jsx`, `AdviserReview.jsx`, `AdviserInbox.jsx`, `AdviserModeration.jsx`, `AdviserPanelists.jsx`, `AdviserAnalytics.jsx`, `AdviserReports.jsx`
- `client/src/components/group/GroupSwitcher.jsx` — group-to-group navigation
- `client/src/services/api.js` — base URL, bearer token and 401 session-expired handling

No backend, database or `docs/handoff.md` files were modified as part of the Adviser frontend work.

---

## 12. Remaining backend work

Owner: backend developer. None of these require changes to `docs/handoff.md`. Flags are flipped by the frontend developer only after each item is verified.

### Hard-rule constraints

1. **Do not scope the access inbox to adviser groups.** All advisers may view and decide all requests (`docs/handoff.md:37`, `:195`).
2. **Do not add admin publish or access-approval routes.** Those remain adviser actions (`docs/handoff.md:38-39`).
3. **Do not allow adviser-side consent or self-attestation** (`docs/handoff.md:249-250`).
4. **Do not allow edits after publish.** Add the missing adviser upload guard (`docs/handoff.md:42`, `:457`).
5. **Do not silently keep both versioning interpretations.** Resolve the "no versioning" rule against persisted `document_versions` rows.
6. **Do not claim email delivery without a verified result.** `emailSent: true` and invite email side effects are currently not reliable.

### Functional gaps

7. Scope submission list/detail and every adviser mutation route to adviser-owned groups.
8. Add `statusHistory` to detail, include saved notes, and write history on stage changes.
9. Add the dedicated adviser dashboard and real recent-activity data.
10. Add server-side Review Queue group/strand/section filters and a scoped total.
11. Enforce duplicate group names server-side and add ownership checks to group detail/mutations.
12. Add access-inbox date filter, expired count, resend and real link/delivery state.
13. Resolve moderation scope, add restore/dismiss, report reason/reporter, real totals and audit entries.
14. Add invite delivery status.
15. Add analytics date ranges/charts and report filters/export/print data.

### Contract and data-shape gaps

16. Keep list responses in the shape already consumed: `{ data, pagination }` for submissions, `{ data, counts }` for access requests, bare arrays where the client already expects them.
17. Return JSON `{ "message": "..." }` on failures. A 401 must trigger the client's existing session-expired event (`client/src/services/api.js`).
18. Preserve camelCase and snake_case aliases where documented. Phase R verification must confirm at least one real value, not just a `null` field.
19. After each backend area lands, verify it in Phase R one area at a time, then flip only that area's flag(s), remove its caveat(s), and re-run targeted ESLint and `npm run build`.

QA sheets are not created yet; they come after the backend work and Phase R verification are complete.
