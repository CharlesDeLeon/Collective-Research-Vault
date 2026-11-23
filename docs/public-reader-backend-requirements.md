# Public Reader backend contract — current state

**Purpose:** record of the backend contract the Public Reader frontend consumes, plus the work still owned by the backend developer. The frontend is complete against the endpoints that exist today. This document records their verified shape and the remaining gaps; it is not a redesign.

**Source of truth:** `docs/handoff.md`. If anything here conflicts with the handoff, `docs/handoff.md` wins and is not edited here. Public-Reader-relevant hard rules still apply:

1. The public can browse **title, abstract, metadata and APA citation anonymously** (`docs/handoff.md:18`).
2. Full papers are gated behind a **72-hour, single-use access link approved by the group adviser** (`docs/handoff.md:19`).
3. **Advisers alone** publish papers and approve/decline access requests; there is no admin override (`docs/handoff.md:38-39`, `:459`).
4. On email send failure, the link must remain available in the adviser inbox for manual copy (`docs/handoff.md:494`).
5. An archived/unpublished paper is removed from the gallery **and its links are revoked** (`docs/handoff.md:42`, `:496`).

**Current status:** Public Reader has **no capability flags** in `client/src/services/backendSupport.js`. The frontend calls the live public endpoints directly, so there is nothing to gate or flip for this role in Phase R. The frontend changes are resilience and honesty improvements around the existing contract; the remaining work below is backend-owned.

**Note:** `docs/handoff.md:5` still reads "Status: locked plan, pre-implementation." It remains the source of truth and is not edited here.

Base URL is `/api` (`client/src/services/api.js:5-7`). The public router is mounted at `/api/public` (`server/index.js:56`) and has **no auth middleware** (`server/routes/public.routes.js`) — correct for anonymous readers. All responses are JSON. Paper filters use scalar query params only; `kw` and `sort` are not supported and are not sent by the client.

---

## 0. Implemented contract (verified in `server/routes` / `server/controllers`)

| Route | Current state | Evidence |
|---|---|---|
| `GET /public/papers` | Returns `{ data: [...] }`. Supports `strand`, `section`, `year`, `q`, `featured=true`, `limit` (default 50), `offset` (default 0). Fixed ordering: `published_at DESC NULLS LAST, updated_at DESC`. No total count, no `kw`, no `sort` | `publicController.js:31-56`, `public.routes.js:8` |
| `GET /public/papers/:slug` | Returns `{ data: paper }`; 404 `{ message: 'Paper not found' }` when absent or unpublished | `publicController.js:59-75`, `public.routes.js:9` |
| `POST /public/access-requests` | Requires `paperSlug`, `name`, `email`; returns `201 { data: { ref, requestId } }` with a `CV-XXXXXX` code. Writes a `request_submitted` access log. `institution` / `purpose` optional | `publicController.js:78-119`, `public.routes.js:12` |
| `GET /public/access/status/:ref` | Returns `{ data: { ref, status, decisionNote, paperSlug, paperTitle, createdAt, linkStatus } }`; 404 when the ref is unknown. `linkStatus` is derived from the newest link as `revoked` / `used` / `expired` / `active` | `publicController.js:121-166`, `public.routes.js:13` |
| `GET /public/access/:token` | Confirm only — **does not consume**. Returns `{ data: { state, paperSlug } }` with `valid` / `revoked` / `used` / `expired` / `invalid`. Unknown tokens return `200` with `state: 'invalid'` | `publicController.js:168-194`, `public.routes.js:14` |
| `GET /public/access/:token/view` | Consumes atomically (`used_at` set with a `RETURNING` guard). Returns `{ data: { state, paperSlug, fileUrl } }` with `success` / `invalid` / `revoked` / `used` / `expired`. `fileUrl` is the raw `file_path` from the newest `document_versions` row. Marks the request `accessed` and writes an access log | `publicController.js:196-257`, `public.routes.js:15` |
| Paper normalization | Shared `normalizePaper()` maps `school_year` → `schoolYear`, `adviser_name` → `adviser`, splits comma/semicolon `authors` and `keywords`, and passes through `citation` | `publicController.js:14-28` |

---

## 1. Gallery list

### `GET /api/public/papers` — implemented

