# Performance & Data Flow: A Practical Guide for CORE-V

This document explains why the site felt slow, how to tell hosting slowness from code slowness,
and the concrete improvements applied in commit `83acbc1` (plus the hosting fixes you still
need to flip in dashboards). It is written as a learning reference for backend performance work.

---

## 1. The two kinds of "slow"

Almost every "the website is slow" report is one of these:

| Symptom | Likely cause | How to confirm |
|---|---|---|
| First click after lunch takes 30–60s, then fine | Hosting cold start (Render free tier sleeps) | `curl` the API twice with a 20-min gap; compare TTFB |
| Every click takes 0.5–2s even when warm | Network round trips / code / DB | `curl` warm endpoint; check DB query time; count requests per page |
| One specific page is slow, others fine | N+1 queries or heavy query on that route | `EXPLAIN ANALYZE` that route's SQL; check browser Network tab request count |
| File download is slow | Large bytes through DB or sync disk I/O | Measure `/file` endpoint with `curl -w` |

**Rule of thumb:** measure before changing anything. Guessing wastes time and often makes
things worse (e.g. adding caches that hide stale data).

---

## 2. What I measured on CORE-V

```
# Warm (service already up)
run1: connect=0.06s  ttfb=1.56s  total=1.56s   # first after a short idle
run2: connect=0.04s  ttfb=0.54s  total=0.54s
run3: connect=0.10s  ttfb=0.62s  total=0.62s

# Database query itself (Supabase, from the developer machine)
SELECT s.*  (3 rows, but includes bytea column): ~80-150ms
explicit columns:                                 ~85-90ms
```

Breakdown of a warm 0.54s request:

- TLS + TCP connect: ~0.04s
- Render routing + region hop: ~0.35s
- Database query: ~0.09s
- JSON serialize + response: ~0.06s

So **~65% of warm latency is network/geography**, not code. That tells us: fix hosting
region first, then code.

---

## 3. Hosting layer (biggest lever, config only)

### 3.1 Render free tier sleeps
Free web services spin down after ~15 minutes of inactivity. The next request boots the
container (Node start + DB pool warm + module load) = **30–60s**. This is the #1 cause of
"the site is sometimes very slow".

Options:
- **Upgrade to Starter** (~$7/mo) → always on. Simplest real fix.
- **Free workaround:** point UptimeRobot or cron-job.org at `https://collective-research-vault.onrender.com/api/health`
  every 10 minutes. Keeps the container warm. (Free tiers sometimes restrict this; check Render's
  current policy.)
- **Alternative:** move the API to a provider with a generous always-on free tier (Fly.io, Railway).

### 3.2 Region mismatch (free, high impact)
- Supabase DB: `ap-northeast-2` (Seoul).
- Render service: likely default US West (Oregon).

Every DB query crosses the Pacific (~150-200ms RTT) × number of queries per request.
**Fix:** in the Render dashboard → service → Settings → Region, pick **Singapore** (closest
available to Seoul among Render regions). Re-deploy. No code change.

### 3.3 Supabase connection pooling
We use the session pooler (`aws-...pooler.supabase.com:5432`) with `max: 10` connections.
That is fine for this scale. Notes:
- Do not raise `max` on the free tier; Supabase caps connections and you will get
  `too many clients`.
- `connectionTimeoutMillis: 10000` is reasonable for a cold pool.
- If you later add a serverless/edge runtime, switch to the **transaction pooler** (port 6543)
  and disable prepared statements.

### 3.4 Vercel is not the bottleneck
The frontend is static assets on a global CDN. TTFB for the HTML/JS is ~50-100ms worldwide.
Do not spend time "optimizing Vercel" — spend it on the API.

---

## 4. Code improvement #1 — Never `SELECT *` on wide tables

### The problem
We added a `file_data BYTEA` column to `submissions` and `document_versions` so uploaded
bytes survive Render's ephemeral disk. Then `listPapers` and `getPaper` did:

```sql
SELECT s.*, u.name AS adviser_name FROM submissions s ...
```

`normalizePaper()` only reads ~15 fields, but `s.*` pulls **the entire PDF blob** for every
row, over the network from Supabase to Render, on every gallery load. With a 400KB file × 50
rows = 20MB per request. Even when `file_data` is NULL, the column is still in the row
descriptor and adds overhead; once populated it is catastrophic.

### The fix
Explicit column list in both queries (see `publicController.js` `listPapers`/`getPaper`),
excluding `file_data` and other unused columns. The list now transfers only the fields the
frontend actually renders.

