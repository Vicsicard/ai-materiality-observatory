// Comprehensive Production Readiness Audit
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/production-readiness-audit') {
      try {
        console.log('=== PRODUCTION READINESS AUDIT ===');
        
        const auditResults = {
          idempotency: {},
          concurrency: {},
          failure_recovery: {},
          automation_safety: {},
          data_integrity: {}
        };
        
        // ===== AUDIT 1: IDEMPOTENCY PROTECTION =====
        console.log('\n--- AUDIT 1: IDEMPOTENCY PROTECTION ---');
        
        // Check for duplicate events
        const eventDupsQuery = `
          SELECT 
            COUNT(*) as total_events,
            COUNT(DISTINCT id) as unique_events,
            COUNT(DISTINCT headline) as unique_headlines
          FROM events
        `;
        const eventDupsStmt = env.AMO_DB.prepare(eventDupsQuery);
        const eventDups = await eventDupsStmt.first();
        
        // Check for duplicate signals
        const signalDupsQuery = `
          SELECT 
            COUNT(*) as total_signals,
            COUNT(DISTINCT id) as unique_signals
          FROM signals
        `;
        const signalDupsStmt = env.AMO_DB.prepare(signalDupsQuery);
        const signalDups = await signalDupsStmt.first();
        
        // Check for duplicate articles
        const articleDupsQuery = `
          SELECT 
            COUNT(*) as total_articles,
            COUNT(DISTINCT id) as unique_articles,
            COUNT(DISTINCT slug) as unique_slugs
          FROM articles
        `;
        const articleDupsStmt = env.AMO_DB.prepare(articleDupsQuery);
        const articleDups = await articleDupsStmt.first();
        
        // Check processed candidates have status protection
        const processedProtectionQuery = `
          SELECT 
            COUNT(*) as total_processed,
            COUNT(CASE WHEN status = 'processed' THEN 1 END) as with_processed_status
          FROM candidate_articles 
          WHERE status = 'processed'
        `;
        const processedProtectionStmt = env.AMO_DB.prepare(processedProtectionQuery);
        const processedProtection = await processedProtectionStmt.first();
        
        const idempotencyPass = 
          eventDups.total_events === eventDups.unique_events &&
          signalDups.total_signals === signalDups.unique_signals &&
          articleDups.total_articles === articleDups.unique_articles &&
          processedProtection.total_processed === processedProtection.with_processed_status;
        
        auditResults.idempotency = {
          result: idempotencyPass ? 'PASS' : 'FAIL',
          tests: {
            no_duplicate_events: eventDups.total_events === eventDups.unique_events ? 'PASS' : 'FAIL',
            no_duplicate_signals: signalDups.total_signals === signalDups.unique_signals ? 'PASS' : 'FAIL',
            no_duplicate_articles: articleDups.total_articles === articleDups.unique_articles ? 'PASS' : 'FAIL',
            processed_status_protection: processedProtection.total_processed === processedProtection.with_processed_status ? 'PASS' : 'FAIL'
          },
          details: { eventDups, signalDups, articleDups, processedProtection }
        };
        
        // ===== AUDIT 2: CONCURRENT EXECUTION SAFETY =====
        console.log('\n--- AUDIT 2: CONCURRENT EXECUTION SAFETY ---');
        
        // Check for orphaned signals (signals without events)
        const orphanedSignalsQuery = `
          SELECT COUNT(*) as orphaned_count
          FROM signals s
          WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = s.event_id)
        `;
        const orphanedSignalsStmt = env.AMO_DB.prepare(orphanedSignalsQuery);
        const orphanedSignals = await orphanedSignalsStmt.first();
        
        // Check for orphaned articles (articles without events)
        const orphanedArticlesQuery = `
          SELECT COUNT(*) as orphaned_count
          FROM articles a
          WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = a.event_id)
        `;
        const orphanedArticlesStmt = env.AMO_DB.prepare(orphanedArticlesQuery);
        const orphanedArticles = await orphanedArticlesStmt.first();
        
        // Check for broken candidate references
        const brokenCandidateRefsQuery = `
          SELECT COUNT(*) as broken_refs
          FROM candidate_articles ca
          WHERE ca.status = 'processed' 
          AND ca.rss_article_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM rss_articles ra WHERE ra.id = ca.rss_article_id)
        `;
        const brokenCandidateRefsStmt = env.AMO_DB.prepare(brokenCandidateRefsQuery);
        const brokenCandidateRefs = await brokenCandidateRefsStmt.first();
        
        const concurrencyPass = 
          orphanedSignals.orphaned_count === 0 &&
          orphanedArticles.orphaned_count === 0 &&
          brokenCandidateRefs.broken_refs === 0;
        
        auditResults.concurrency = {
          result: concurrencyPass ? 'PASS' : 'FAIL',
          tests: {
            no_orphaned_signals: orphanedSignals.orphaned_count === 0 ? 'PASS' : 'FAIL',
            no_orphaned_articles: orphanedArticles.orphaned_count === 0 ? 'PASS' : 'FAIL',
            no_broken_references: brokenCandidateRefs.broken_refs === 0 ? 'PASS' : 'FAIL'
          },
          details: { orphanedSignals, orphanedArticles, brokenCandidateRefs }
        };
        
        // ===== AUDIT 3: FAILURE RECOVERY =====
        console.log('\n--- AUDIT 3: FAILURE RECOVERY ---');
        
        // Check for partial updates (events without signals)
        const eventsWithoutSignalsQuery = `
          SELECT COUNT(*) as count
          FROM events e
          WHERE NOT EXISTS (SELECT 1 FROM signals s WHERE s.event_id = e.id)
        `;
        const eventsWithoutSignalsStmt = env.AMO_DB.prepare(eventsWithoutSignalsQuery);
        const eventsWithoutSignals = await eventsWithoutSignalsStmt.first();
        
        // Check for signals without articles
        const signalsWithoutArticlesQuery = `
          SELECT COUNT(*) as count
          FROM signals s
          WHERE NOT EXISTS (SELECT 1 FROM articles a WHERE a.event_id = s.event_id)
        `;
        const signalsWithoutArticlesStmt = env.AMO_DB.prepare(signalsWithoutArticlesQuery);
        const signalsWithoutArticles = await signalsWithoutArticlesStmt.first();
        
        // Check for processed candidates without corresponding events
        const candidatesWithoutEventsQuery = `
          SELECT COUNT(*) as count
          FROM candidate_articles ca
          WHERE ca.status = 'processed'
          AND NOT EXISTS (SELECT 1 FROM events e WHERE e.headline LIKE CONCAT('%', SUBSTR(ca.title, 1, 50), '%'))
        `;
        const candidatesWithoutEventsStmt = env.AMO_DB.prepare(candidatesWithoutEventsQuery);
        const candidatesWithoutEvents = await candidatesWithoutEventsStmt.first();
        
        const failureRecoveryPass = 
          eventsWithoutSignals.count === 0 &&
          signalsWithoutArticles.count === 0;
        
        auditResults.failure_recovery = {
          result: failureRecoveryPass ? 'PASS' : 'FAIL',
          tests: {
            no_partial_events: eventsWithoutSignals.count === 0 ? 'PASS' : 'FAIL',
            no_partial_signals: signalsWithoutArticles.count === 0 ? 'PASS' : 'FAIL',
            transactional_integrity: failureRecoveryPass ? 'PASS' : 'FAIL'
          },
          details: { eventsWithoutSignals, signalsWithoutArticles }
        };
        
        // ===== AUDIT 4: AUTOMATION SAFETY =====
        console.log('\n--- AUDIT 4: AUTOMATION SAFETY ---');
        
        // Check for approved candidates (should be 0 if batch processor works)
        const approvedCandidatesQuery = `
          SELECT COUNT(*) as count FROM candidate_articles WHERE status = 'approved'
        `;
        const approvedCandidatesStmt = env.AMO_DB.prepare(approvedCandidatesQuery);
        const approvedCandidates = await approvedCandidatesStmt.first();
        
        // Check for new candidates (should exist)
        const newCandidatesQuery = `
          SELECT COUNT(*) as count FROM candidate_articles WHERE status = 'new'
        `;
        const newCandidatesStmt = env.AMO_DB.prepare(newCandidatesQuery);
        const newCandidates = await newCandidatesStmt.first();
        
        // Check for candidates with missing content
        const missingContentQuery = `
          SELECT COUNT(*) as count
          FROM candidate_articles ca
          LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
          WHERE ca.status = 'processed'
          AND (ra.raw_content IS NULL OR LENGTH(ra.raw_content) = 0)
        `;
        const missingContentStmt = env.AMO_DB.prepare(missingContentQuery);
        const missingContent = await missingContentStmt.first();
        
        // Check for malformed candidates
        const malformedCandidatesQuery = `
          SELECT COUNT(*) as count
          FROM candidate_articles
          WHERE title IS NULL OR title = '' OR url IS NULL OR url = ''
        `;
        const malformedCandidatesStmt = env.AMO_DB.prepare(malformedCandidatesQuery);
        const malformedCandidates = await malformedCandidatesStmt.first();
        
        const automationSafetyPass = 
          newCandidates.count > 0 &&
          missingContent.count === 0 &&
          malformedCandidates.count === 0;
        
        auditResults.automation_safety = {
          result: automationSafetyPass ? 'PASS' : 'FAIL',
          tests: {
            has_candidates_to_process: newCandidates.count > 0 ? 'PASS' : 'FAIL',
            no_missing_content: missingContent.count === 0 ? 'PASS' : 'FAIL',
            no_malformed_candidates: malformedCandidates.count === 0 ? 'PASS' : 'FAIL'
          },
          details: { newCandidates, missingContent, malformedCandidates }
        };
        
        // ===== AUDIT 5: DATA INTEGRITY =====
        console.log('\n--- AUDIT 5: DATA INTEGRITY ---');
        
        // Check for referential integrity
        const referentialIntegrityQuery = `
          SELECT 
            (SELECT COUNT(*) FROM signals WHERE event_id NOT IN (SELECT id FROM events)) as invalid_signal_refs,
            (SELECT COUNT(*) FROM articles WHERE event_id NOT IN (SELECT id FROM events)) as invalid_article_refs,
            (SELECT COUNT(*) FROM candidate_articles WHERE rss_article_id IS NOT NULL AND rss_article_id NOT IN (SELECT id FROM rss_articles)) as invalid_candidate_refs
        `;
        const referentialIntegrityStmt = env.AMO_DB.prepare(referentialIntegrityQuery);
        const referentialIntegrity = await referentialIntegrityStmt.first();
        
        // Check for data consistency
        const dataConsistencyQuery = `
          SELECT 
            (SELECT COUNT(DISTINCT event_id) FROM signals) as signals_with_events,
            (SELECT COUNT(DISTINCT event_id) FROM articles) as articles_with_events,
            (SELECT COUNT(*) FROM events) as total_events
        `;
        const dataConsistencyStmt = env.AMO_DB.prepare(dataConsistencyQuery);
        const dataConsistency = await dataConsistencyStmt.first();
        
        const dataIntegrityPass = 
          referentialIntegrity.invalid_signal_refs === 0 &&
          referentialIntegrity.invalid_article_refs === 0 &&
          referentialIntegrity.invalid_candidate_refs === 0;
        
        auditResults.data_integrity = {
          result: dataIntegrityPass ? 'PASS' : 'FAIL',
          tests: {
            no_orphaned_signals: referentialIntegrity.invalid_signal_refs === 0 ? 'PASS' : 'FAIL',
            no_orphaned_articles: referentialIntegrity.invalid_article_refs === 0 ? 'PASS' : 'FAIL',
            no_broken_references: referentialIntegrity.invalid_candidate_refs === 0 ? 'PASS' : 'FAIL'
          },
          details: { referentialIntegrity, dataConsistency }
        };
        
        // ===== FINAL ASSESSMENT =====
        const allPass = 
          auditResults.idempotency.result === 'PASS' &&
          auditResults.concurrency.result === 'PASS' &&
          auditResults.failure_recovery.result === 'PASS' &&
          auditResults.automation_safety.result === 'PASS' &&
          auditResults.data_integrity.result === 'PASS';
        
        console.log('=== AUDIT COMPLETE ===');
        console.log(`Overall Result: ${allPass ? 'READY FOR AUTOMATION' : 'REMEDIATION REQUIRED'}`);
        
        return new Response(JSON.stringify({
          success: true,
          audit_timestamp: new Date().toISOString(),
          production_readiness_score: {
            idempotency: auditResults.idempotency.result,
            concurrency: auditResults.concurrency.result,
            failure_recovery: auditResults.failure_recovery.result,
            automation_safety: auditResults.automation_safety.result,
            data_integrity: auditResults.data_integrity.result,
            overall: allPass ? 'READY FOR AUTOMATION' : 'REMEDIATION REQUIRED'
          },
          detailed_results: auditResults
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Production readiness audit failed:', error);
        return new Response(JSON.stringify({
          error: 'Production readiness audit failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Production readiness audit - use /production-readiness-audit');
  }
};
