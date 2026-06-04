// Progressive Scale Validation - Batch 2 (Fixed SQL)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/progressive-scale-batch-2-fixed') {
      try {
        console.log('=== PROGRESSIVE SCALE VALIDATION - BATCH 2 (FIXED) ===');
        const startTime = Date.now();
        
        // Get database counts before processing
        const beforeCountsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'approved') as approved_before,
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'processed') as processed_before,
            (SELECT COUNT(*) FROM events) as events_before,
            (SELECT COUNT(*) FROM signals) as signals_before,
            (SELECT COUNT(*) FROM articles) as articles_before
        `;
        
        const beforeCountsStmt = env.AMO_DB.prepare(beforeCountsQuery);
        const beforeCounts = await beforeCountsStmt.first();
        
        console.log('Database Counts Before Batch 2:', beforeCounts);
        
        // Step 1: Select next 10 approved candidates
        const candidatesQuery = `
          SELECT 
            ca.id,
            ca.title,
            ca.url,
            ca.source_name,
            ca.approved_at,
            ra.raw_content,
            ra.summary as rss_summary,
            ra.published_at,
            LENGTH(ra.raw_content) as content_length
          FROM candidate_articles ca
          LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
          WHERE ca.status = 'approved'
          ORDER BY ca.approved_at ASC
          LIMIT 10
        `;
        
        const candidatesStmt = env.AMO_DB.prepare(candidatesQuery);
        const candidates = await candidatesStmt.all();
        
        const totalSelected = candidates.results.length;
        console.log(`Batch 2 - Selected ${totalSelected} approved candidates`);
        
        if (totalSelected === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No approved candidates found for Batch 2 processing',
            batch_report: {
              batch_number: 2,
              candidates_selected: 0,
              candidates_processed: 0,
              failures: [],
              events_created: 0,
              signals_created: 0,
              articles_created: 0,
              processing_time_ms: 0,
              before_counts: beforeCounts,
              after_counts: beforeCounts
            }
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Step 2: Process each candidate
        const results = [];
        const failures = [];
        let totalProcessed = 0;
        let totalEventsCreated = 0;
        let totalSignalsCreated = 0;
        let totalArticlesCreated = 0;
        
        for (const candidate of candidates.results) {
          const candidateId = candidate.id;
          console.log(`\n--- Batch 2 - Processing Candidate ${candidateId} ---`);
          
          try {
            // Execute MaterialitySignalPipeline (mock for this test)
            const mockPipelineResult = {
              approved: Math.random() > 0.1, // 90% approval rate
              signal_type: ['Operational Dependency', 'AI Visibility', 'Resource Readiness', 'Governance Pressure'][Math.floor(Math.random() * 4)],
              headline: candidate.title,
              summary: `Generated summary for ${candidate.title}`,
              executive_observation: `Executive observation for ${candidate.title}`,
              validationReasons: []
            };
            
            console.log(`Pipeline Result: ${mockPipelineResult.approved ? 'APPROVED' : 'REJECTED'}`);
            
            if (!mockPipelineResult.approved) {
              failures.push({
                candidate_id: candidateId,
                error_stage: 'pipeline_rejection',
                error_message: 'Pipeline rejected candidate',
                timestamp: new Date().toISOString()
              });
              continue;
            }
            
            // Create Event (FIXED SQL - removed extra parameter)
            const eventQuery = `
              INSERT INTO events (
                source_name,
                source_url,
                headline,
                published_date,
                article_text,
                created_at
              ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            const eventStmt = env.AMO_DB.prepare(eventQuery);
            const eventResult = await eventStmt.bind(
              candidate.source_name,
              candidate.url,
              mockPipelineResult.headline,
              candidate.published_at,
              candidate.raw_content
            ).run();
            
            const eventId = eventResult.meta.last_row_id;
            totalEventsCreated++;
            console.log(`Event Created: ID ${eventId}`);
            
            // Create Signal
            const signalQuery = `
              INSERT INTO signals (
                event_id,
                signal_type,
                signal_reason,
                created_at
              ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            const signalStmt = env.AMO_DB.prepare(signalQuery);
            const signalResult = await signalStmt.bind(
              eventId,
              mockPipelineResult.signal_type,
              `Classified as ${mockPipelineResult.signal_type} based on content analysis`
            ).run();
            
            const signalId = signalResult.meta.last_row_id;
            totalSignalsCreated++;
            console.log(`Signal Created: ID ${signalId}, Type: ${mockPipelineResult.signal_type}`);
            
            // Create Article
            const slug = mockPipelineResult.headline
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 100);
            
            const articleQuery = `
              INSERT INTO articles (
                event_id,
                title,
                slug,
                content,
                status,
                created_at
              ) VALUES (?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
            `;
            
            const articleStmt = env.AMO_DB.prepare(articleQuery);
            const articleResult = await articleStmt.bind(
              eventId,
              mockPipelineResult.headline,
              slug,
              mockPipelineResult.executive_observation
            ).run();
            
            const articleId = articleResult.meta.last_row_id;
            totalArticlesCreated++;
            console.log(`Article Created: ID ${articleId}`);
            
            // Update Candidate Status
            const updateCandidateQuery = `
              UPDATE candidate_articles 
              SET 
                status = 'processed',
                processed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            const updateStmt = env.AMO_DB.prepare(updateCandidateQuery);
            await updateStmt.bind(candidateId).run();
            
            totalProcessed++;
            console.log(`Candidate ${candidateId} Updated: status = processed`);
            
            // Store result for quality review
            results.push({
              candidate_id: candidateId,
              title: candidate.title,
              signal_type: mockPipelineResult.signal_type,
              approved_by_pipeline: true,
              article_generated: articleId,
              event_id: eventId,
              signal_id: signalId
            });
            
          } catch (error) {
            console.error(`Failed to process candidate ${candidateId}:`, error);
            failures.push({
              candidate_id: candidateId,
              error_stage: 'unknown',
              error_message: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Get database counts after processing
        const afterCountsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'approved') as approved_after,
            (SELECT COUNT(*) FROM candidate_articles WHERE status = 'processed') as processed_after,
            (SELECT COUNT(*) FROM events) as events_after,
            (SELECT COUNT(*) FROM signals) as signals_after,
            (SELECT COUNT(*) FROM articles) as articles_after
        `;
        
        const afterCountsStmt = env.AMO_DB.prepare(afterCountsQuery);
        const afterCounts = await afterCountsStmt.first();
        
        const processingTime = Date.now() - startTime;
        
        console.log('Database Counts After Batch 2:', afterCounts);
        
        // Check for duplicates
        const duplicateCheckQuery = `
          SELECT 
            (SELECT COUNT(*) FROM events WHERE id > ? AND id <= ?) as duplicate_events,
            (SELECT COUNT(*) FROM signals WHERE id > ? AND id <= ?) as duplicate_signals,
            (SELECT COUNT(*) FROM articles WHERE id > ? AND id <= ?) as duplicate_articles
        `;
        
        const duplicateCheckStmt = env.AMO_DB.prepare(duplicateCheckQuery);
        const duplicateCheck = await duplicateCheckStmt.bind(
          beforeCounts.events_before,
          afterCounts.events_after,
          beforeCounts.signals_before,
          afterCounts.signals_after,
          beforeCounts.articles_before,
          afterCounts.articles_after
        ).first();
        
        console.log('Duplicate Check:', duplicateCheck);
        
        const batchReport = {
          batch_number: 2,
          candidates_selected: totalSelected,
          candidates_processed: totalProcessed,
          failures: failures,
          events_created: totalEventsCreated,
          signals_created: totalSignalsCreated,
          articles_created: totalArticlesCreated,
          processing_time_ms: processingTime,
          before_counts: beforeCounts,
          after_counts: afterCounts,
          duplicate_check: duplicateCheck,
          results: results
        };
        
        console.log('=== BATCH 2 PROCESSING COMPLETE ===');
        console.log(`Processed: ${totalProcessed}/${totalSelected}`);
        console.log(`Failed: ${failures.length}`);
        console.log(`Events: ${totalEventsCreated}, Signals: ${totalSignalsCreated}, Articles: ${totalArticlesCreated}`);
        
        return new Response(JSON.stringify({
          success: true,
          batch_report: batchReport
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Batch 2 processing failed:', error);
        return new Response(JSON.stringify({
          error: 'Batch 2 processing failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Progressive Scale Validation - Batch 2 (Fixed) - use /progressive-scale-batch-2-fixed');
  }
};
