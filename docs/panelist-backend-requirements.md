# External Panelist backend contract — current state

**Purpose:** implementation checklist for the External Panelist backend contract the frontend is prepared to consume. The panelist frontend is complete through P5; this document records the exact endpoints, fields and response shapes that still need backend support. It is not a redesign and not a request to change `docs/handoff.md`.

**Source of truth:** `docs/handoff.md`. If anything here conflicts with the handoff, `docs/handoff.md` wins and is not edited here. Panelist-relevant hard rules still apply:

**Backend status:** substantial implementation landed. See `docs/backend-status-report.md` for the current state, required migrations, and Phase R flag guidance.

1. Panelist primary nav is **Dashboard · Groups · Notifications · Profile** (`docs/handoff.md:55`). The frontend now matches this; Forum and Papers tabs were removed in P2.
2. Panelist screens are Dashboard, Group feed, Paper detail, Notifications, Profile and Invite acceptance (`docs/handoff.md:267-278`).
3. **"Panelists can read and comment, but cannot set status, upload files, publish, or approve access"** (`docs/handoff.md:278`). Do not add any of those capabilities.
4. Discussion posts remain freely editable/deletable by their author (`docs/handoff.md:43`), which applies to panelist-owned posts too.
5. Invite acceptance is marked "deferred until email works" (`docs/handoff.md:276`). The route exists and is functional; do not claim email delivery.

**Current status:** panelist frontend P1–P5 is complete and stopped for backend work. No capability flags were changed; `adminEditRoles` remains `false` (`client/src/services/backendSupport.js:31`). The frontend uses real data where possible and explicit caveats where the server cannot support the role yet. Phase R flips one verified feature area at a time.

Base URL is `/api` (`client/src/services/api.js`). Routes use the JWT `Authorization: Bearer <token>` header.

---

## 0. Implemented contract (verified in `server/routes` / `server/controllers`)

| Route | Current state | Evidence |
|---|---|---|
| `GET /api/groups` | Returns `group_id`, `group_name`, `program`, `strand`, `section`, `year_level`, `school_year`, `created_by`, `adviser_id`, `created_at`, `member_count`, `submission_count`. Scopes `student` and `adviser`; **no `external_panelist` branch**, so panelists receive every group | `group.routes.js:13`, `groupController.js:3-32` |
| `GET /api/groups/:id` | Returns group fields, `adviser_name`, `members`, and `panel` with `faculty_id AS user_id`, `name`, `email`, `role_in_panel`, `assigned_at`. **No ownership check** | `group.routes.js:15`, `groupController.js:34-68` |
| `GET /api/panelist/papers` | Role middleware allows `external_panelist`, `adviser`, `sysadmin`. Query is **unscoped** over all submissions; returns metadata plus `groupName` and `hasFile`, but **no `group_id`** | `panelist.routes.js:7`, `panelistController.js:3-41` |
| `GET /api/forum/posts` | Supports filters and paging. Scopes `adviser` by group; **panelists are unscoped**. Ordered `created_at DESC LIMIT ? OFFSET ?` | `forum.routes.js:14`, `forumController.js:43-75` |
| `GET /api/forum/posts/:id` | Returns post with comments; no panelist ownership check | `forum.routes.js:16`, `forumController.js` |
| `POST /api/forum/posts/:id/like`, `POST .../comments`, `PATCH /api/forum/comments/:id`, `DELETE /api/forum/comments/:id`, `POST .../report` | Implemented and used by panelists through `ForumPostCard` | `forum.routes.js:19-20,25-29` |
| `GET /api/invites/:token`, `POST /api/invites/:token/accept` | Validate and accept an invite; UI sets the returned session. No delivery status | `invite.routes.js:9-10`, `client/src/pages/public/InviteAccept.jsx` |
| Notifications list / mark read | Generic endpoints consumed via `useNotifications()`; no panelist-specific behavior | `client/src/hooks/useNotifications.js` |
| Profile update / change password | Generic endpoints consumed via `authService`; flags are already `true` | `client/src/services/authService.js`, `backendSupport.js:12-13` |

---

## 1. Assigned groups

### Current state