The frontend sends only supported params: `q`, `strand`, `section`, `year`, `limit`, `offset`. Strand/section/year are **single-select** in the UI; a selection replaces the previous one rather than adding to it. Featured papers are fetched separately with `featured=true&limit=3` and are shown only when no search or filter is active.

The frontend requests one extra row (`(page + 1) * 12 + 1`) to decide whether "Load more" should appear, because the endpoint returns no total count.

```json
{
  "data": [
    {
      "id": 12,
      "slug": "sample-paper",
      "title": "...",
      "authors": ["Juan Dela Cruz", "Ana Reyes"],
      "abstract": "...",
      "keywords": ["water", "quality"],
      "strand": "STEM",
      "section": "A",
      "schoolYear": "2025-2026",
      "adviser": "Adviser Name",
      "publishedAt": "2026-11-20T09:00:00Z",
      "featured": false,
      "citation": "Dela Cruz, J., & Reyes, A. (2026). ..."
    }
  ]
}
```

`client/src/services/galleryService.js:8-23` accepts both camelCase and snake_case variants, but the server already emits the camelCase shape above.

### Deviations and constraints

- **No total count.** "Showing N papers" reflects loaded rows, not a server total. Adding `total` would require a frontend change in Phase R; do not change the response shape silently.
- **No sort param.** Server ordering is fixed. Do not add `sort`; the sort UI was deliberately removed because it cannot be honored across pages.
- **No `kw` param.** Keyword links and popular searches use `q` (`client/src/pages/GalleryPaper.jsx:88`, `client/src/hooks/useResearchGallery.js`).
- **Filter options are catalog-derived.** The client fetches `limit=500` to build strand/section/year options and popular searches. Catalogs larger than 500 published papers will have incomplete facets. A dedicated facet endpoint is the clean fix; until then this is a known limitation, not a frontend bug.

---

## 2. Paper detail and citation

### `GET /api/public/papers/:slug` — implemented

Returns one normalized paper in `{ data }`. The detail page renders title, authors, abstract, keywords, strand/section/year, adviser and published date, then the citation card and **Request Full Paper**.

`GET /api/public/papers` is also fetched on this page to compute related papers by shared keywords, strand and school year (`client/src/services/galleryService.js:31-45`); this is client-side and needs no extra endpoint.

### Citation — implemented with client fallback

`client/src/components/public/CitationCard.jsx:7-8` uses stored `paper.citation` when it is a non-empty string and falls back to client APA formatting (`client/src/utils/citation.js`) otherwise. Both paths are valid. If the server starts producing a canonical stored citation, it will be preferred automatically with no frontend change.

**Backend requirement:** keep `citation` as a string or `null`. Do not return an object or an empty placeholder string that would suppress the fallback.

---

## 3. Access requests and status

### `POST /api/public/access-requests` — implemented

Request body from `client/src/services/accessRequestService.js:3-12`:

```json
{
  "paperSlug": "sample-paper",
  "name": "Juan Dela Cruz",
  "email": "juan@example.edu",
  "institution": "Sample University",
  "purpose": "Classroom reference"
}
```

Response: `{ "data": { "ref": "CV-A1B2C3", "requestId": 9 } }` with status 201. The frontend stores only `ref`; `requestId` is unused but harmless.

### Consent checkbox — gap

The handoff requires a consent checkbox on the request form (`docs/handoff.md:423`). The client currently sends no consent field and the server stores none. Persist a boolean (for example `consent_given`) with the request and validate it server-side; the frontend can then send it without changing the response shape.

### `GET /api/public/access/status/:ref` — implemented

The frontend consumes the shape in §0 and distinguishes three failure modes:

- **Unknown ref:** server returns 404 → "We couldn't find a request with that code."
- **Server/network failure:** any other error → "We couldn't check the status right now" with a **Try again** button.
- **Known ref, unrecognized status value:** generic fallback copy plus "Contact the office if you need help" — no blank panel.

Recognized `status` values in the client: `pending`, `approved`, `declined`, `accessed`, `verified`, `expired`, `revoked` (`client/src/pages/public/RequestStatus.jsx:10-18`). Recognized `linkStatus` values: `active`, `used`, `expired`, `revoked` (`:20-25`).

