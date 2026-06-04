import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    console.log('[API_OBSERVATIONS_SLUG] slug received:', slug);
    
    // Forward to Cloudflare Worker API
    const response = await fetch(`https://ai-materiality-observatory.vic-76c.workers.dev/api/observations/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    console.log('[API_OBSERVATIONS_SLUG] worker response status:', response.status);

    if (!response.ok) {
      console.log('[API_OBSERVATIONS_SLUG] observation not found in worker');
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      );
    }

    const article = await response.json();
    console.log('[API_OBSERVATIONS_SLUG] article found:', article.id);
    
    return NextResponse.json(article);

  } catch (error) {
    console.error('[API_OBSERVATIONS_SLUG] Failed to fetch observation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observation' },
      { status: 500 }
    );
  }
}
