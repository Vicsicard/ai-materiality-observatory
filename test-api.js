// Simple test script to verify the candidate API works
// This will be deployed to test the database integration

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test-candidates') {
      try {
        // Test the exact SQL query from the API
        const query = `
          SELECT 
            ca.id,
            ca.title,
            ca.url,
            ca.source_name,
            ca.status,
            ca.relevance_score,
            ca.screener_reason,
            ca.recommended_dimensions,
            ca.approved_at,
            ca.rejected_at,
            ca.created_at,
            ra.summary,
            ra.published_at,
            rs.name as rss_source_name
          FROM candidate_articles ca
          LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
          LEFT JOIN rss_sources rs ON ra.source_id = rs.id
          ORDER BY ca.created_at DESC
          LIMIT 5 OFFSET 0
        `;
        
        const stmt = env.AMO_DB.prepare(query);
        const result = await stmt.all();
        
        // Get status counts
        const statusQuery = `
          SELECT status, COUNT(*) as count 
          FROM candidate_articles 
          GROUP BY status
        `;
        
        const statusStmt = env.AMO_DB.prepare(statusQuery);
        const statusResult = await statusStmt.all();
        
        const statusCounts = {
          new: 0,
          screened: 0,
          approved: 0,
          rejected: 0,
          processed: 0
        };
        
        statusResult.results.forEach(row => {
          if (statusCounts.hasOwnProperty(row.status)) {
            statusCounts[row.status] = row.count;
          }
        });
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            candidates: result.results,
            counts: statusCounts,
            total: result.results.length
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Database query failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Test endpoint - use /test-candidates');
  }
};
