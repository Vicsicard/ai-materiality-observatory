interface Env {
	DB: any;
}

interface QualityGateResult {
	passed: boolean;
	reason?: string;
}

// Centralized CORS headers
const corsHeaders = {
	"Access-Control-Allow-Origin": "https://ai-materiality-observatory.vercel.app",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

// CORS-guaranteed response helpers
function createSuccessResponse(data: any, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders
		}
	});
}

function createErrorResponse(error: string, status: number = 500, details?: string, stage?: string, additionalData?: any): Response {
	return new Response(JSON.stringify({
		success: false,
		error,
		...(details && { details }),
		...(stage && { stage }),
		...(additionalData && additionalData)
	}), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders
		}
	});
}

function validateExtractionQuality(content: string): QualityGateResult {
	// Must have at least 800 characters
	if (content.length < 800) {
		return {
			passed: false,
			reason: 'Article extraction failed: content too short (minimum 800 characters required)'
		};
	}
	
	// Must have at least 5 paragraph-like sentences
	const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
	if (sentences.length < 5) {
		return {
			passed: false,
			reason: 'Article extraction failed: insufficient paragraph structure (minimum 5 sentences required)'
		};
	}
	
	// Must not look like JavaScript or HTML
	const lowerContent = content.toLowerCase();
	const prohibitedPatterns = [
		'window.',
		'function ',
		'var ',
		'const ',
		'document.',
		'<script',
		'OptanonWrapper',
		'googletag',
		'dataLayer',
		'console.',
		'return ',
		'if (',
		'for (',
		'while (',
		'{',
		'}'
	];
	
	for (const pattern of prohibitedPatterns) {
		if (lowerContent.includes(pattern)) {
			return {
				passed: false,
				reason: 'Article extraction failed: content contains JavaScript or HTML code'
			};
		}
	}
	
	// Must have reasonable text-to-code ratio
	const textCharacters = content.replace(/[^\w\s.,!?;:]/g, '').length;
	const totalCharacters = content.length;
	const textRatio = textCharacters / totalCharacters;
	
	if (textRatio < 0.7) {
		return {
			passed: false,
			reason: 'Article extraction failed: content has insufficient text-to-code ratio'
		};
	}
	
	return { passed: true };
}

