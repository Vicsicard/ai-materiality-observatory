-- AMO V3 Core 10 RSS Sources - Deactivate all others
-- Only keep the most essential feeds for initial validation

-- Deactivate all sources first
UPDATE rss_sources SET is_active = 0;

-- Activate only the AMO Core 10
UPDATE rss_sources SET is_active = 1 WHERE name IN (
    'AI Feed',
    'OpenAI Blog', 
    'Anthropic Blog',
    'Microsoft AI',
    'AWS AI Blog',
    'NVIDIA Blog',
    'SEC AI News',
    'NIST AI',
    'EU AI Act Updates',
    'MIT Technology Review AI'
);

-- Verify the active sources
SELECT id, name, feed_url, source_type, is_active 
FROM rss_sources 
WHERE is_active = 1 
ORDER BY source_type, name;
