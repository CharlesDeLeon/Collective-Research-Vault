-- ============================================================
-- Drop tables in reverse dependency order
-- ============================================================
DROP TABLE IF EXISTS audit_logs        CASCADE;
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS review_comments   CASCADE;
DROP TABLE IF EXISTS reviews           CASCADE;
DROP TABLE IF EXISTS panel_assignments CASCADE;
DROP TABLE IF EXISTS group_members     CASCADE;
DROP TABLE IF EXISTS research_groups   CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS submissions       CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ============================================================
-- ENUM types (PostgreSQL requires explicit types)
-- ============================================================
DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS submission_stage   CASCADE;
DROP TYPE IF EXISTS submission_status  CASCADE;
DROP TYPE IF EXISTS panel_role         CASCADE;
DROP TYPE IF EXISTS review_status      CASCADE;
DROP TYPE IF EXISTS notification_type  CASCADE;

CREATE TYPE user_role         AS ENUM ('student','adviser','external_panelist','sysadmin','faculty','coordinator');
CREATE TYPE submission_stage  AS ENUM ('proposal','defense','final_submission');
CREATE TYPE submission_status AS ENUM ('proposal','submitted','under_review','for_revision','needs_revision','approved','rejected','published');
CREATE TYPE consent_status AS ENUM ('pending','granted','declined');
CREATE TYPE panel_role        AS ENUM ('adviser','panelist');
CREATE TYPE review_status     AS ENUM ('approved','for_revision','rejected');
CREATE TYPE notification_type AS ENUM ('status_change','new_comment','assignment','system');

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  user_id     SERIAL PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        user_role     NOT NULL,
  program     VARCHAR(100)  DEFAULT NULL,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ  DEFAULT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- research_groups
