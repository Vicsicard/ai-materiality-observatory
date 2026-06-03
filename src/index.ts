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
			const { initializeDatabase, getDatabase } = await import('@/lib/db/client');
			initializeDatabase(env);
			
			// Route to appropriate API handler
			if (url.pathname === '/api/process-article' && request.method === 'POST') {
				try {
					const { ArticleExtractor } = await import('@/lib/article-extractor');
					const { CrewAIPipeline } = await import('@/lib/pipeline/crewai-pipeline');
					const { DatabaseService } = await import('@/lib/db/database');
					
					const body = await request.json() as { url: string };
					
					if (!body.url) {
						return new Response(JSON.stringify({ error: 'URL required' }), { 
							status: 400,
							headers: corsHeaders
						});
					}
					
					// Extract article
					const extractor = new ArticleExtractor();
					let extractedArticle;
					
					try {
						console.log('PIPELINE STAGE: Extraction - START');
						extractedArticle = await extractor.extractFromUrl(body.url);
						console.log('PIPELINE STAGE: Extraction - SUCCESS');
						
						// Debug logging
						console.log('=== Article Extraction Debug ===');
						console.log('Extracted title:', extractedArticle.title);
						console.log('Source name:', extractedArticle.siteName);
						console.log('Extracted content length:', extractedArticle.content.length);
						console.log('First 500 chars:', extractedArticle.content.substring(0, 500));
						
						// Quality gate
						const qualityGate = validateExtractionQuality(extractedArticle.content);
						console.log('Extraction quality gate passed:', qualityGate.passed);
						if (!qualityGate.passed) {
							return new Response(JSON.stringify({ 
								error: qualityGate.reason 
							}), { 
								status: 400,
								headers: corsHeaders
							});
						}
						
					} catch (extractionError) {
						console.log('PIPELINE STAGE: Extraction - FAIL');
						console.error('Extraction failed:', extractionError);
						console.error('Stack trace:', extractionError instanceof Error ? extractionError.stack : 'No stack trace available');
						return new Response(JSON.stringify({ 
							error: extractionError instanceof Error ? extractionError.message : 'Article extraction failed' 
						}), { 
							status: 400,
							headers: corsHeaders
						});
					}
					
					// Run pipeline
					console.log('PIPELINE STAGE: Pipeline - START');
					try {
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
						try {
							const db = new DatabaseService(env.DB);
							
							// Check for duplicate URL
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
								
								return new Response(JSON.stringify({
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
								}), { status: 200, headers: { 'Content-Type': 'application/json' } });
							}
							
							// Create event
							const event = await db.createEvent({
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
							
							// Create article with draft status
							const articleStatus = result.approved ? 'published' : 'needs_editorial_review';
							await db.createArticle({
								event_id: event.id,
								title: result.headline,
								slug,
								content: result.article,
								status: articleStatus
							});
							
							console.log('PIPELINE STAGE: D1 Insert - SUCCESS');
							
							return new Response(JSON.stringify({
								...result,
								articleId: event.id,
								slug,
								persisted: true
							}), { 
								headers: { 
									'Content-Type': 'application/json',
									...corsHeaders
								} 
							});
						} catch (dbError) {
							console.log('PIPELINE STAGE: D1 Insert - FAIL');
							console.error('D1 insertion failed:', dbError);
							console.error('Stack trace:', dbError instanceof Error ? dbError.stack : 'No stack trace available');
							return new Response(JSON.stringify({ 
								error: 'Database insertion failed',
								details: dbError instanceof Error ? dbError.message : 'Unknown database error'
							}), { 
								status: 500,
								headers: corsHeaders
							});
						}
					}
					
					// Always include the generated article in response for debugging
					// The pipeline already includes the article when validation fails, so just return the full result
					return new Response(JSON.stringify(result), { 
								headers: { 
									'Content-Type': 'application/json',
									...corsHeaders
								} 
							});
					} catch (pipelineError) {
						console.log('PIPELINE STAGE: Pipeline - FAIL');
						console.error('Pipeline failed:', pipelineError);
						console.error('Stack trace:', pipelineError instanceof Error ? pipelineError.stack : 'No stack trace available');
						return new Response(JSON.stringify({ 
							error: 'Pipeline processing failed',
							details: pipelineError instanceof Error ? pipelineError.message : 'Unknown pipeline error'
						}), { 
							status: 500,
							headers: corsHeaders
						});
					}
				} catch (error) {
					console.error('API error:', error);
					console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
					return new Response(JSON.stringify({ error: 'Processing failed' }), { 
				status: 500,
				headers: corsHeaders
			});
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
				
				return new Response(JSON.stringify(articles), { 
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					} 
				});
			} catch (error) {
				console.error('Failed to fetch admin articles:', error);
				return new Response(JSON.stringify({ error: 'Failed to fetch admin articles' }), { 
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				});
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
				
				return new Response(JSON.stringify({ success: true, articleId }), { 
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					} 
				});
			} catch (error) {
				console.error('Failed to publish article:', error);
				return new Response(JSON.stringify({ error: 'Failed to publish article' }), { 
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				});
			}
		}
		
		// DELETE /api/admin/articles/:id - DISABLED - DATA LOSS PREVENTION
		// DELETE FUNCTIONALITY REMOVED TO PREVENT ACCIDENTAL DATA LOSS
		// Article ID 1 was deleted during testing - DO NOT RE-ENABLE DELETE
		// Use archive functionality instead
		console.log('[ADMIN_DELETE] Delete endpoint disabled for data protection');
		
		// GET /api/observations - List all observations
		if (url.pathname === '/api/observations' && request.method === 'GET') {
			try {
				const { DatabaseService } = await import('@/lib/db/database');
				const db = new DatabaseService(env.DB);
				
				const observations = await db.getObservations();
				
				return new Response(JSON.stringify(observations), { 
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					} 
				});
			} catch (error) {
				console.error('Failed to fetch observations:', error);
				return new Response(JSON.stringify({ error: 'Failed to fetch observations' }), { 
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				});
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
					return new Response(JSON.stringify({ error: 'Observation not found' }), { 
						status: 404,
						headers: { 
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
				
				return new Response(JSON.stringify(observation), { 
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					} 
				});
			} catch (error) {
				console.error('Failed to fetch observation:', error);
				return new Response(JSON.stringify({ error: 'Failed to fetch observation' }), { 
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				});
			}
		}
		}
		
		// API-only Worker - no frontend serving
		// Default response for non-API routes
		return new Response(JSON.stringify({ 
			error: 'API endpoint not found',
			endpoints: [
				'POST /api/process-article',
				'GET /api/observations',
				'GET /api/observations/:slug'
			]
		}), { 
			status: 404, 
			headers: { 
				'Content-Type': 'application/json',
				...corsHeaders
			} 
		});
	}
};
