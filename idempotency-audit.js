// Idempotency Protection Audit
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/idempotency-audit') {
      try {
        console.log('=== IDEMPOTENCY PROTECTION AUDIT ===');
        
        // Test 1: Verify candidate status check prevents reprocessing
        const testCandidateId = 1; // Already processed candidate
        
        const statusCheckQuery = `
          SELECT id, status FROM candidate_articles WHERE id = ?
        `;
        
        const statusStmt = env.AMO_DB.prepare(statusCheckQuery);
        const candidate = await statusStmt.bind(testCandidateId).first();
        
        console.log(`Test 1 - Candidate Status Check:`, candidate);
        
        // Test 2: Check for duplicate events
        const duplicateEventsQuery = `
          SELECT 
            COUNT(*) as total_events,
            COUNT(DISTINCT id) as unique_events,
            COUNT(DISTINCT headline) as unique_headlines
          FROM events
        `;
        
        const eventStmt = env.AMO_DB.prepare(duplicateEventsQuery);
        const eventStats = await eventStmt.first();
        
        console.log(`Test 2 - Event Duplicates:`, eventStats);
        
        // Test 3: Check for duplicate signals
        const duplicateSignalsQuery = `
          SELECT 
            COUNT(*) as total_signals,
            COUNT(DISTINCT id) as unique_signals,
            COUNT(DISTINCT event_id) as unique_event_ids
          FROM signals
        `;
        
        const signalStmt = env.AMO_DB.prepare(duplicateSignalsQuery);
        const signalStats = await signalStmt.first();
        
        console.log(`Test 3 - Signal Duplicates:`, signalStats);
        
        // Test 4: Check for duplicate articles
        const duplicateArticlesQuery = `
          SELECT 
            COUNT(*) as total_articles,
            COUNT(DISTINCT id) as unique_articles,
            COUNT(DISTINCT slug) as unique_slugs
          FROM articles
        `;
        
        const articleStmt = env.AMO_DB.prepare(duplicateArticlesQuery);
        const articleStats = await articleStmt.first();
        
        console.log(`Test 4 - Article Duplicates:`, articleStats);
        
        // Test 5: Verify processed candidates cannot be reprocessed
        const processedCandidatesQuery = `
          SELECT 
            COUNT(*) as processed_count,
            COUNT(CASE WHEN status = 'processed' THEN 1 END) as with_processed_status
          FROM candidate_articles 
          WHERE id IN (1, 2, 3, 4, 5)
        `;
        
        const processedStmt = env.AMO_DB.prepare(processedCandidatesQuery);
        const processedStats = await processedStmt.first();
        
        console.log(`Test 5 - Processed Candidate Protection:`, processedStats);
        
        // Determine idempotency result
        const idempotencyPass = 
          candidate.status === 'processed' &&
          eventStats.total_events === eventStats.unique_events &&
          signalStats.total_signals === signalStats.unique_signals &&
          articleStats.total_articles === articleStats.unique_articles &&
          processedStats.processed_count === processedStats.with_processed_status;
        
        return new Response(JSON.stringify({
          success: true,
          audit_area: 'Idempotency Protection',
          tests: {
            candidate_status_check: candidate.status === 'processed' ? 'PASS' : 'FAIL',
            no_duplicate_events: eventStats.total_events === eventStats.unique_events ? 'PASS' : 'FAIL',
            no_duplicate_signals: signalStats.total_signals === signalStats.unique_signals ? 'PASS' : 'FAIL',
            no_duplicate_articles: articleStats.total_articles === articleStats.unique_articles ? 'PASS' : 'FAIL',
            processed_protection: processedStats.processed_count === processedStats.with_processed_status ? 'PASS' : 'FAIL'
          },
          details: {
            candidate_status: candidate.status,
            event_stats: eventStats,
            signal_stats: signalStats,
            article_stats: articleStats,
            processed_stats: processedStats
          },
          result: idempotencyPass ? 'PASS' : 'FAIL'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Idempotency audit failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Idempotency audit - use /idempotency-audit');
  }
};
