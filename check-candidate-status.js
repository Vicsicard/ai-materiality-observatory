// Check current candidate status for progressive scale validation
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/check-candidate-status') {
      try {
        console.log('=== CHECKING CANDIDATE STATUS ===');
        
        // Get current status counts
        const statusQuery = `
          SELECT 
            status,
            COUNT(*) as count
          FROM candidate_articles 
          GROUP BY status
          ORDER BY status
        `;
        
        const statusStmt = env.AMO_DB.prepare(statusQuery);
        const statusResults = await statusStmt.all();
        
        console.log('Current Status Counts:', statusResults.results);
        
        // Get sample candidates for each status
        const sampleQuery = `
          SELECT 
            id,
            title,
            status,
            created_at,
            updated_at
          FROM candidate_articles 
          ORDER BY created_at ASC
          LIMIT 20
        `;
        
        const sampleStmt = env.AMO_DB.prepare(sampleQuery);
        const sampleResults = await sampleStmt.all();
        
        // Get database totals
        const totalsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM candidate_articles) as total_candidates,
            (SELECT COUNT(*) FROM events) as total_events,
            (SELECT COUNT(*) FROM signals) as total_signals,
            (SELECT COUNT(*) FROM articles) as total_articles
        `;
        
        const totalsStmt = env.AMO_DB.prepare(totalsQuery);
        const totals = await totalsStmt.first();
        
        return new Response(JSON.stringify({
          success: true,
          status_counts: statusResults.results,
          sample_candidates: sampleResults.results,
          database_totals: totals,
          recommendation: statusResults.results.some(r => r.status === 'approved') ? 'PROCEED_WITH_BATCH_2' : 'APPROVE_MORE_CANDIDATES'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Status check failed:', error);
        return new Response(JSON.stringify({
          error: 'Status check failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Check candidate status - use /check-candidate-status');
  }
};
