-- Webster's 1828 Dictionary — Table Schema
-- Run this against your Neon Postgres database.

CREATE TABLE IF NOT EXISTS webster_1828 (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  content TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webster_1828_word ON webster_1828(word);
CREATE INDEX IF NOT EXISTS idx_webster_1828_word_upper ON webster_1828(UPPER(word));
CREATE INDEX IF NOT EXISTS idx_webster_1828_fulltext ON webster_1828 USING GIN(to_tsvector('english', content));
