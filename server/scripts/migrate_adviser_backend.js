const { query } = require('../config/db')

async function run() {
  await query(`ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reported_by INT REFERENCES users(user_id)`)
  await query(`ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS report_reason TEXT`)
  await query(`ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ`)

  // Access inbox: ensure decided_by / decision_note already exist (no-op if present)
  console.log('adviser backend migration applied')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})