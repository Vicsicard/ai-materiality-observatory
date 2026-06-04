-- AMO V3 RSS Intake System Schema

-- RSS Sources Configuration
CREATE TABLE IF NOT EXISTS rss_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  source_type TEXT NOT NULL, -- aggregator, primary, governance
  is_active INTEGER DEFAULT 1,
  last_polled_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- RSS Articles (Raw Ingestion)
CREATE TABLE IF NOT EXISTS rss_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  title TEXT,
  url TEXT UNIQUE,
  summary TEXT,
  published_at TEXT,
  raw_content TEXT,
  author TEXT,
  categories TEXT, -- JSON array
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id)
);

-- Candidate Articles (Screening Queue)
CREATE TABLE IF NOT EXISTS candidate_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rss_article_id INTEGER,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_name TEXT,
  status TEXT DEFAULT 'new', -- new, screened, approved, rejected, processed
  
  -- Screening Results
  relevance_score INTEGER DEFAULT 0,
  screener_reason TEXT,
  recommended_dimensions TEXT, -- JSON array
  evidence TEXT, -- JSON array
  
  -- Approval Tracking
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  
  -- Processing Tracking
  processed_at TEXT,
  observation_id TEXT, -- Links to final observation
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rss_article_id) REFERENCES rss_articles(id)
);

-- RSS Ingestion Logs
CREATE TABLE IF NOT EXISTS rss_ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  articles_found INTEGER DEFAULT 0,
  articles_inserted INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id)
);

-- Candidate Screening Logs
CREATE TABLE IF NOT EXISTS screening_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER,
  relevance_score INTEGER,
  decision TEXT, -- approve, reject
  primary_reason TEXT,
  recommended_dimensions TEXT, -- JSON array
  evidence_count INTEGER,
  processing_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidate_articles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rss_articles_url ON rss_articles(url);
CREATE INDEX IF NOT EXISTS idx_rss_articles_published_at ON rss_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_candidate_articles_status ON candidate_articles(status);
CREATE INDEX IF NOT EXISTS idx_candidate_articles_relevance_score ON candidate_articles(relevance_score);
CREATE INDEX IF NOT EXISTS idx_candidate_articles_created_at ON candidate_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_rss_ingestion_logs_source_id ON rss_ingestion_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_screening_logs_candidate_id ON screening_logs(candidate_id);
