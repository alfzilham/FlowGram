-- Migration 005: Add soft delete columns
-- Idempotent: uses IF NOT EXISTS via DO block

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'deleted_at') THEN
        ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
        CREATE INDEX idx_projects_deleted ON projects(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'deleted_at') THEN
        ALTER TABLE folders ADD COLUMN deleted_at TIMESTAMPTZ;
        CREATE INDEX idx_folders_deleted ON folders(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;
END $$;
