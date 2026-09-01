-- Migration 002: Add workflow version history
-- Idempotent: uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS workflow_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    node_count INTEGER NOT NULL DEFAULT 0,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_project ON workflow_versions(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_user ON workflow_versions(user_id);
