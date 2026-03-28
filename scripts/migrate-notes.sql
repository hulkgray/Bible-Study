-- Notes & Folders migration
CREATE TABLE IF NOT EXISTS note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  parent_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL DEFAULT 'Untitled Note',
  content JSONB NOT NULL DEFAULT '{}',
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'default',
  pinned BOOLEAN NOT NULL DEFAULT false,
  links JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_folder ON study_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON study_notes(pinned, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_fulltext ON study_notes USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_folders_parent ON note_folders(parent_id);