### Lesson
- `SELECT *` is convenient and dangerous. On tables that gain columns later (especially
  `BYTEA`/`JSONB`/large text), it silently makes every query heavier.
- Whenever you add a column, audit every `SELECT *` that touches that table.
- Keep a "column allow-list" in code review: a query should name what it needs.

---

## 5. Code improvement #2 — Client-side caching (SWR-style)

### The problem
Every route mount re-fetched the same data:
- `Landing.jsx` → `fetchGalleryPapers({ featured: 'true' })`
- `GalleryPaper.jsx` → `fetchGalleryPapers()` (to compute related papers)
- `AccessView`/`AccessDownload` → `getGalleryPaper(slug)`

Navigating Home → Gallery → a paper → back re-hit the (slow) backend 3+ times for data
that changes rarely.

### The fix
`galleryService.js` now keeps an in-memory `Map` cache with a 30s TTL:

```js
const CACHE_TTL_MS = 30_000
const cache = new Map()

function getCached(key) { /* returns data if fresh, else undefined */ }
function setCached(key, data) { /* stores with expiry */ }
```

`fetchGalleryPapers` and `getGalleryPaper` check the cache first and only hit the network
on a miss or after TTL expiry. `invalidateGalleryCache()` is exported for the rare case
where a mutation (publish/unpublish) should force a refresh.

### Why in-memory and not sessionStorage?
- In-memory resets on full page reload, which is fine — it prevents stale data across
  deploys and avoids serializing large blobs.
- sessionStorage would persist across reloads but adds (de)serialization cost and stale-data
  risk. For read-heavy public data, in-memory TTL is the sweet spot.

### Lesson
- The fastest request is the one you never make. A 30s cache turns 3 round trips into 0
  for typical navigation.
- Always pair a cache with an invalidation story, even a manual one.

---

## 6. Code improvement #3 — Collapsing round trips (access flow)

### Before
```
AccessLink page load:
  1. GET /api/public/access/:token            (confirmLink)   → paperSlug
  2. GET /api/public/papers/:slug            (getGalleryPaper) → title
  user clicks "Open":
  3. GET /api/public/access/:token/view       (consumeLink)    → fileUrl
  AccessView mount:
  4. GET /api/public/papers/:slug            (getGalleryPaper) → title  (again!)
```
4 round trips, 2 of them redundant title fetches.

### After
The backend now returns `paperTitle` alongside `paperSlug` in `confirmLink` and `consumeLink`
(by adding `s.title AS paper_title` to the join). The frontend stores `paperTitle` in the
access grant and threads it through `useAccessGate`. `AccessView`/`AccessDownload` no longer
call `getGalleryPaper` at all — they render `grant.paperTitle`.

```
AccessLink page load:
  1. GET /api/public/access/:token            → paperSlug + paperTitle
  user clicks "Open":
  2. GET /api/public/access/:token/view       → fileUrl (+ paperTitle)
  AccessView mount:
  (no extra request — title comes from the grant)
```
2 round trips, zero redundant fetches. And both remaining requests are now cached-friendly
single calls.

### Lesson
- Count the network requests per user action in the browser Network tab. Each is a
  round trip to a possibly-sleeping server.
- Push derived data into the response that already travels (the link lookup already joins
  `submissions`), instead of making the client fetch it again.
- "One endpoint, one round trip" beats "many small endpoints" on high-latency links.

---

## 7. Data flow: before vs after (request counts)

| Page / action | Before (requests) | After (requests) |
|---|---|---|
| Landing | 1 | 1 (cached on repeat) |
| Gallery → open a paper | 2 (list + detail) | 2 (detail cached on repeat) |
| Open access link (confirm) | 2 (confirm + paper) | 1 (confirm, includes title) |
| View/download granted paper | 2 (consume + paper) | 1 (consume) |
| Status page | 2 (status + paper) | 2 (status now also serves file directly) |

---

## 8. Database-level optimizations (when you outgrow this)

### 8.1 Indexes
Check `EXPLAIN ANALYZE` for the gallery query:

```sql
EXPLAIN ANALYZE
SELECT ... FROM submissions s LEFT JOIN users u ON u.user_id = s.submitted_by
WHERE (s.is_published = TRUE OR s.status = 'published')
ORDER BY s.published_at DESC NULLS LAST, s.updated_at DESC
LIMIT 50;
```

If you see a Seq Scan on `submissions`, add:

```sql
CREATE INDEX IF NOT EXISTS idx_submissions_published_at
  ON submissions (published_at DESC NULLS LAST)
  WHERE is_published = TRUE OR status = 'published';
```

Partial indexes are ideal here because the gallery only ever queries published rows.

