const { query } = require('../config/db');
(async () => {
  // Add columns to submissions
  const cols = [
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS slug VARCHAR(200)",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS strand VARCHAR(20)",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS section VARCHAR(50)",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS year_level SMALLINT",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS citation TEXT",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS author_consent_at TIMESTAMPTZ",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS public_visible BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS adviser_name VARCHAR(150)",
  ];
  for (const sql of cols) { await query(sql); }
  console.log("submission columns added");

  // Backfill strand from program
  await query("UPDATE submissions SET strand = program WHERE strand IS NULL");
  // Backfill published_at from updated_at for published
  await query("UPDATE submissions SET published_at = updated_at WHERE is_published = TRUE AND published_at IS NULL");
  // Backfill slug from title (simple)
  await query("UPDATE submissions SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL");
  console.log("backfill done");

  // Access request tables
  await query(`CREATE TABLE IF NOT EXISTS paper_access_requests (
    request_id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    institution VARCHAR(200),
    purpose TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reference_code VARCHAR(20) NOT NULL UNIQUE,
    verify_token VARCHAR(100),
    verify_expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    decided_by INT REFERENCES users(user_id),
    decision_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log("paper_access_requests created");

  await query(`CREATE TABLE IF NOT EXISTS paper_access_links (
    link_id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES paper_access_requests(request_id) ON DELETE CASCADE,
    submission_id INT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log("paper_access_links created");

  await query(`CREATE TABLE IF NOT EXISTS paper_access_logs (
    log_id SERIAL PRIMARY KEY,
    link_id INT REFERENCES paper_access_links(link_id) ON DELETE SET NULL,
    request_id INT REFERENCES paper_access_requests(request_id) ON DELETE SET NULL,
    submission_id INT REFERENCES submissions(submission_id) ON DELETE SET NULL,
    action VARCHAR(30) NOT NULL,
    ip VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log("paper_access_logs created");

  // Indexes
  await query("CREATE INDEX IF NOT EXISTS idx_access_requests_submission ON paper_access_requests(submission_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_access_requests_status ON paper_access_requests(status)");
  await query("CREATE INDEX IF NOT EXISTS idx_access_links_token ON paper_access_links(token_hash)");
  await query("CREATE INDEX IF NOT EXISTS idx_submissions_slug ON submissions(slug)");
  await query("CREATE INDEX IF NOT EXISTS idx_submissions_published ON submissions(is_published)");
  console.log("indexes created");

  const [subCols] = await query("SELECT column_name FROM information_schema.columns WHERE table_name='submissions' ORDER BY ordinal_position");
  console.log("submissions columns:", subCols.map(c => c.column_name).join(", "));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