-- ============================================================
CREATE TABLE research_groups (
  group_id    SERIAL PRIMARY KEY,
  group_name  VARCHAR(200)  NOT NULL,
  program     VARCHAR(100)  DEFAULT NULL,
  strand      VARCHAR(20)   DEFAULT NULL,
  section     VARCHAR(50)   DEFAULT NULL,
  year_level  SMALLINT      DEFAULT NULL,
  school_year VARCHAR(20)   DEFAULT NULL,
  created_by  INT           NOT NULL REFERENCES users(user_id),
  adviser_id  INT           REFERENCES users(user_id),
  archived    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- group_members
-- ============================================================
CREATE TABLE group_members (
  member_id   SERIAL PRIMARY KEY,
  group_id    INT         NOT NULL REFERENCES research_groups(group_id),
  user_id     INT         NOT NULL REFERENCES users(user_id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- ============================================================
-- submissions
-- ============================================================
CREATE TABLE submissions (
  submission_id     SERIAL PRIMARY KEY,
  group_id          INT                NOT NULL REFERENCES research_groups(group_id),
  title             VARCHAR(300)       NOT NULL,
  abstract          TEXT               DEFAULT NULL,
  keywords          VARCHAR(300)       DEFAULT NULL,
  authors           VARCHAR(300)       DEFAULT NULL,
  program           VARCHAR(100)       DEFAULT NULL,
  strand            VARCHAR(20)        DEFAULT NULL,
  section           VARCHAR(50)        DEFAULT NULL,
  year_level        SMALLINT           DEFAULT NULL,
  school_year       VARCHAR(20)        DEFAULT NULL,
  stage             submission_stage   NOT NULL DEFAULT 'proposal',
  status            submission_status  NOT NULL DEFAULT 'submitted',
  is_published      BOOLEAN            NOT NULL DEFAULT FALSE,
  public_visible    BOOLEAN            NOT NULL DEFAULT FALSE,
  featured          BOOLEAN            NOT NULL DEFAULT FALSE,
  slug              VARCHAR(200)       DEFAULT NULL,
  citation          TEXT               DEFAULT NULL,
  author_consent_at TIMESTAMPTZ        DEFAULT NULL,
  consent_status    consent_status     NOT NULL DEFAULT 'pending',
  consent_at        TIMESTAMPTZ        DEFAULT NULL,
  video_url         VARCHAR(2048)      DEFAULT NULL,
  file_path         VARCHAR(512)       DEFAULT NULL,
  file_name         VARCHAR(255)       DEFAULT NULL,
  adviser_name      VARCHAR(150)       DEFAULT NULL,
  published_at      TIMESTAMPTZ        DEFAULT NULL,
  submitted_by      INT                NOT NULL REFERENCES users(user_id),
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ============================================================
-- document_versions
-- ============================================================
CREATE TABLE document_versions (
  version_id      SERIAL PRIMARY KEY,
  submission_id   INT          NOT NULL REFERENCES submissions(submission_id),
  version_number  SMALLINT     NOT NULL DEFAULT 1,
  file_path       VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_size       INT          DEFAULT NULL,
  file_type       VARCHAR(50)  DEFAULT NULL,
  uploaded_by     INT          NOT NULL REFERENCES users(user_id),
  uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, version_number)
);

-- ============================================================
-- panel_assignments
-- ============================================================
CREATE TABLE panel_assignments (
  assignment_id   SERIAL PRIMARY KEY,
  group_id        INT        NOT NULL REFERENCES research_groups(group_id),
  faculty_id      INT        NOT NULL REFERENCES users(user_id),
  role_in_panel   panel_role NOT NULL,
  assigned_by     INT        NOT NULL REFERENCES users(user_id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, faculty_id, role_in_panel)
);

-- ============================================================
-- panelist_invitations
-- ============================================================
CREATE TABLE panelist_invitations (
  invitation_id   SERIAL PRIMARY KEY,
  email           VARCHAR(150)  NOT NULL,
  name            VARCHAR(150),
  user_id         INT           REFERENCES users(user_id),
  token_hash      VARCHAR(128)  NOT NULL UNIQUE,
  invited_by      INT           NOT NULL REFERENCES users(user_id),
  expires_at      TIMESTAMPTZ   NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_panelist_invitations_email ON panelist_invitations(email);
CREATE INDEX idx_panelist_invitations_expires ON panelist_invitations(expires_at);

ALTER TABLE panelist_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- reviews
-- ============================================================
-- ============================================================
-- submission_status_history
-- ============================================================
CREATE TABLE submission_status_history (
  id             SERIAL PRIMARY KEY,
  submission_id  INT         NOT NULL REFERENCES submissions(submission_id),
  status         VARCHAR(50) NOT NULL,
  note           TEXT        DEFAULT NULL,
  changed_by     INT         REFERENCES users(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_history_submission ON submission_status_history(submission_id);

ALTER TABLE submission_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  body           TEXT         NOT NULL,
  audience       VARCHAR(20)  NOT NULL DEFAULT 'all',
  role           VARCHAR(50)  DEFAULT NULL,
  group_id       INT          REFERENCES research_groups(group_id),
  created_by     INT          REFERENCES users(user_id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- app_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id          SERIAL PRIMARY KEY,
  settings    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  review_id       SERIAL PRIMARY KEY,
  submission_id   INT           NOT NULL REFERENCES submissions(submission_id),
  reviewer_id     INT           NOT NULL REFERENCES users(user_id),
  status_assigned review_status NOT NULL,
  reviewed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, reviewer_id)
);

-- ============================================================
-- review_comments
-- ============================================================
CREATE TABLE review_comments (
  comment_id    SERIAL PRIMARY KEY,
  submission_id INT         NOT NULL REFERENCES submissions(submission_id),
  author_id     INT         NOT NULL REFERENCES users(user_id),
  comment_text  TEXT        NOT NULL,
  resolved      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT               NOT NULL REFERENCES users(user_id),
  submission_id   INT               DEFAULT NULL REFERENCES submissions(submission_id),
  type            notification_type NOT NULL,
  message         VARCHAR(500)      NOT NULL,
  is_read         BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  log_id         SERIAL PRIMARY KEY,
  user_id        INT          DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  actor_name     VARCHAR(150) DEFAULT NULL,
  action         VARCHAR(100) NOT NULL,
  target_type    VARCHAR(50)  DEFAULT NULL,
  target_id      INT          DEFAULT NULL,
  changes        JSONB        DEFAULT NULL,
  details        TEXT         DEFAULT NULL,
  user_agent     VARCHAR(500) DEFAULT NULL,
  ip_address     VARCHAR(64)  DEFAULT NULL,
  correlation_id VARCHAR(100) DEFAULT NULL,
  request_id     VARCHAR(100) DEFAULT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- forum_posts
-- ============================================================
CREATE TABLE forum_posts (
  post_id     SERIAL PRIMARY KEY,
  author_id   INT          NOT NULL REFERENCES users(user_id),
  group_id    INT          REFERENCES research_groups(group_id) ON DELETE SET NULL,
  post_type   VARCHAR(20)  NOT NULL DEFAULT 'update',
  title       VARCHAR(300) DEFAULT NULL,
  body        TEXT         NOT NULL,
  media_url   VARCHAR(500) DEFAULT NULL,
  strand      VARCHAR(20)  DEFAULT NULL,
  section     VARCHAR(50)  DEFAULT NULL,
  year_level  SMALLINT     DEFAULT NULL,
  school_year VARCHAR(20)  DEFAULT NULL,
  submission_id INT        REFERENCES submissions(submission_id) ON DELETE SET NULL,
  paper_title VARCHAR(300) DEFAULT NULL,
  status      VARCHAR(30)  DEFAULT NULL,
  likes_count INT          NOT NULL DEFAULT 0,
  reported     BOOLEAN      NOT NULL DEFAULT FALSE,
  reported_by  INT          REFERENCES users(user_id),
  report_reason TEXT,
  reported_at  TIMESTAMPTZ,
  hidden       BOOLEAN      NOT NULL DEFAULT FALSE,
  removed      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- forum_post_likes
-- ============================================================
CREATE TABLE forum_post_likes (
  post_id    INT NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- forum_comments
-- ============================================================
CREATE TABLE forum_comments (
  comment_id SERIAL PRIMARY KEY,
  post_id    INT         NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  parent_id  INT         REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
  author_id  INT         NOT NULL REFERENCES users(user_id),
  body       TEXT        NOT NULL,
  edited     BOOLEAN     NOT NULL DEFAULT FALSE,
  reported   BOOLEAN     NOT NULL DEFAULT FALSE,
  hidden     BOOLEAN     NOT NULL DEFAULT FALSE,
  removed    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- paper_access_requests
-- ============================================================
CREATE TABLE paper_access_requests (
  request_id       SERIAL PRIMARY KEY,
  submission_id    INT          NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  institution      VARCHAR(200) DEFAULT NULL,
  purpose          TEXT         DEFAULT NULL,
  consent_given    BOOLEAN      NOT NULL DEFAULT FALSE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reference_code   VARCHAR(20)  NOT NULL UNIQUE,
  verify_token     VARCHAR(100) DEFAULT NULL,
  verify_expires_at TIMESTAMPTZ DEFAULT NULL,
  verified_at      TIMESTAMPTZ  DEFAULT NULL,
  decided_by       INT          REFERENCES users(user_id),
  decision_note    TEXT         DEFAULT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- paper_access_links
-- ============================================================
CREATE TABLE paper_access_links (
  link_id       SERIAL PRIMARY KEY,
  request_id    INT          NOT NULL REFERENCES paper_access_requests(request_id) ON DELETE CASCADE,
  submission_id INT          NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  token_hash    VARCHAR(128) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ  NOT NULL,
  used_at       TIMESTAMPTZ  DEFAULT NULL,
  revoked_at    TIMESTAMPTZ  DEFAULT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- paper_access_logs
-- ============================================================
CREATE TABLE paper_access_logs (
  log_id        SERIAL PRIMARY KEY,
  link_id       INT          REFERENCES paper_access_links(link_id) ON DELETE SET NULL,
  request_id    INT          REFERENCES paper_access_requests(request_id) ON DELETE SET NULL,
  submission_id INT          REFERENCES submissions(submission_id) ON DELETE SET NULL,
  action        VARCHAR(30)  NOT NULL,
  ip            VARCHAR(64)  DEFAULT NULL,
  user_agent    VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_submissions_status    ON submissions(status);
CREATE INDEX idx_submissions_stage     ON submissions(stage);
CREATE INDEX idx_submissions_group     ON submissions(group_id);
CREATE INDEX idx_submissions_published ON submissions(is_published);
CREATE INDEX idx_versions_submission   ON document_versions(submission_id);
CREATE INDEX idx_reviews_reviewer      ON reviews(reviewer_id);
CREATE INDEX idx_comments_submission   ON review_comments(submission_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user            ON audit_logs(user_id);
CREATE INDEX idx_audit_target          ON audit_logs(target_type, target_id);

-- Full-text search (PostgreSQL equivalent of MySQL FULLTEXT)
CREATE INDEX idx_submissions_fts ON submissions
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(keywords,'') || ' ' || COALESCE(authors,'')));

-- ============================================================
-- Auto-update updated_at columns (replaces MySQL ON UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
