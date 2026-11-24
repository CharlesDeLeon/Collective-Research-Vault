# Current state and deviations

**Last updated:** 2026-11-24

**Purpose:** living record of what Phase R has actually verified, what is still flagged off, and where the current code or observed behavior differs from the frozen requirement docs.

**Baseline rule:** the consumed requirement docs (`student-`, `adviser-`, `panelist-`, `admin-`, `public-reader-backend-requirements.md`, `backend-status-report.md`) are frozen and are not edited to match current code. `docs/handoff.md` is the source of truth and is never edited. This file records deviations instead.

---

## Phase R status

| Role | Phase R status | Notes |
|---|---|---|
| Student | Verified (2026-11-24) | Read-only contracts confirmed; manual QA checklist populated |
| Adviser | In progress | Partial user-run results; verification not complete |
| Admin | Not started | |
| External Panelist | Not started | |
| Public Reader | Not started | |

## Adviser user-run results (deployed app)

| ID | Result | Notes |
|---|---|---|
| AD-01 | Pass | Groups list scoped to own groups |
| AD-02 | Pass | Group creation persists |
| AD-03 | Fail | Duplicate name still created; year field accepted letters |
| AD-04 | Pass | Edited group fields persisted after reload |
| AD-05 | Unconfirmed | User looked for "submissions"; correct location is Reviews (`/adviser/reviews`) |
| AD-06 to AD-18 | Not run | |

AD-05 must be re-run under Reviews. AD-06 through AD-18 are still required before Adviser Phase R can be called verified.

## Capability flags

`client/src/services/backendSupport.js` now has 31 flags `true` and 7 `false`, after the strategy B pre-enable pass on 2026-11-24.

**False (real gaps, not gates):** `requestConsent`, `adviserAbstractEdit`, `finalAndDefendedFiles`, `adminEditRoles`, `adminDownloads`, `adminActiveUsers`, `adminReportStatuses`.

**True:** all other flags, including adviser status notes and unpublish reasons, the stale group flags, the shared moderation flags, and the Admin flags listed in `docs/backend-status-report.md:113-130`.

Strategy B replaces "verify then flip" with "enable from code inspection, then confirm by test." A failed area is reverted to `false` and recorded as a gap. `adminEditRoles` stays `false` by design: `docs/handoff.md:318-322` specifies a read-only permission matrix with "optional later: editable matrix." Caveat strings remain in `unsupportedNote` but are gated by their flags, so they are hidden while enabled and can be restored immediately on revert.

## Frontend changes made in this pass

- Deleted dead `client/src/components/paper/VersionHistory.jsx`.
- Removed dead `getDashboard()` from `client/src/services/adviserService.js`.
- `AdviserGroups.jsx` now restricts `school_year` typing to digits and hyphens (max 9 characters) and requires `YYYY-YYYY` form on save (matching the field's existing `2026-2027` placeholder). Letters can no longer be entered.
- `AdviserGroups.jsx` client duplicate check now matches the server rule: name + section + school year.
- Adviser `versions[0]` fallback in `AdviserReview.jsx:199` remains until AD-08 confirms a usable file path.

## Known gaps and deviations

- **AD-03 duplicate behavior:** the client previously checked only name + section; the server checks name + section + school year. The client check is now aligned, but the deployed report that an identical group was still created has not been re-tested. Verify after the fix is deployed.
- **Adviser `versions[0]` fallback:** adviser detail returns `file_path` / `file_name` rather than a single `file` object, so the fallback is retained until AD-08 is checked live.
- **`deleteGroup` ownership check:** code review found no ownership check on the server. Reported only; backend is not edited in Phase R.
- **`setSubmissionConsent()`:** dead helper in `adviserService.js` targeting an unrouted endpoint. Deferred to the dedicated cleanup phase.
- **Panelist navigation:** Forum and Gallery appear in the sidebar and routes, which conflicts with the handoff/hard-rule notes. Outside Adviser Phase R; unresolved.
- **Local API:** `http://localhost:5000/api` is unreachable from the assistant environment; earlier checks returned HTTP 503 with `database: disconnected, storage: unavailable`. The deployed URL is not available to the assistant. User-run deployed tests are the current verification source.
- **Backend deferred work** (from `docs/backend-status-report.md:140-147`): signed URLs via Supabase Storage migration; analytics time-series and download/active-user counts; server report query for submission statuses; dedicated endpoint for large-catalog facets; `statusNote` UI collection; `unpublishReasonStored` read-path verification.

## Decisions recorded

- Adviser moderation follows the current backend scope (vault-wide).
- Shared moderation flags affect Admin UI when flipped; accepted.
- Consumed requirement docs stay frozen; this deviations doc is the living record.
- Strategy B: pre-enable code-backed flags so tests confirm rather than unlock; revert failed areas.
- A dedicated cleanup phase follows all role Phase R work.
- User runs all git commands; assistant does not.

## Outstanding work

1. Re-run AD-05 under Reviews; complete AD-06 through AD-18.
2. Confirm the pre-enabled areas by test; revert any failed area and add checklist entries for Adviser.
3. Run Admin, External Panelist, and Public Reader Phase R.
4. Backend fixes and migrations for the gaps listed above (owner-side).
5. Dedicated cleanup phase, then final manual QA.