### 8.2 Avoid `SELECT *` in joins
Same lesson as §4, applied to `JOIN`s. `LEFT JOIN users u` is fine because we only read
`u.name`, but `SELECT s.*, u.*` would pull every user column too.

### 8.3 N+1 audit
Search the client for `.map(async` and sequential `await` inside loops. In this codebase
the main offenders were fixed (access flow). Remaining candidates:
- `AdviserGroups.openEdit` fetches the full group on modal open (acceptable — single,
  user-initiated).
- Admin pages fetch stats + lists separately; could be combined into one endpoint later.

### 8.4 Connection reuse
The `pg` Pool is shared (`server/config/db.js`). Never create a `new Pool()` per request.
We already do this correctly.

---

## 9. Caching tiers (mental model)

| Tier | Where | TTL | Use for |
|---|---|---|---|
| Browser HTTP cache | `Cache-Control` headers | minutes–hours | Static assets, immutable files |
| In-memory (SPA) | JS `Map` | seconds–minutes | Route data, gallery lists (what we added) |
| sessionStorage | Browser storage | session | Access grants (already used) |
| Server in-memory | Node process | seconds | Hot config, permission matrices |
| External cache | Redis | minutes–hours | Sessions, rate limits, heavy aggregates |
| CDN edge | Vercel/Cloudflare | minutes | Public API responses (optional) |

CORE-V currently uses tiers 2 and 3. Adding Redis (tier 5) is not worth it at this scale.

---

## 10. File serving: BYTEA vs object storage

We store bytes in Postgres (`file_data BYTEA`) so they survive Render's ephemeral disk.
Trade-offs:

| Approach | Pros | Cons |
|---|---|---|
| BYTEA in Postgres (current) | Simple, transactional, survives redeploy, no extra service | DB bloat, slower for large files, pooler overhead, backups grow |
| Supabase Storage + signed URLs | Offloads bytes, fast CDN, scalable, cheap | Extra service, signed-URL expiry logic, migration work |
| Render disk (ephemeral) | Fast local reads | Lost on every redeploy (we hit this bug) |

**Recommendation:** keep BYTEA while files are small (<~5MB) and traffic is low. Migrate to
Supabase Storage + short-lived signed URLs when (a) files exceed a few MB, (b) traffic grows,
or (c) DB backups become painful. This is already in the deferred backlog.

---

## 11. Observability: how to keep improving

1. **Browser Network tab** — count requests per page load; look for waterfalls (requests
   that start only after a previous one finishes).
2. **`curl -w`** — cheap TTFB measurement from any machine:
   ```bash
   curl -s -o /dev/null -w "ttfb=%{time_starttransfer}s total=%{time_total}s\n" URL
   ```
3. **Render logs** — watch for slow queries, pool exhaustion, cold starts.
4. **Supabase dashboard** — Database → Query Performance; shows slow queries and index usage.
5. **`EXPLAIN ANALYZE`** — run on any query you suspect; look for Seq Scan on large tables.
6. **Lighthouse** — frontend bundle size and first-paint; our bundle is 758KB (gzip 194KB),
   which is acceptable but could be split with `React.lazy` for admin pages.

---

## 12. Action checklist (you, in dashboards)

- [ ] Render → service → Region → set to Singapore (or nearest to Seoul)
- [ ] Render → service → Environment → set SMTP vars (see handoff) so emails actually send
- [ ] Set up UptimeRobot/cron-job.org ping to `/api/health` every 10 min (free cold-start workaround)
- [ ] (Optional) Run the index SQL in §8.1 on Supabase
- [ ] (Optional) Upgrade Render to Starter for always-on
- [ ] Sync Vercel to `developCharles/main` so frontend picks up all fixes

## 13. Code-side backlog (future)

- `React.lazy` + `Suspense` for admin/adviser pages to shrink initial bundle
- Combine admin stats + list endpoints where pages fetch both
- Migrate file bytes to Supabase Storage + signed URLs (§10)
- Add `Cache-Control` headers on `/api/public/papers` for CDN caching
- Audit remaining `SELECT *` in auth/invite/admin controllers

---

## Summary

- **Hosting (region + cold start)** accounts for most of the perceived slowness. Fix those
  first — they are config changes, not code.
- **Code wins that are already applied:** no more `SELECT *` on the gallery (prevents the
  BYTEA blob regression), 30s in-memory cache for public gallery data, and the access flow
  collapsed from 4 round trips to 2 by threading `paperTitle` through the link endpoints.
- **Measure, don't guess.** `curl -w` + `EXPLAIN ANALYZE` + the browser Network tab tell
  you where the time actually goes.