`listAssignedGroups(userId)` in `client/src/services/panelistService.js:4-11` no longer trusts the stale `panelistScopedGroups` flag. It fetches `GET /groups` and intersects the result with real panel membership by calling `GET /groups/:id` for every group and checking `panel[].user_id`. It returns `[]` when no user id is available.

This is honest — it uses real membership data from the server — but it is an interim workaround with three costs:

- One detail request per group on every mount (N+1). Dashboard, Groups and Group detail each mount the hook independently.
- A failed `getGroup` call is swallowed (`.catch(() => null)`), so an assigned group can silently disappear from the list.
- It depends on `GET /groups` returning every group, which is exactly the behavior that should eventually be scoped away.

The Groups page says **"Groups where you are listed on the review panel"** and **"Assignment is read from each group's panel list for now"** (`PanelistGroups.jsx:22-23`).

### Required backend contract

Add a dedicated endpoint that returns only the current panelist's assigned groups:

```json
{
  "data": [
    {
      "group_id": 4,
      "group_name": "Group Alpha",
      "program": "Research",
      "strand": "STEM",
      "section": "A",
      "year_level": "12",
      "school_year": "2026",
      "member_count": 6,
      "submission_count": 3
    }
  ]
}
```

Rules:

- Scope by `panel_assignments.faculty_id = req.user.user_id`. A panelist's own assignment is sufficient; do not require an adviser role.
- Keep `GET /groups` scoped for `external_panelist` as a second layer, using the same membership rule.
- Preserve the existing field names, especially `group_id` and `submission_count`; the dashboard KPI sums `submission_count` (`PanelistDashboard.jsx:19`).
- Return JSON `{ "message": "..." }` on failures. A 401 must trigger the client's existing session-expired handling.

### Phase R note

`backendSupport.panelistScopedGroups` is currently `true` and unused by the helper. After a real scoped endpoint is verified, Phase R should point `listAssignedGroups` at it and remove or repurpose the flag. Do not flip the flag before then.

---

## 2. Group detail ownership

### Current state

`PanelistGroupDetail.jsx:29-32,85-94` checks the URL's `groupId` against assigned groups before fetching. Non-assigned groups show **"You are not assigned to this group"** and no `getGroup` request is made. This is client-side only; `GET /groups/:id` itself still serves any group to any authenticated user.

### Required backend contract

- Apply an ownership check to `GET /api/groups/:id` for `external_panelist`. Return 403 or 404 with JSON when the user has no panel assignment for that group.
- Keep `adviser_name`, `members` and `panel` in the response — the detail view uses all three.
- Keep `panel[].user_id` (the `faculty_id` alias at `groupController.js:57`); the frontend's interim intersection depends on it, and Phase R verification should confirm it remains.
- Apply the same ownership check to any panelist-facing group mutation route. Panelists should have none.

### Acceptance condition

A direct API call to a non-assigned group returns 403/404 JSON; the UI guard and the server agree on what is visible.

---

## 3. Papers list

### Current state

`GET /api/panelist/papers` returns every submission in the vault. The standalone Papers page was unmounted in P2 to match handoff §1, so no active panelist screen consumes this endpoint today. The group detail "Papers" tab instead lists paper posts from the group's forum feed.

`panelistController.js:11` derives `hasFile` from `EXISTS (SELECT 1 FROM document_versions dv ...)`. Versioning is being removed as a feature (backend-owned cleanup), so this field has no stable source once those rows stop being written.

### Required backend contract

- Scope `/panelist/papers` to the caller's assigned groups.
- Add a numeric `group_id` to each row alongside `groupName`; the current response cannot be filtered reliably by the client.
- Add `{ data, pagination }` with a real total so a list page can be reintroduced without a row cap.
- Replace the `document_versions`-derived `hasFile` with a stable file-presence field as part of the versioning removal.
- Do not add any status-change, upload, publish or access-approval route for panelists.

This is lower priority than §1 and §4 because no active panelist screen depends on it, but the endpoint should not remain vault-wide.

---

## 4. Forum feed, post detail and paging

### Current state

`ForumProvider.jsx:84-91` requests `GET /forum/posts?limit=200`. The server orders by `created_at DESC LIMIT 200` and does not scope panelists (`forumController.js:59-75`). The frontend then filters those 200 posts client-side:

