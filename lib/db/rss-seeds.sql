-- AMO V3 RSS Sources Seed Data

-- Clear existing sources
DELETE FROM rss_sources;

-- Aggregator Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('AI Feed', 'https://artificialintelligence-news.com/feed/', 'aggregator'),
('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'aggregator'),
('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'aggregator'),
('MIT Technology Review AI', 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', 'aggregator');

-- Primary Company Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('OpenAI Blog', 'https://openai.com/blog/rss.xml', 'primary'),
('Anthropic Blog', 'https://www.anthropic.com/news/rss', 'primary'),
('Microsoft AI', 'https://blogs.microsoft.com/ai/feed/', 'primary'),
('AWS AI Blog', 'https://aws.amazon.com/blogs/ai/feed/', 'primary'),
('NVIDIA Blog', 'https://blogs.nvidia.com/feed/', 'primary'),
('Google AI Blog', 'https://ai.googleblog.com/feeds/posts/default', 'primary'),
('Meta AI', 'https://ai.meta.com/blog/feed/', 'primary');

-- Governance & Policy Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('SEC AI News', 'https://www.sec.gov/news/pressreleases/rss.xml', 'governance'),
('NIST AI', 'https://www.nist.gov/news-events/news/rss.xml', 'governance'),
('EU AI Act Updates', 'https://ec.europa.eu/info/news/rss_en', 'governance'),
('White House AI', 'https://www.whitehouse.gov/feed/', 'governance');

-- Industry & Research Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('McKinsey AI', 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/rss', 'primary'),
('Deloitte AI', 'https://www2.deloitte.com/us/en/insights/industry/artificial-intelligence.html?icid=top_ai', 'primary'),
('PwC AI', 'https://www.pwc.com/gx/en/issues/data-and-analytics/publications/rss.html', 'primary'),
('Gartner AI', 'https://www.gartner.com/en/information-technology/insights/rss', 'primary'),
('Forrester AI', 'https://www.forrester.com/feed', 'primary');

-- Datacenter & Infrastructure Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('Datacenter Dynamics', 'https://www.datacenterdynamics.com/en/rss/', 'primary'),
('CloudZero', 'https://www.cloudzero.com/blog/rss.xml', 'primary'),
('Cloud Infrastructure Report', 'https://www.cloudinfrastructure.report/rss.xml', 'primary');

-- Enterprise & Business Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('Harvard Business Review AI', 'https://hbr.org/feed', 'primary'),
('Forbes AI', 'https://www.forbes.com/ai/feed/', 'primary'),
('WSJ AI', 'https://feeds.wsj.com/rss/wsj_markets', 'primary'),
('Financial Times AI', 'https://www.ft.com/companies/tech/rss', 'primary');

-- Research & Academic Sources
INSERT INTO rss_sources (name, feed_url, source_type) VALUES 
('arXiv AI', 'http://rss.arxiv.org/rss/cs.AI', 'primary'),
('AI Research Papers', 'https://arxiv.org/rss/cs.AI', 'primary'),
('Nature AI', 'https://www.nature.com/nature/articles?type=article&subject=computer-science&subject=artificial-intelligence', 'primary');

-- Total: 25 RSS sources covering:
- 4 Aggregators
- 8 Primary Company Sources  
- 4 Governance Sources
- 5 Industry Sources
- 4 Enterprise Sources