**Backend requirement:** keep returning 404 for unknown refs and JSON `{ message }` for real failures. The retry state depends on that distinction. Do not collapse both into a 200 with `data: null`.

### `emailSent` accuracy — gap

Do not report email delivery as successful unless the transport confirms it. When delivery fails, keep the link visible in the adviser inbox for manual copy (`docs/handoff.md:494`). The public status page should not claim a link was emailed when no email was sent.

---

## 4. Access links and file delivery

### Confirm then consume — implemented

`GET /public/access/:token` confirms state without consuming (`publicController.js:168-194`). The confirm page therefore survives refresh. `GET /public/access/:token/view` performs the single-use consume with an atomic guard (`:225-234`), logs the outcome, and updates the request to `accessed`.

The frontend relies on this split: `client/src/hooks/useAccessGate.js` treats `valid` as "show confirm", and every other state as blocked. Do not make the confirm endpoint consume the token.

### `fileUrl` — gap

`consumeLink` currently returns a raw storage path from `document_versions.file_path` (`publicController.js:236-242`). `getFileDownloadUrl()` passes absolute `http(s)` URLs through unchanged and otherwise prefixes the API host (`client/src/utils/helpers.js:19-24`), so a short-lived signed URL will work with no client change.

**Backend requirement:** return a **short-lived signed URL** in `fileUrl` (a value with an expiry, not a permanent path). Keep the field name. The raw path must not be exposed to anonymous callers.

### Link revocation on unpublish/archive — gap

Unpublishing or archiving a paper removes it from the gallery, but existing access links are not revoked (`docs/handoff.md:42`, `:496`). The confirm and consume handlers currently check only `revoked_at`, `used_at` and `expires_at` (`publicController.js:183-187`, `:212-223`) — not the paper's published state.

**Backend requirement:** revoke all active links for a submission when it is unpublished or archived, so confirm and consume return `revoked`. Add the paper's published/archived state to both checks as a defense in depth.

### Same-tab session grant — frontend behavior, not a security fix

`client/src/utils/accessGrant.js` stores a token-scoped `{ paperSlug, fileUrl }` grant in `sessionStorage` after a successful consume. `AccessView` and `AccessDownload` read router state first, then this grant, so refreshing the unlocked page in the **same tab** keeps working.

This is a convenience only:

- It does not extend the token's validity or re-consume the token.
- It does not work in a new tab or after the tab closes.
- It must not be treated as authorization. The signed URL's expiry is the real control.

### Copy handled by the frontend

`AccessView` shows the paper inline with a manual **Download PDF** link and an honest no-file message. `AccessDownload` says **Your paper is ready**, instructs the reader to use the **Download PDF** link, and shows a contact message when `fileUrl` is empty. No automatic download click is performed. These states require no backend work beyond a non-empty signed `fileUrl`.

---

## 5. Error contract

Controllers return JSON `{ "message": "..." }` on failures and `500` with `console.error` on unexpected errors (`publicController.js:52-55,71-74,115-118,162-165,190-193,253-256`). A 401 from any endpoint still triggers the client's existing session-expired handling (`client/src/services/api.js:17-27`), although public routes should never issue one.

Requirements:

- Keep `{ message }` JSON for all failures.
- Keep 404 for unknown refs, slugs and papers.
- Keep unknown-token confirmation as `200 { data: { state: 'invalid' } }`, not a thrown error, so the client can show the "link is not valid" panel.
- Do not return HTML error pages.

---

## 6. Capability flags — none

There are no Public Reader entries in `client/src/services/backendSupport.js`. Nothing is gated for this role, and Phase R has no Public Reader flag to flip. Backend changes in this document take effect directly on the live endpoints.

Verification in Phase R still applies: after each backend area lands, confirm the response shape with a real request before treating the behavior as supported.

---

## 7. Acceptance checklist — current status

