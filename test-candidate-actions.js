// Test script for candidate actions with database persistence
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test-actions') {
      try {
        // Test 1: Get first 3 candidates for testing
        const candidatesQuery = `
          SELECT id, title, status 
          FROM candidate_articles 
          ORDER BY created_at DESC 
          LIMIT 3
        `;
        
        const candidatesStmt = env.AMO_DB.prepare(candidatesQuery);
        const candidatesResult = await candidatesStmt.all();
        
        const candidates = candidatesResult.results;
        
        if (candidates.length < 3) {
          return new Response(JSON.stringify({
            error: 'Not enough candidates for testing',
            available: candidates.length
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const results = [];
        
        // Test 2: Screen first candidate
        const candidate1 = candidates[0];
        console.log(`Testing screening candidate ${candidate1.id}`);
        
        try {
          const screenResponse = await fetch(`https://candidate-api-actions.vic-76c.workers.dev/api/admin/candidates?id=${candidate1.id}&action=screen`);
          const screenResult = await screenResponse.json();
          results.push({
            action: 'screen',
            candidate_id: candidate1.id,
            status: screenResult.success ? 'success' : 'failed',
            response: screenResult
          });
        } catch (error) {
          results.push({
            action: 'screen',
            candidate_id: candidate1.id,
            status: 'error',
            error: error.message
          });
        }
        
        // Test 3: Approve second candidate
        const candidate2 = candidates[1];
        console.log(`Testing approval candidate ${candidate2.id}`);
        
        try {
          const approveResponse = await fetch(`https://candidate-api-actions.vic-76c.workers.dev/api/admin/candidates?id=${candidate2.id}&action=approve`);
          const approveResult = await approveResponse.json();
          results.push({
            action: 'approve',
            candidate_id: candidate2.id,
            status: approveResult.success ? 'success' : 'failed',
            response: approveResult
          });
        } catch (error) {
          results.push({
            action: 'approve',
            candidate_id: candidate2.id,
            status: 'error',
            error: error.message
          });
        }
        
        // Test 4: Reject third candidate
        const candidate3 = candidates[2];
        console.log(`Testing rejection candidate ${candidate3.id}`);
        
        try {
          const rejectResponse = await fetch(`https://candidate-api-actions.vic-76c.workers.dev/api/admin/candidates?id=${candidate3.id}&action=reject`);
          const rejectResult = await rejectResponse.json();
          results.push({
            action: 'reject',
            candidate_id: candidate3.id,
            status: rejectResult.success ? 'success' : 'failed',
            response: rejectResult
          });
        } catch (error) {
          results.push({
            action: 'reject',
            candidate_id: candidate3.id,
            status: 'error',
            error: error.message
          });
        }
        
        // Test 5: Verify database state
        const verificationQuery = `
          SELECT id, status, relevance_score, screener_reason, recommended_dimensions, 
                 approved_at, rejected_at, updated_at
          FROM candidate_articles
          WHERE id IN (?, ?, ?)
          ORDER BY id
        `;
        
        const verificationStmt = env.AMO_DB.prepare(verificationQuery);
        const verificationResult = await verificationStmt.bind(
          candidate1.id, candidate2.id, candidate3.id
        ).all();
        
        return new Response(JSON.stringify({
          success: true,
          test_results: results,
          database_state: verificationResult.results,
          summary: {
            tested_candidates: 3,
            successful_actions: results.filter(r => r.status === 'success').length,
            failed_actions: results.filter(r => r.status === 'failed').length,
            error_actions: results.filter(r => r.status === 'error').length
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Test execution failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Test endpoint - use /test-actions');
  }
};