export default {
	async fetch(request: Request, env: Env) {
		let currentStage = 'request_parse';
		
		try {
			const url = new URL(request.url);
			
			// Handle CORS preflight requests
			if (request.method === "OPTIONS") {
				return new Response(null, {
					status: 200,
					headers: corsHeaders,
				});
			}
			
			// Handle API routes with D1 access
			if (url.pathname.startsWith('/api/')) {
				// Import and initialize database for API routes
				const { initializeDatabase } = await import('@/lib/db/client');
				initializeDatabase(env);
				
				// Route to appropriate API handler
				if (url.pathname === '/api/process-article' && request.method === 'POST') {
					currentStage = 'request_parse';
					const { ExtractorV2 } = await import('@/lib/extractor-v2');
					const { CrewAIPipeline } = await import('@/lib/pipeline/crewai-pipeline');
					const { DatabaseService } = await import('@/lib/db/database');
					
					let body;
					try {
						body = await request.json() as { url: string };
					} catch (jsonError) {
						return createErrorResponse('Invalid JSON in request body', 400, 
							jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error', currentStage);
					}
					
					if (!body.url) {
						return createErrorResponse('URL required', 400, undefined, currentStage);
					}
					
					// Extract article
					currentStage = 'article_extraction';
					const extractor = new ExtractorV2();
					console.log('PIPELINE STAGE: Extraction - START');
					const extractionResult = await extractor.extractFromUrl(body.url);
					
					if (extractionResult.rejected) {
						console.log('PIPELINE STAGE: Extraction - REJECTED');
						return createErrorResponse(extractionResult.rejectionReason || 'Extraction rejected', 400, undefined, currentStage);
					}
					
					const extractedArticle = {
						title: extractionResult.candidate.headline,
						content: extractionResult.candidate.content,
						author: extractionResult.candidate.author,
						publishedDate: extractionResult.candidate.publishedDate,
						siteName: extractionResult.candidate.siteName
					};
					console.log('PIPELINE STAGE: Extraction - SUCCESS');
					
					// Debug logging
					console.log('=== Article Extraction Debug ===');
					console.log('Extracted title:', extractedArticle.title);
					console.log('Source name:', extractedArticle.siteName);
					console.log('Extracted content length:', extractedArticle.content.length);
					console.log('First 500 chars:', extractedArticle.content.substring(0, 500));
					console.log('Extraction quality score:', extractionResult.candidate.qualityScore);
					
					// Run pipeline
					console.log('PIPELINE STAGE: Pipeline - START');
					const pipeline = new CrewAIPipeline();
					const result = await pipeline.process({
						articleText: extractedArticle.content,
						sourceName: extractedArticle.siteName || 'Unknown Source',
						sourceUrl: body.url,
						publishedDate: extractedArticle.publishedDate
					});
					console.log('PIPELINE STAGE: Pipeline - SUCCESS');
					
					// Debug logging for writer output
					console.log('=== Pipeline Output Debug ===');
					console.log('Writer produced article content:', !!result.article);
					if (result.article) {
						console.log('Generated article length:', result.article.length);
					}
					
					// Store in D1 if article was generated (regardless of editorial warnings)
					// Only fail on hard failures (extraction, placeholder titles, missing content)
					if (result.article && result.headline && result.signalType) {
						console.log('PIPELINE STAGE: D1 Insert - START');
						const db = new DatabaseService(env.DB);
						
						// Check for duplicate URL
						currentStage = 'duplicate_check';
						console.log('Checking for duplicate URL...');
						const existingEvent = await db.getEventByUrl(body.url);
						
						if (existingEvent) {
							console.log('Duplicate URL detected');
							console.log('Using existing event_id:', existingEvent.id);
							
							// Continue processing pipeline to generate new content
							const pipeline = new CrewAIPipeline();
							const result = await pipeline.process({
								articleText: extractedArticle.content,
								sourceName: extractedArticle.siteName || 'Unknown Source',
								sourceUrl: body.url,
								publishedDate: extractedArticle.publishedDate
							});
							
							console.log('Regenerating publication');
							
							// Extract title from generated article
							const titleMatch = result.article?.match(/^#\s+(.+)$/m);
							const newTitle = titleMatch ? titleMatch[1].trim() : result.headline || 'Generated Article';
							
							// Generate new slug from new title
							const newSlug = newTitle.toLowerCase()
								.replace(/[^a-z0-9\s-]/g, '')
								.replace(/\s+/g, '-')
								.substring(0, 100);
							
							// Update existing article record
							await db.updateArticle(existingEvent.id, {
								title: newTitle,
								slug: newSlug,
								content: result.article || ''
							});
							
							console.log('Updating article record');
							console.log('Title updated from: Event detected');
							console.log('to:', newTitle);
							
							return createSuccessResponse({
								success: true,
								status: "updated",
								eventId: existingEvent.id,
								articleId: existingEvent.id,
								slug: newSlug,
								approved: result.approved,
								article: result.article,
								headline: newTitle,
								signalType: result.signalType,
								validationReasons: result.validationReasons
							});
						}
						
						// Create event
						currentStage = 'event_create';
						let event;
						let createdArticle;
						
						event = await db.createEvent({
							source_name: extractedArticle.siteName || 'Unknown Source',
							source_url: body.url,
							headline: result.headline,
							published_date: extractedArticle.publishedDate,
							article_text: extractedArticle.content
						});
						
						// Create signal
						await db.createSignal({
							event_id: event.id,
							signal_type: result.signalType,
							signal_reason: `Classified as ${result.signalType}`
						});
						
						// Generate slug
						const slug = result.headline
							.toLowerCase()
							.replace(/[^a-z0-9\s-]/g, '')
							.replace(/\s+/g, '-')
							.substring(0, 100);
						
						// Create article with draft status for Draft2Post processing
						currentStage = 'article_create';
						const articleStatus = 'draft'; // Always start as draft for Phase 2 processing
						
						// DIAGNOSTIC LOGGING: Log all fields before insert
						console.log('=== ARTICLE CREATION DIAGNOSTICS ===');
						console.log('Event ID:', event.id);
						console.log('Title:', result.headline);
						console.log('Slug:', slug);
						console.log('Content length:', result.article ? result.article.length : 'null');
						console.log('Status:', articleStatus);
						console.log('Article object:', {
							event_id: event.id,
							title: result.headline,
							slug: slug,
							content: result.article ? `[${result.article.length} chars]` : 'null',
							status: articleStatus
						});
						
						console.log('PIPELINE STAGE: D1 Insert - START');
						createdArticle = await db.createArticle({
							event_id: event.id,
							title: result.headline,
							slug,
							content: result.article,
							status: articleStatus
						});
						console.log('PIPELINE STAGE: D1 Insert - SUCCESS');
						console.log('Created article ID:', createdArticle.id);
						
						// Trigger Draft2Post processing
						currentStage = 'draft2post_trigger';
						console.log('PIPELINE STAGE: Draft2Post Trigger - START');
						try {
							const { Draft2PostIntegration } = await import('@/lib/pipeline/draft2post-integration');
							const draft2Post = new Draft2PostIntegration();
							await draft2Post.triggerDraft2PostProcessing(createdArticle.id, env);
							console.log('PIPELINE STAGE: Draft2Post Trigger - SUCCESS');
						} catch (draft2PostError) {
							console.error('PIPELINE STAGE: Draft2Post Trigger - FAIL');
							console.error('Draft2Post processing failed:', draft2PostError);
							// Continue anyway - article is saved as draft
						}
						
						return createSuccessResponse({
							...result,
							articleId: event.id,
							slug,
							persisted: true
						});
					}
				}
			}
			
			// GET /api/admin/candidates - List all candidate articles
			if (url.pathname === '/api/admin/candidates' && request.method === 'GET') {
				console.log('[ADMIN_CANDIDATES_FETCH] endpoint hit');
				try {
					const stmt = env.DB.prepare(`
						SELECT 
							ca.id,
							ca.rss_article_id,
							ca.title,
							ca.url,
							ca.source_name,
							ca.created_at
						FROM candidate_articles ca
						ORDER BY ca.created_at DESC
					`);
					
					const results = await stmt.all();
					console.log('[ADMIN_CANDIDATES_FETCH] rows returned:', results.results?.length);
					
					return createSuccessResponse(results.results);
				} catch (error) {
					console.error('Failed to fetch admin candidates:', error);
					return createErrorResponse('Failed to fetch admin candidates', 500, 
						error instanceof Error ? error.message : 'Unknown error', 'admin_candidates_fetch');
				}
			}

			// GET /api/admin/articles - List all articles for admin
			if (url.pathname === '/api/admin/articles' && request.method === 'GET') {
			console.log('[ADMIN_ARTICLE_FETCH] endpoint hit');
			try {
				const { DatabaseService } = await import('@/lib/db/database');
				const db = new DatabaseService(env.DB);
				
				const articles = await db.getAllArticles();
				console.log('[ADMIN_ARTICLE_FETCH] query used: SELECT * FROM articles ORDER BY created_at DESC');
				console.log('[ADMIN_ARTICLE_FETCH] rows returned:', articles?.length);
				console.log('[ADMIN_ARTICLE_FETCH] first rows:', articles?.slice?.(0, 5));
				
				return createSuccessResponse(articles);
			} catch (error) {
				console.error('Failed to fetch admin articles:', error);
				return createErrorResponse('Failed to fetch admin articles', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'admin_articles_fetch');
			}
		}
		
		// POST /api/admin/articles/:id/publish - Publish article
		const publishMatch = url.pathname.match(/^\/api\/admin\/articles\/(\d+)\/publish$/);
		if (publishMatch && request.method === 'POST') {
			console.log('[ADMIN_ARTICLE_PUBLISH] endpoint hit');
			const articleId = parseInt(publishMatch[1]);
			try {
				const { DatabaseService } = await import('@/lib/db/database');
				const db = new DatabaseService(env.DB);
				
				await db.updateArticleStatus(articleId, 'published');
				console.log('[ADMIN_ARTICLE_PUBLISH] article published:', articleId);
				
				return createSuccessResponse({ success: true, articleId });
			} catch (error) {
				console.error('Failed to publish article:', error);
				return createErrorResponse('Failed to publish article', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'admin_publish_article');
			}
		}
		
		// DELETE /api/admin/articles/:id - DISABLED - DATA LOSS PREVENTION
		// DELETE FUNCTIONALITY REMOVED TO PREVENT ACCIDENTAL DATA LOSS
		// Article ID 1 was deleted during testing - DO NOT RE-ENABLE DELETE
		// Use archive functionality instead
		console.log('[ADMIN_DELETE] Delete endpoint disabled for data protection');
		
		// GET /api/observations - List all observations (Enhanced with Draft2Post data)
		if (url.pathname === '/api/observations' && request.method === 'GET') {
			try {
				const { EnhancedDatabaseService } = await import('@/lib/db/enhanced-database');
				const db = new EnhancedDatabaseService(env.DB);
				
				const observations = await db.getEnhancedObservations();
				
				// Transform data to match expected API format
				const transformedObservations = observations.map(obs => ({
					id: obs.id,
					title: obs.observatory_title || obs.title,
					slug: obs.observatory_slug || obs.slug,
					signal_type: obs.signal_category || 'Unknown',
					created_at: obs.published_at || obs.created_at,
					content: obs.content,
					what_this_may_indicate: obs.what_this_may_indicate,
					potential_organizational_relevance: obs.potential_organizational_relevance
				}));
				
				return createSuccessResponse(transformedObservations);
			} catch (error) {
				console.error('Failed to fetch observations:', error);
				return createErrorResponse('Failed to fetch observations', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'observations_fetch');
			}
		}
		
		// GET /api/observations/:slug - Get specific observation
		const observationsMatch = url.pathname.match(/^\/api\/observations\/([^\/]+)$/);
		if (observationsMatch && request.method === 'GET') {
			try {
				const { DatabaseService } = await import('@/lib/db/database');
				const db = new DatabaseService(env.DB);
				const slug = observationsMatch[1];
				
				const observation = await db.getObservationWithContent(slug);
				
				if (!observation) {
					return createErrorResponse('Observation not found', 404, undefined, 'observation_by_slug');
				}
				
				return createSuccessResponse(observation);
			} catch (error) {
				console.error('Failed to fetch observation:', error);
				return createErrorResponse('Failed to fetch observation', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'observation_by_slug');
			}
		}
		
		if (url.pathname === '/api/admin/publish' && request.method === 'POST') {
			try {
				const body = await request.json() as { articleId: number };
				
				if (!body.articleId) {
					return createErrorResponse('articleId required', 400, undefined, 'admin_publish_validation');
				}
				
				const { Draft2PostIntegration } = await import('@/lib/pipeline/draft2post-integration');
				const draft2Post = new Draft2PostIntegration();
				
				await draft2Post.publishArticle(body.articleId, env);
				
				return createSuccessResponse({ success: true });
			} catch (error) {
				console.error('Failed to publish article:', error);
				return createErrorResponse('Failed to publish article', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'admin_publish_article');
			}
		}
		
		if (url.pathname === '/api/admin/archive' && request.method === 'POST') {
			try {
				const body = await request.json() as { articleId: number };
				
				if (!body.articleId) {
					return createErrorResponse('articleId required', 400, undefined, 'admin_publish_validation');
				}
				
				const { Draft2PostIntegration } = await import('@/lib/pipeline/draft2post-integration');
				const draft2Post = new Draft2PostIntegration();
				
				await draft2Post.archiveArticle(body.articleId, env);
				
				return createSuccessResponse({ success: true });
			} catch (error) {
				console.error('Failed to archive article:', error);
				return createErrorResponse('Failed to archive article', 500, 
					error instanceof Error ? error.message : 'Unknown error', 'admin_archive_article');
			}
		}
		
		// API-only Worker - no frontend serving
		// Default response for non-API routes
		return createErrorResponse('API endpoint not found', 404, undefined, 'default_404', {
			endpoints: [
				'POST /api/process-article',
				'GET /api/observations',
				'GET /api/observations/:slug',
				'GET /api/admin/candidates',
				'GET /api/admin/articles?status=draft|processing|ready_for_review|published|archived',
				'POST /api/admin/publish',
				'POST /api/admin/archive'
			]
		});
		} catch (error) {
			console.error('=== GLOBAL ERROR HANDLER ===');
			console.error('Stage:', currentStage);
			console.error('Error:', error);
			console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
			console.error('Message:', error instanceof Error ? error.message : 'Unknown error');
			console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
			
			// Return safe error response with CORS headers
			return createErrorResponse('Internal server error', 500, 
				error instanceof Error ? error.message : 'Unknown error occurred', currentStage);
		}
	}
};
