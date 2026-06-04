/**
 * AMO V3 Candidate Queue API
 * 
 * GET /api/admin/candidates - Get candidate queue
 * POST /api/admin/candidates/:id/approve - Approve candidate
 * POST /api/admin/candidates/:id/reject - Reject candidate
 * POST /api/admin/candidates/:id/screen - Screen candidate
 * POST /api/admin/candidates/:id/process - Process through AMO V2
 */

import { NextResponse } from 'next/server';
import { AMOCandidateScreener, CandidateArticle } from '@/lib/screening/amo-candidate-screener';
import { MaterialitySignalPipeline } from '@/lib/pipeline/materiality-signal-pipeline';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let whereClause = '';
    const params: any[] = [];
    
    if (status && status !== 'all') {
      whereClause = 'WHERE ca.status = ?';
      params.push(status);
    }
    
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
      ${whereClause}
      ORDER BY ca.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    // Query the real database
    const env = (request as any).cf?.env || process.env;
    
    if (!env.AMO_DB) {
      console.error('D1 binding not available');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }
    
    // Execute the query
    const stmt = env.AMO_DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    const candidates = (result as any).results || [];
    
    // Get counts by status
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
    
    (statusResult as any).results.forEach((row: any) => {
      if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status as keyof typeof statusCounts] = row.count;
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        candidates,
        counts: statusCounts,
        pagination: {
          limit,
          offset,
          total: candidates.length
        }
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch candidates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    const env = (request as any).cf?.env || process.env;
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing candidate ID or action' },
        { status: 400 }
      );
    }
    
    // Mock candidate data
    const candidate = {
      id: parseInt(id),
      title: 'Test Article',
      url: 'https://example.com',
      source_name: 'Test Source',
      summary: 'Test summary',
      content: 'Test content'
    };
    
    switch (action) {
      case 'screen':
        return await handleScreenCandidate(candidate, env);
        
      case 'approve':
        return await handleApproveCandidate(candidate, env);
        
      case 'reject':
        return await handleRejectCandidate(candidate, env);
        
      case 'process':
        return await handleProcessCandidate(candidate, env);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process candidate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleScreenCandidate(candidate: any, env: any) {
  
  if (!env.AMO_DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    );
  }
  
  // Load candidate with full data from database
  const candidateQuery = `
    SELECT 
      ca.id,
      ca.title,
      ca.url,
      ca.source_name,
      ca.summary,
      ca.published_at,
      ca.created_at,
      ca.updated_at,
      ra.raw_content
    FROM candidate_articles ca
    LEFT JOIN rss_articles ra ON ca.rss_article_id = ra.id
    WHERE ca.id = ?
  `;
  
  const candidateStmt = env.AMO_DB.prepare(candidateQuery);
  const candidateResult = await candidateStmt.bind(parseInt(candidate.id)).first();
  
  if (!candidateResult) {
    return NextResponse.json(
      { error: 'Candidate not found' },
      { status: 404 }
    );
  }
  
  // Run screening
  const screener = new AMOCandidateScreener();
  const result = await screener.screenCandidate(candidateResult);
  
  // Update candidate_articles with screening results
  const updateStmt = env.AMO_DB.prepare(`
    UPDATE candidate_articles 
    SET 
      status = 'screened',
      relevance_score = ?,
      screener_reason = ?,
      recommended_dimensions = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  await updateStmt.bind(
    result.relevance_score || 0,
    result.primary_reason || '',
    JSON.stringify(result.relevant_dimensions || []),
    parseInt(candidate.id)
  ).run();
  
  // Insert screening log if table exists
  try {
    const logStmt = env.AMO_DB.prepare(`
      INSERT INTO screening_logs (
        candidate_id,
        relevance_score,
        decision,
        primary_reason,
        recommended_dimensions,
        evidence_count,
        processing_time_ms,
        error_message,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await logStmt.bind(
      parseInt(candidate.id),
      result.relevance_score || 0,
      result.decision,
      result.primary_reason || '',
      JSON.stringify(result.relevant_dimensions || []),
      (result.evidence || []).length,
      0, // processing_time_ms - will be calculated
      null, // error_message
      new Date().toISOString()
    ).run();
  } catch (logError) {
    console.log('Screening log table not available:', logError instanceof Error ? logError.message : 'Unknown error');
  }
  
  return NextResponse.json({
    success: true,
    data: {
      candidate_id: parseInt(candidate.id),
      screening_result: result,
      message: `Candidate ${result.decision === 'approve' ? 'approved' : 'rejected'} with score ${result.relevance_score}/100`
    }
  });
}

async function handleApproveCandidate(candidate: any, env: any) {
  if (!env.AMO_DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    );
  }
  
  // Update candidate_articles with approval
  const updateStmt = env.AMO_DB.prepare(`
    UPDATE candidate_articles 
    SET 
      status = 'approved',
      approved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  await updateStmt.bind(parseInt(candidate.id)).run();
  
  return NextResponse.json({
    success: true,
    data: {
      candidate_id: parseInt(candidate.id),
      status: 'approved',
      approved_at: new Date().toISOString(),
      message: 'Candidate approved successfully'
    }
  });
}

async function handleRejectCandidate(candidate: any, env: any) {
  if (!env.AMO_DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 500 }
    );
  }
  
  // Update candidate_articles with rejection
  const updateStmt = env.AMO_DB.prepare(`
    UPDATE candidate_articles 
    SET 
      status = 'rejected',
      rejected_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  await updateStmt.bind(parseInt(candidate.id)).run();
  
  return NextResponse.json({
    success: true,
    data: {
      candidate_id: parseInt(candidate.id),
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      message: 'Candidate rejected successfully'
    }
  });
}

async function handleProcessCandidate(candidate: any, env: any) {
  // Process through AMO V2 pipeline - NOT IMPLEMENTED IN PHASE 2.1
  // This function remains unchanged for now
  
  const pipeline = new MaterialitySignalPipeline();
  
  const pipelineInput = {
    articleTitle: candidate.title,
    sourceDomain: new URL(candidate.url).hostname,
    articleContent: candidate.content || candidate.summary || '',
    sourceUrl: candidate.url,
    sourceName: candidate.source_name
  };
  
  const result = await pipeline.process(pipelineInput);
  
  if (result.approved) {
    // In production, update candidate status to 'processed' and create observation
    console.log(`Processed candidate ${candidate.id} through AMO V2 pipeline`);
    
    return NextResponse.json({
      success: true,
      data: {
        candidate_id: candidate.id,
        status: 'processed',
        processed_at: new Date().toISOString(),
        observation: {
          article: result.article,
          signal_type: result.signal_type,
          headline: result.headline,
          materiality_signal: result.materiality_signal,
          executive_observation: result.executive_observation
        },
        message: 'Candidate processed through AMO V2 pipeline successfully'
      }
    });
  } else {
    return NextResponse.json(
      { 
        error: 'Pipeline rejected candidate',
        validation_reasons: result.validationReasons
      },
      { status: 400 }
    );
  }
}
