const { query } = require('../config/db')

async function run() {
  await query(`ALTER TABLE paper_access_requests ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE`)
  console.log('public backend migration applied')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})