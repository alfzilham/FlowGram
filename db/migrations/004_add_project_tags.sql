-- Migration 004: Add project tags
-- Idempotent: uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS project_tags (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (project_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_project_tags_user ON project_tags(user_id, tag);
