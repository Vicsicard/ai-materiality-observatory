import { NextRequest, NextResponse } from 'next/server';
import { ArticleExtractor } from '@/lib/article-extractor';
import { CrewAIPipeline, PipelineInput } from '@/lib/pipeline/crewai-pipeline';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Extract article
    const extractor = new ArticleExtractor();
    const extractedArticle = await extractor.extractFromUrl(url);

    // Step 2: Run CrewAI pipeline
    const pipeline = new CrewAIPipeline();
    
    const pipelineInput: PipelineInput = {
      articleText: extractedArticle.content,
      sourceName: extractedArticle.siteName || 'Unknown Source',
      sourceUrl: url,
      publishedDate: extractedArticle.publishedDate
    };

    const result = await pipeline.process(pipelineInput);

    // Step 3: Store in database if approved
    if (result.approved && result.article && result.headline && result.signalType) {
      try {
        // Get D1 binding from Cloudflare environment
        // In Cloudflare Pages, the D1 binding is available through the request context
        const env = (request as any).cf?.env || process.env;
        
        if (!env.DB) {
          console.warn('D1 binding not available - article not persisted');
          return NextResponse.json({
            ...result,
            warning: 'Article processed but not persisted - D1 binding unavailable'
          });
        }

        // Import DatabaseService dynamically to avoid initialization issues
        const { DatabaseService } = await import('@/lib/db/database');
        const db = new DatabaseService(env.DB);
        
        // Check if event already exists
        const existingEvent = await db.getEventByUrl(url);
        if (existingEvent) {
          return NextResponse.json({
            ...result,
            message: 'Article already processed'
          });
        }

        // Create event
        const event = await db.createEvent({
          source_name: extractedArticle.siteName || 'Unknown Source',
          source_url: url,
          headline: result.headline,
          published_date: extractedArticle.publishedDate,
          article_text: extractedArticle.content
        });

        // Create signal
        await db.createSignal({
          event_id: event.id,
          signal_type: result.signalType,
          signal_reason: `Classified as ${result.signalType} based on content analysis`
        });

        // Generate slug from title
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

        console.log('Article stored successfully:', {
          eventId: event.id,
          title: result.headline,
          signalType: result.signalType,
          slug
        });

        return NextResponse.json({
          ...result,
          articleId: event.id,
          slug,
          persisted: true
        });

      } catch (dbError) {
        console.error('Database storage error:', dbError);
        return NextResponse.json(
          { 
            error: 'Failed to store article in database',
            details: dbError instanceof Error ? dbError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
