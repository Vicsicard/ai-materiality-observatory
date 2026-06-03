interface Env {
	DB: any;
}

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);
		
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
						return new Response(JSON.stringify({ error: 'URL required' }), { status: 400 });
					}
					
					// Extract article
					const extractor = new ArticleExtractor();
					const extractedArticle = await extractor.extractFromUrl(body.url);
					
					// Run pipeline
					const pipeline = new CrewAIPipeline();
					const result = await pipeline.process({
						articleText: extractedArticle.content,
						sourceName: extractedArticle.siteName || 'Unknown Source',
						sourceUrl: body.url,
						publishedDate: extractedArticle.publishedDate
					});
					
					// Store in D1 if approved
					if (result.approved && result.article && result.headline && result.signalType) {
						const db = new DatabaseService(env.DB);
						
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
						
						// Create article
						await db.createArticle({
							event_id: event.id,
							title: result.headline,
							slug,
							content: result.article,
							status: 'published'
						});
						
						return new Response(JSON.stringify({
							...result,
							articleId: event.id,
							slug,
							persisted: true
						}), { headers: { 'Content-Type': 'application/json' } });
					}
					
					return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
				} catch (error) {
					console.error('API error:', error);
					return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 });
				}
			}
		}
		
		// Default response
		return new Response('Cloudflare Worker with D1 binding ready', { status: 200 });
	},
};
