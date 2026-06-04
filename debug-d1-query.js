// Test D1 query behavior for non-existent URLs
const testUrl = 'https://example.com/non-existent-article-url';

// This simulates what the worker does:
// const stmt = this.env.AMO_DB.prepare('SELECT id FROM rss_articles WHERE url = ? LIMIT 1');
// const result = await stmt.bind(testUrl).first();

console.log('Testing D1 query behavior...');
console.log('URL:', testUrl);
console.log('Expected: result should be null/undefined for non-existent URL');
console.log('Problem: If D1 returns {}, then Boolean({}) === true, causing false duplicates');
