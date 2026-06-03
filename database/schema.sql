-- Table: events
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  headline TEXT NOT NULL,
  published_date TEXT,
  article_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: signals
CREATE TABLE signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  signal_type TEXT NOT NULL,
  signal_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: articles
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
