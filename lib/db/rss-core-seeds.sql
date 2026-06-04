-- AMO V3 Core 10 RSS Sources Seed Data

-- Clear existing sources
DELETE FROM rss_sources;

-- AMO Core 10 Sources
INSERT INTO rss_sources (name, feed_url, source_type, is_active) VALUES 
('AI Feed', 'https://artificialintelligence-news.com/feed/', 'aggregator', 1),
('OpenAI Blog', 'https://openai.com/blog/rss.xml', 'primary', 1),
('Anthropic Blog', 'https://www.anthropic.com/news/rss', 'primary', 1),
('Microsoft AI', 'https://blogs.microsoft.com/ai/feed/', 'primary', 1),
('AWS AI Blog', 'https://aws.amazon.com/blogs/ai/feed/', 'primary', 1),
('NVIDIA Blog', 'https://blogs.nvidia.com/feed/', 'primary', 1),
('SEC AI News', 'https://www.sec.gov/news/pressreleases/rss.xml', 'governance', 1),
('NIST AI', 'https://www.nist.gov/news-events/news/rss.xml', 'governance', 1),
('EU AI Act Updates', 'https://ec.europa.eu/info/news/rss_en', 'governance', 1),
('MIT Technology Review AI', 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', 'analysis', 1);