- Dashboard "Recent posts" keeps the first 5 whose `groupId` matches an assigned group (`PanelistDashboard.jsx:17-18`).
- Group detail Feed and Papers tabs filter the same list by group (`PanelistGroupDetail.jsx:58-59`).

Three explicit caveats disclose this: **"Only the 200 most recent posts in the vault are checked"** on the dashboard and on both group tabs. The empty states no longer imply that no posts exist.

`PanelistPostDetail.jsx:11-14` adds an ownership guard equivalent to P1's group guard. A post from a non-assigned group shows **"This post is not available."** Posts with no `groupId` are still allowed.

### Required backend contract

Provide either role-based scoping on `GET /api/forum/posts` for `external_panelist`, or a dedicated panelist endpoint:

```json
{
  "data": [
    {
      "id": 12,
      "groupId": 4,
      "groupName": "Group Alpha",
      "type": "paper",
      "paperTitle": "Study title",
      "text": "Post body",
      "status": "under_review",
      "createdAt": "2026-11-23T10:00:00Z",
      "likes": 3,
      "liked": false,
      "reported": false,
      "comments": []
    }
  ],
  "pagination": { "page": 1, "limit": 25, "total": 42 }
}
```

Rules:

- Scope to assigned groups only.
- Return a real `total` so the 200-row cap and its three caveats can be removed.
- Apply the same ownership check to `GET /api/forum/posts/:id`. The detail guard currently relies on the client-side post list; a deep link to a non-assigned post should also be rejected by the server.
- Keep like, comment, edit/delete-own and report working. Panelists must remain read-and-comment participants.
- Do not expose moderation actions (hide/remove/restore/dismiss-report) to panelists.

### Acceptance condition

A panelist can only list and open posts from assigned groups; totals are real; the 200-row caveat can be removed in Phase R.

---

## 5. Permission boundary

The active panelist UI was checked against handoff §5. `ForumPostCard` exposes only:

- like / unlike
- comment thread with add, edit and delete-own
- report
- edit / delete for the panelist's own posts

It contains no status selector, file upload, publish button, or access-approval control. The composer is unreachable: `PanelistLayout.jsx:19` sets `showComposer={false}`, the Forum tab was removed in P2, and the empty-state composer in the shared `FeedList` is no longer mounted for panelists.

`client/src/services/authService.js` and `client/src/services/adviserService.js` still export helpers for actions panelists must not use. They are not called from panelist pages. Backend role middleware must remain the enforcement point.

---

## 6. Invite acceptance, notifications and profile

No panelist-specific backend gap was identified in these areas:

- `/invite/:token` is routed in `App.jsx` and `InviteAccept.jsx` validates the token, accepts the invite with a temporary password, and stores the returned session. The copy says "Activate your panelist account" and does not claim an email was sent.
- Notifications use generic endpoints through `useNotifications()` with read/unread filters and mark-as-seen.
- Profile uses real `updateProfile` and `changePassword` calls; `profileSync` and `changePassword` are already `true`.

`backendSupport.panelistInvite` is `true`, but `unsupportedNote.panelistInvite` still says panelists are assigned by a System Admin for now and email invitations arrive later. The invite record works; email delivery status does not. Do not add delivery claims until a verified status is returned. The adviser doc covers invite delivery status in more detail.

---

## 7. Capability flags — current values

| Flag | Value | Note |
|---|---|---|
| `panelistScopedGroups` | `true` | Stale. Server does not scope groups; the frontend helper no longer reads it. Phase R: repoint to a real scoped endpoint, then remove or repurpose |
| `panelistPaperList` | `true` | Stale. Standalone Papers page unmounted; group Papers tab uses forum posts. Caveat text exists but is currently hidden |
| `panelistInvite` | `true` | Invite acceptance works; email delivery does not. Leave unchanged |
| `profileSync` | `true` | Real profile endpoint in use |
| `changePassword` | `true` | Real password endpoint in use |
| `adminEditRoles` | `false` | **Do not flip.** Admin scope; roles are fixed by design |

Proposed new Phase R flags, not added during this work:

