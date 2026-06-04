// Approve 10 candidates for batch processing test
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/approve-10-candidates') {
      try {
        console.log('=== APPROVING 10 CANDIDATES FOR BATCH TEST ===');
        
        // Select 10 candidates with status 'new' or 'screened'
        const candidatesQuery = `
          SELECT id, title, status
          FROM candidate_articles 
          WHERE status IN ('new', 'screened')
          ORDER BY created_at ASC
          LIMIT 10
        `;
        
        const candidatesStmt = env.AMO_DB.prepare(candidatesQuery);
        const candidates = await candidatesStmt.all();
        
        console.log(`Found ${candidates.results.length} candidates to approve`);
        
        if (candidates.results.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No candidates found to approve',
            approved_count: 0
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Approve each candidate
        let approvedCount = 0;
        for (const candidate of candidates.results) {
          const updateQuery = `
            UPDATE candidate_articles 
            SET 
              status = 'approved',
              approved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          
          const updateStmt = env.AMO_DB.prepare(updateQuery);
          await updateStmt.bind(candidate.id).run();
          
          approvedCount++;
          console.log(`Approved candidate ${candidate.id}: ${candidate.title}`);
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Approved ${approvedCount} candidates for batch processing`,
          approved_count: approvedCount,
          candidates: candidates.results
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Failed to approve candidates:', error);
        return new Response(JSON.stringify({
          error: 'Failed to approve candidates',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Approve 10 candidates - use /approve-10-candidates');
  }
};
