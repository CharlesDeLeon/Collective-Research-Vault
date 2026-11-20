const { query } = require('../config/db');
(async () => {
  // Add columns to research_groups
  await query("ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS strand VARCHAR(20)");
  await query("ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS section VARCHAR(50)");
  await query("ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS year_level SMALLINT");
  await query("ALTER TABLE research_groups ADD COLUMN IF NOT EXISTS adviser_id INT REFERENCES users(user_id)");
  console.log("research_groups columns added");

  // Backfill strand from program, adviser_id from created_by
  await query("UPDATE research_groups SET strand = program WHERE strand IS NULL");
  await query("UPDATE research_groups SET adviser_id = created_by WHERE adviser_id IS NULL");
  console.log("backfill done");

  // forum_posts table
  await query(`CREATE TABLE IF NOT EXISTS forum_posts (
    post_id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES users(user_id),
    group_id INT REFERENCES research_groups(group_id) ON DELETE SET NULL,
    post_type VARCHAR(20) NOT NULL DEFAULT 'update',
    title VARCHAR(300),
    body TEXT NOT NULL,
    media_url VARCHAR(500),
    strand VARCHAR(20),
    section VARCHAR(50),
    year_level SMALLINT,
    school_year VARCHAR(20),
    submission_id INT REFERENCES submissions(submission_id) ON DELETE SET NULL,
    paper_title VARCHAR(300),
    status VARCHAR(30),
    likes_count INT NOT NULL DEFAULT 0,
    reported BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log("forum_posts created");

  // forum_post_likes
  await query(`CREATE TABLE IF NOT EXISTS forum_post_likes (
    post_id INT NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
  )`);
  console.log("forum_post_likes created");

  // forum_comments
  await query(`CREATE TABLE IF NOT EXISTS forum_comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
    parent_id INT REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES users(user_id),
    body TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    reported BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log("forum_comments created");

  // Indexes
  await query("CREATE INDEX IF NOT EXISTS idx_forum_posts_group ON forum_posts(group_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC)");
  await query("CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id)");
  console.log("indexes created");

  // Verify
  const [tables] = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'forum%' ORDER BY table_name");
  console.log("forum tables:", tables.map(t => t.table_name).join(", "));
  const [cols] = await query("SELECT column_name FROM information_schema.columns WHERE table_name='research_groups' ORDER BY ordinal_position");
  console.log("research_groups columns:", cols.map(c => c.column_name).join(", "));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
