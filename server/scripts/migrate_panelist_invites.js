const { query } = require('../config/db')

async function main() {
  await query(`CREATE TABLE IF NOT EXISTS panelist_invitations (
    invitation_id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    name VARCHAR(150),
    user_id INT REFERENCES users(user_id),
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    invited_by INT NOT NULL REFERENCES users(user_id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await query('CREATE INDEX IF NOT EXISTS idx_panelist_invitations_email ON panelist_invitations(email)')
  await query('CREATE INDEX IF NOT EXISTS idx_panelist_invitations_expires ON panelist_invitations(expires_at)')
  console.log('panelist_invitations migration applied')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
