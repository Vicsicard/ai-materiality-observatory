// Simple content audit for RSS articles
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/simple-content-audit') {
      try {
        // Get content statistics
        const statsQuery = `
          SELECT 
            COUNT(*) as total_articles,
            COUNT(raw_content) as articles_with_content,
            AVG(LENGTH(raw_content)) as avg_content_length,
            MAX(LENGTH(raw_content)) as max_content_length,
            MIN(LENGTH(raw_content)) as min_content_length
          FROM rss_articles
        `;
        
        const statsStmt = env.AMO_DB.prepare(statsQuery);
        const statsResult = await statsStmt.first();
        
        // Get sample articles with content
        const sampleQuery = `
          SELECT 
            id,
            title,
            LENGTH(raw_content) as content_length,
            SUBSTR(raw_content, 1, 200) as content_sample
          FROM rss_articles 
          WHERE raw_content IS NOT NULL
          ORDER BY LENGTH(raw_content) DESC
          LIMIT 3
        `;
        
        const sampleStmt = env.AMO_DB.prepare(sampleQuery);
        const sampleResult = await sampleStmt.all();
        
        // Check candidate content access
        const candidateQuery = `
          SELECT 
            ca.id as candidate_id,
            ca.title as candidate_title,
            ra.raw_content,
            LENGTH(ra.raw_content) as content_length
          FROM candidate_articles ca
          LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
          WHERE ra.raw_content IS NOT NULL
          LIMIT 3
        `;
        
        const candidateStmt = env.AMO_DB.prepare(candidateQuery);
        const candidateResult = await candidateStmt.all();
        
        return new Response(JSON.stringify({
          success: true,
          content_statistics: statsResult,
          sample_articles: sampleResult.results,
          candidate_content_access: candidateResult.results,
          pipeline_readiness: {
            has_content: statsResult.articles_with_content > 0,
            avg_content_length: Math.round(statsResult.avg_content_length || 0),
            sufficient_for_pipeline: statsResult.avg_content_length > 1000,
            candidates_have_content: candidateResult.results.length > 0
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
    
    return new Response('Simple content audit - use /simple-content-audit');
  }
};