| # | Check | Status |
|---:|---|---|
| 1 | Gallery filters and search work through `strand` / `section` / `year` / `q` | **Working** — §1; no `kw` or `sort` |
| 2 | Featured papers appear only when no filter is active | **Working** — separate `featured=true` fetch |
| 3 | Keyword links and popular searches use `q` | **Working** — §1 |
| 4 | Stored citation is preferred, client APA used as fallback | **Working** — §2 |
| 5 | Unknown request ref shows "not found"; server failure shows retry | **Working** — §3; depends on 404 vs other JSON error |
| 6 | Request status shows status and link status copy, including `accessed` | **Working** — §3 |
| 7 | Confirm page does not consume the token and survives refresh | **Working** — §4 |
| 8 | Consume is single-use and returns the paper | **Partial** — works, but `fileUrl` is a raw path (§4) |
| 9 | Signed URL expires and is not a permanent path | **Gap** — §4 |
| 10 | Unpublish/archive revokes existing links | **Gap** — §4 |
| 11 | Request consent checkbox is captured | **Gap** — §3 |
| 12 | Email delivery status is honest; failed sends are recoverable in adviser inbox | **Gap** — §3 |
| 13 | Gallery facets stay complete for large catalogs | **Gap** — 500-row catalog cap (§1) |

---

## 8. Frontend files that consume this contract

- `client/src/services/galleryService.js` — list/detail calls and normalization
- `client/src/services/accessRequestService.js` — submit and status lookup
- `client/src/services/accessLinkService.js` — confirm and consume calls
- `client/src/hooks/useResearchGallery.js` — server-driven filters, paging, search, facets
- `client/src/hooks/useAccessGate.js` — confirm/consume state machine
- `client/src/utils/accessGrant.js` — token-scoped same-tab grant
- `client/src/utils/helpers.js` — `getFileDownloadUrl()`
- `client/src/utils/citation.js` — APA fallback
- `client/src/pages/ResearchGallery.jsx`, `GalleryPaper.jsx`
- `client/src/pages/public/RequestStatus.jsx`, `AccessLink.jsx`, `AccessView.jsx`, `AccessDownload.jsx`
- `client/src/components/public/CitationCard.jsx`
- `client/src/components/gallery/FilterFields.jsx`, `FilterSheet.jsx`
- `client/src/services/api.js` — base URL and error handling

All Public Reader frontend work is in the client. No backend, database or `docs/handoff.md` files were modified as part of it.

---

## 9. Remaining backend work

Owner: backend developer. None of these require changes to `docs/handoff.md`.

### Hard-rule constraints

1. **Do not add admin publish or access-approval routes.** Those remain adviser actions (`docs/handoff.md:38-39`, `:459`).
2. **Keep `/api/public/*` anonymous.** Do not add auth middleware to the public router.
3. **Keep confirm non-consuming.** Only `/public/access/:token/view` may mark a link used.
4. **Never expose raw storage paths** in a public response.

### Functional gaps

5. **Short-lived signed URL.** Replace the raw `file_path` in `consumeLink` with a signed URL carrying a real expiry. Keep the `fileUrl` field name and the `{ data: { state, paperSlug, fileUrl } }` shape.
6. **Revoke links on unpublish/archive.** Set `revoked_at` on active links for a submission when it is unpublished or archived, and add published/archived state checks to `confirmLink` and `consumeLink`.
7. **Persist request consent.** Add a consent field to `paper_access_requests`, validate it on `POST /public/access-requests`, and expose it in the request detail used by the adviser inbox.
8. **Honest email status.** Do not set `emailSent` unless delivery succeeded; keep the adviser inbox link available for manual copy on failure.
9. **Facets for large catalogs.** Consider a dedicated endpoint returning available strand/section/year values and popular search terms, so the gallery no longer derives them from a 500-row catalog fetch. This needs a matching frontend change in Phase R.

### Contract and data-shape gaps

10. Keep `{ data: ... }` for all public reads/writes and JSON `{ message }` for failures.
11. Keep 404 for unknown refs and slugs; keep unknown-token confirmation as `state: 'invalid'` with 200.
12. Keep `citation` a string or `null` so the client fallback works.
13. Keep `status` and `linkStatus` values within the documented sets, or add matching copy to `RequestStatus.jsx` when a new value is introduced.

### Phase R note

After each backend area lands, verify it with a real request, then re-run targeted ESLint and `npm run build`. There are no Public Reader flags to flip, but the frontend should be rechecked if response shapes change (especially any change to the gallery response or `fileUrl`).
