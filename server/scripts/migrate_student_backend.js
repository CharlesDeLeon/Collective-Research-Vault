const { query } = require('../config/db')

async function run() {
  // Enum values
  await query(`ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'proposal'`)
  await query(`ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'for_revision'`)

  // consent_status type
  await query(`DO $$ BEGIN
    CREATE TYPE consent_status AS ENUM ('pending','granted','declined');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`)

  // submissions columns
  await query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consent_status consent_status NOT NULL DEFAULT 'pending'`)
  await query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ DEFAULT NULL`)
  await query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS video_url VARCHAR(2048) DEFAULT NULL`)
  await query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_path VARCHAR(512) DEFAULT NULL`)
  await query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL`)

  // review_comments.resolved
  await query(`ALTER TABLE review_comments ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE`)

  // status history table
  await query(`CREATE TABLE IF NOT EXISTS submission_status_history (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(submission_id),
    status VARCHAR(50) NOT NULL,
    note TEXT DEFAULT NULL,
    changed_by INT REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query(`CREATE INDEX IF NOT EXISTS idx_status_history_submission ON submission_status_history(submission_id)`)
  await query(`ALTER TABLE submission_status_history ENABLE ROW LEVEL SECURITY`)

  // Backfill consent
  await query(`UPDATE submissions
     SET consent_status = 'granted',
         consent_at = COALESCE(consent_at, author_consent_at)
     WHERE author_consent_at IS NOT NULL
       AND consent_status = 'pending'`)

  // Backfill current file from latest document_versions
  await query(`UPDATE submissions s
     SET file_path = dv.file_path,
         file_name = dv.file_name
     FROM document_versions dv
     WHERE dv.submission_id = s.submission_id
       AND dv.version_number = (SELECT MAX(version_number) FROM document_versions WHERE submission_id = s.submission_id)
       AND s.file_path IS NULL`)

  // Backfill status history (one row per submission if none exists)
  await query(`INSERT INTO submission_status_history (submission_id, status, note, changed_by, created_at)
     SELECT s.submission_id, s.status, 'Backfilled', s.submitted_by, s.created_at
     FROM submissions s
     WHERE NOT EXISTS (SELECT 1 FROM submission_status_history h WHERE h.submission_id = s.submission_id)`)

  console.log('student backend migration applied')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
