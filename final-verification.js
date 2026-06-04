// Final verification of single candidate test results
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/final-verification') {
      try {
        // Check candidate status
        const candidateQuery = `
          SELECT id, title, status, processed_at
          FROM candidate_articles 
          WHERE id = 1
        `;
        
        const candidateStmt = env.AMO_DB.prepare(candidateQuery);
        const candidate = await candidateStmt.first();
        
        // Check event created
        const eventQuery = `
          SELECT id, headline, source_name, created_at
          FROM events 
          WHERE id = 12
        `;
        
        const eventStmt = env.AMO_DB.prepare(eventQuery);
        const event = await eventStmt.first();
        
        // Check signal created
        const signalQuery = `
          SELECT id, signal_type, signal_reason, created_at
          FROM signals 
          WHERE id = 12
        `;
        
        const signalStmt = env.AMO_DB.prepare(signalQuery);
        const signal = await signalStmt.first();
        
        // Check article created
        const articleQuery = `
          SELECT id, title, slug, status, created_at
          FROM articles 
          WHERE id = 10
        `;
        
        const articleStmt = env.AMO_DB.prepare(articleQuery);
        const article = await articleStmt.first();
        
        // Get database counts
        const countsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'processed') as processed_candidates,
            (SELECT COUNT(*) FROM events) as total_events,
            (SELECT COUNT(*) FROM signals) as total_signals,
            (SELECT COUNT(*) FROM articles) as total_articles
        `;
        
        const countsStmt = env.AMO_DB.prepare(countsQuery);
        const counts = await countsStmt.first();
        
        return new Response(JSON.stringify({
          success: true,
          verification_results: {
            candidate: candidate,
            event: event,
            signal: signal,
            article: article,
            database_counts: counts
          },
          test_summary: {
            candidate_processed: candidate?.status === 'processed',
            event_created: !!event,
            signal_created: !!signal,
            article_created: !!article,
            end_to_end_success: candidate?.status === 'processed' && !!event && !!signal && !!article
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Verification failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Final verification - use /final-verification');
  }
};
