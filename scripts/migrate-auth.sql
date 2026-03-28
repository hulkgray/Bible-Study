-- Phase 3A: User Authentication Schema Migration
-- Run this against your Neon Postgres database.

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  password_hash TEXT NOT NULL,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- ADD user_id TO USER-OWNED TABLES
-- ============================================

-- Bookmarks: add user_id (nullable initially for existing rows)
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- Drop and re-create unique constraint to include user_id
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_book_number_chapter_verse_translation_code_key;
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_verse_unique 
  UNIQUE(user_id, book_number, chapter, verse, translation_code);

-- Study notes: add user_id
ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON study_notes(user_id);

-- Note folders: add user_id
ALTER TABLE note_folders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON note_folders(user_id);

-- Chat sessions: add user_id
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
