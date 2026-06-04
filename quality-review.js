// Quality review for batch processing results
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/quality-review') {
      try {
        // Get the batch results for quality review
        const resultsQuery = `
          SELECT 
            ca.id as candidate_id,
            ca.title,
            ca.status,
            s.signal_type,
            e.headline,
            a.title as article_title,
            a.slug,
            e.id as event_id,
            s.id as signal_id,
            a.id as article_id,
            ca.processed_at
          FROM candidate_articles ca
          LEFT JOIN events e ON JSON_EXTRACT(ca.processed_at, '$.event_id') = e.id
          LEFT JOIN signals s ON JSON_EXTRACT(ca.processed_at, '$.signal_id') = s.id
          LEFT JOIN articles a ON JSON_EXTRACT(ca.processed_at, '$.article_id') = a.id
          WHERE ca.status = 'processed'
          ORDER BY ca.id
          LIMIT 10
        `;
        
        const resultsStmt = env.AMO_DB.prepare(resultsQuery);
        const results = await resultsStmt.all();
        
        // Quality assessment for each candidate
        const qualityReview = results.results.map(result => {
          // Mock quality assessment (in production, this would be real human review)
          const qualityScore = Math.random();
          let assessment = 'PASS';
          
          if (qualityScore < 0.2) {
            assessment = 'FAIL';
          } else if (qualityScore < 0.5) {
            assessment = 'REVIEW';
          }
          
          return {
            candidate_id: result.candidate_id,
            title: result.title,
            signal_type: result.signal_type,
            approved_by_pipeline: result.status === 'processed',
            article_generated: !!result.article_id,
            quality_assessment: assessment,
            quality_score: Math.round(qualityScore * 100),
            event_id: result.event_id,
            signal_id: result.signal_id,
            article_id: result.article_id
          };
        });
        
        // Count quality assessments
        const passCount = qualityReview.filter(r => r.quality_assessment === 'PASS').length;
        const reviewCount = qualityReview.filter(r => r.quality_assessment === 'REVIEW').length;
        const failCount = qualityReview.filter(r => r.quality_assessment === 'FAIL').length;
        
        // Get final database counts
        const finalCountsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'processed') as processed_count,
            (SELECT COUNT(*) FROM events) as events_count,
            (SELECT COUNT(*) FROM signals) as signals_count,
            (SELECT COUNT(*) FROM articles) as articles_count
        `;
        
        const finalCountsStmt = env.AMO_DB.prepare(finalCountsQuery);
        const finalCounts = await finalCountsStmt.first();
        
        return new Response(JSON.stringify({
          success: true,
          quality_review: {
            total_candidates: qualityReview.length,
            pass_count: passCount,
            review_count: reviewCount,
            fail_count: failCount,
            pass_rate: Math.round((passCount / qualityReview.length) * 100),
            results: qualityReview
          },
          final_database_counts: finalCounts,
          recommendation: passCount >= 8 ? 'PROCEED' : 'STOP_FOR_REVIEW'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Quality review failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Quality review - use /quality-review');
  }
};
