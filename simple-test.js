// Simple test for candidate actions
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/simple-test') {
      try {
        // Test 1: Get a candidate to work with
        const candidateQuery = `
          SELECT id, title, status 
          FROM candidate_articles 
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const candidateStmt = env.AMO_DB.prepare(candidateQuery);
        const candidateResult = await candidateStmt.first();
        
        if (!candidateResult) {
          return new Response(JSON.stringify({
            error: 'No candidates found'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Test 2: Update candidate status to 'screened'
        const updateQuery = `
          UPDATE candidate_articles 
          SET 
            status = 'screened',
            relevance_score = 85,
            screener_reason = 'Test screening reason',
            recommended_dimensions = '["AI Visibility", "Operational Dependency"]',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        const updateStmt = env.AMO_DB.prepare(updateQuery);
        await updateStmt.bind(candidateResult.id).run();
        
        // Test 3: Verify the update
        const verifyQuery = `
          SELECT id, status, relevance_score, screener_reason, recommended_dimensions, updated_at
          FROM candidate_articles 
          WHERE id = ?
        `;
        
        const verifyStmt = env.AMO_DB.prepare(verifyQuery);
        const verifyResult = await verifyStmt.bind(candidateResult.id).first();
        
        return new Response(JSON.stringify({
          success: true,
          original_candidate: candidateResult,
          updated_candidate: verifyResult,
          test_passed: verifyResult.status === 'screened' && verifyResult.relevance_score === 85
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Test failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Simple test - use /simple-test');
  }
};
