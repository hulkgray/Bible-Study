-- Bible Study Tool — Database Schema
-- Run this against your Neon Postgres database to initialize all tables.

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- USERS
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
-- BIBLE TEXT
-- ============================================
CREATE TABLE IF NOT EXISTS bible_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book VARCHAR(20) NOT NULL,
  book_number SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NOT NULL,
  translation_code VARCHAR(10) NOT NULL,
  text TEXT NOT NULL,
  tagged_text TEXT,  -- Inline Strong's tags e.g. "In the beginning[H7225] God[H430]..."
  UNIQUE(book_number, chapter, verse, translation_code)
);

CREATE INDEX IF NOT EXISTS idx_verses_lookup ON bible_verses(book_number, chapter, translation_code);
CREATE INDEX IF NOT EXISTS idx_verses_fulltext ON bible_verses USING GIN(to_tsvector('english', text));

-- ============================================
-- BOOKMARKS
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL,
  book_number INT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  translation_code VARCHAR(10) NOT NULL DEFAULT 'kjv',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_number, chapter, verse, translation_code)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_lookup ON bookmarks(book_number, chapter);

-- ============================================
-- STRONG'S CONCORDANCES
-- ============================================
CREATE TABLE IF NOT EXISTS strongs_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strongs_number VARCHAR(10) NOT NULL UNIQUE,
  language VARCHAR(10) NOT NULL,
  original_word TEXT,
  transliteration TEXT,
  pronunciation TEXT,
  definition TEXT NOT NULL
);

-- ============================================
-- EASTON'S BIBLE DICTIONARY
-- ============================================
CREATE TABLE IF NOT EXISTS dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headword VARCHAR(200) NOT NULL,
  definition TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dict_headword ON dictionary_entries(headword);
CREATE INDEX IF NOT EXISTS idx_dict_fulltext ON dictionary_entries USING GIN(to_tsvector('english', definition));

-- ============================================
-- LIBRARY (Books, Devotionals, Catechism)
-- ============================================
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  author VARCHAR(200) NOT NULL,
  book_type VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS library_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id),
  chapter_number SMALLINT NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  UNIQUE(book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS devotional_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id),
  month SMALLINT NOT NULL,
  day SMALLINT NOT NULL,
  title VARCHAR(500),
  scripture_ref VARCHAR(200),
  content TEXT NOT NULL,
  UNIQUE(book_id, month, day)
);

CREATE TABLE IF NOT EXISTS catechism_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES library_books(id),
  question_number SMALLINT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  scripture_refs TEXT[],
  UNIQUE(book_id, question_number)
);

-- ============================================
-- CHAT HISTORY (AI Study conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL DEFAULT 'New Conversation',
  model_id VARCHAR(100) NOT NULL DEFAULT 'anthropic/claude-opus-4.6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

-- ============================================
-- NOTES & FOLDERS (Google Notes-style)
-- ============================================
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

-- ============================================
-- RAG EMBEDDINGS (pgvector)
-- ============================================
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(30) NOT NULL,
  source_ref VARCHAR(200),
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source ON content_embeddings(source_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON content_embeddings
  USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