| Proposed flag | Activation condition |
|---|---|
| `panelistAssignedGroupsScoped` | Dedicated assigned-groups endpoint verified; N+1 lookup removed |
| `panelistForumScoped` | Scoped forum list with a real total verified; 200-row caveats removed |
| `panelistOwnershipChecked` | Server rejects non-assigned group and post detail requests |
| `panelistPapersScoped` | `/panelist/papers` is scoped, returns `group_id` and a stable file-presence field |

---

## 8. Acceptance checklist — current status

| # | Check | Status |
|---:|---|---|
| 1 | Nav matches handoff §1 | **Complete** — Forum and Papers tabs removed |
| 2 | Groups list shows only assigned groups | **Partial** — client-side intersection from real panel data; needs server scoping |
| 3 | Non-assigned group detail blocked | **Partial** — frontend guard only; server still serves it |
| 4 | Non-assigned post detail blocked | **Partial** — frontend guard only; server still serves it |
| 5 | Dashboard and group feed counts honest | **Complete** — 200-post caveats in place |
| 6 | Panelists cannot set status, upload, publish or approve access | **Complete in UI** — no controls; backend role middleware must hold |
| 7 | Papers endpoint scoped and complete | **Gap** — §3, lower priority until a list page is restored |
| 8 | Invite/notification/profile copy honest | **Complete** |
| 9 | Flags unchanged until verified | **Complete** — P1–P5 flipped nothing |

---

## 9. Frontend files that consume this contract

- `client/src/services/panelistService.js` — assigned groups and papers list helpers
- `client/src/services/adviserService.js` — `listMyGroups()` and `getGroup()` used by the interim intersection
- `client/src/services/api.js` — base URL, bearer token, 401 session-expired handling
- `client/src/hooks/useAssignedGroups.js` — loads assigned groups for Dashboard, Groups and both detail pages
- `client/src/context/ForumProvider.jsx` — forum post loading and composer state
- `client/src/pages/panelist/` — `PanelistLayout.jsx`, `PanelistDashboard.jsx`, `PanelistGroups.jsx`, `PanelistGroupDetail.jsx`, `PanelistPostDetail.jsx`
- `client/src/pages/public/InviteAccept.jsx` — invite acceptance
- `client/src/pages/student/ActivityHistory.jsx`, `client/src/pages/student/Profile.jsx` — shared role-neutral screens
- `client/src/App.jsx` — panelist route table
- `client/src/components/dashboard/Sidebar.jsx` — `PANELIST_NAV` and `PANELIST_BOTTOM`
- `client/src/components/forum/ForumPostCard.jsx` — permission boundary
- `client/src/services/backendSupport.js` — flags and caveats

No backend, database or `docs/handoff.md` files were modified as part of the panelist frontend work.

---

## 10. Remaining backend work

Owner: backend developer. None of these require changes to `docs/handoff.md`. Flags are flipped by the frontend developer only after each item is verified.

### Hard-rule constraints

1. **Do not give panelists status, upload, publish or access-approval capabilities** (`docs/handoff.md:278`).
2. **Do not add Forum or Papers back to panelist primary nav** (`docs/handoff.md:55`).
3. **Do not claim email delivery** for invites without a verified result (`docs/handoff.md:276`).
4. **Do not reintroduce versioning** while cleaning up the leftover `document_versions` writes; the feature was removed and its cleanup is backend-owned.

### Functional gaps

5. Add a dedicated assigned-groups endpoint and scope `GET /groups` for `external_panelist`.
6. Add server-side ownership checks to `GET /groups/:id` and `GET /forum/posts/:id`.
7. Scope and paginate the panelist forum feed with a real total.
8. Scope `GET /panelist/papers`, add `group_id`, and replace the `document_versions`-derived `hasFile`.
9. Preserve forum like/comment/report and edit/delete-own for panelists; keep moderation actions adviser/admin-only.

### Verification and Phase R

10. Return JSON `{ "message": "..." }` on failures, and preserve the response shapes already consumed where documented. A 401 must trigger the client's session-expired event.
11. Preserve camelCase and snake_case aliases where documented. Phase R verification must confirm at least one real value, not just a `null` field.
12. After each backend area lands, verify it in Phase R one area at a time, then flip only that area's flag(s), remove its caveat(s), and re-run targeted ESLint and `npm run build`.

QA sheets are not created yet; they come after backend work and Phase R verification are complete.
