-- Draft2Post Enhancement Migration
-- Adds Phase 2 fields to support enhanced observation processing

-- Add new fields to articles table
ALTER TABLE articles ADD COLUMN source_title TEXT;
ALTER TABLE articles ADD COLUMN source_publication TEXT;
ALTER TABLE articles ADD COLUMN source_summary TEXT;
ALTER TABLE articles ADD COLUMN source_keywords TEXT;
ALTER TABLE articles ADD COLUMN signal_category TEXT;
ALTER TABLE articles ADD COLUMN classification_reason TEXT;
ALTER TABLE articles ADD COLUMN classification_confidence INTEGER;
ALTER TABLE articles ADD COLUMN observatory_title TEXT;
ALTER TABLE articles ADD COLUMN observatory_slug TEXT;
ALTER TABLE articles ADD COLUMN meta_title TEXT;
ALTER TABLE articles ADD COLUMN meta_description TEXT;
ALTER TABLE articles ADD COLUMN what_this_may_indicate TEXT;
ALTER TABLE articles ADD COLUMN potential_organizational_relevance TEXT;
ALTER TABLE articles ADD COLUMN related_assessment_areas TEXT;
ALTER TABLE articles ADD COLUMN editorial_status TEXT;
ALTER TABLE articles ADD COLUMN editorial_notes TEXT;
ALTER TABLE articles ADD COLUMN published_at TEXT;

-- Update status constraint to include new statuses
-- Note: SQLite doesn't support ALTER CONSTRAINT, so we'll handle this in application logic

-- Create index for faster queries
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_signal_category ON articles(signal_category);
