const { query } = require('../config/db')

async function run() {
  await query(`CREATE TABLE IF NOT EXISTS announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    audience VARCHAR(20) NOT NULL DEFAULT 'all',
    role VARCHAR(50) DEFAULT NULL,
    group_id INT REFERENCES research_groups(group_id),
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query(`CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query(`ALTER TABLE announcements ENABLE ROW LEVEL SECURITY`)
  await query(`ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY`)
  console.log('admin backend migration applied')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})