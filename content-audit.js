// Content audit for RSS articles and candidates
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/content-audit') {
      try {
        // Step 1: Audit RSS articles raw_content
        const rssQuery = `
          SELECT 
            id,
            title,
            LENGTH(raw_content) as raw_content_length,
            LENGTH(summary) as summary_length,
            SUBSTR(raw_content, 1, 500) as raw_content_sample,
            SUBSTR(raw_content, -100, 100) as raw_content_end
          FROM rss_articles 
          WHERE raw_content IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 3
        `;
        
        const rssStmt = env.AMO_DB.prepare(rssQuery);
        const rssResult = await rssStmt.all();
        
        // Step 2: Check candidate content availability
        const candidateQuery = `
          SELECT 
            ca.id,
            ca.title,
            ra.raw_content,
            ra.summary as rss_summary,
            LENGTH(ra.raw_content) as rss_raw_content_length
          FROM candidate_articles ca
          LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
          ORDER BY ca.created_at DESC
          LIMIT 3
        `;
        
        const candidateStmt = env.AMO_DB.prepare(candidateQuery);
        const candidateResult = await candidateStmt.all();
        
        // Step 3: Content statistics
        const statsQuery = `
          SELECT 
            COUNT(*) as total_articles,
            COUNT(raw_content) as articles_with_content,
            AVG(LENGTH(raw_content)) as avg_content_length,
            MAX(LENGTH(raw_content)) as max_content_length,
            COUNT(CASE WHEN raw_content IS NULL THEN 1 END) as articles_without_content
          FROM rss_articles
        `;
        
        const statsStmt = env.AMO_DB.prepare(statsQuery);
        const statsResult = await statsStmt.first();
        
        return new Response(JSON.stringify({
          success: true,
          rss_articles_sample: rssResult.results,
          candidates_sample: candidateResult.results,
          content_statistics: statsResult,
          analysis: {
            raw_content_format: rssResult.results.length > 0 ? 'HTML content with CDATA' : 'No content',
            content_availability: candidateResult.results.map(c => ({
              candidate_id: c.id,
              has_raw_content: !!c.raw_content,
              raw_content_length: c.rss_raw_content_length,
              has_summary: !!c.rss_summary,
              summary_length: c.rss_summary ? c.rss_summary.length : 0
            })),
            pipeline_readiness: candidateResult.results.some(c => c.raw_content && c.raw_content.length > 1000)
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Content audit failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Content audit - use /content-audit');
  }
};
