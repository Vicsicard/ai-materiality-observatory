import Link from 'next/link';
import { notFound } from 'next/navigation';

console.log('[OBSERVATION_PAGE] PAGE LOADED - ROUTE REACHED');

interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  signal_type: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  console.log('[OBSERVATION_PAGE] slug received:', slug);
  console.log('[OBSERVATION_PAGE] API request: /api/observations/' + slug);
  
  try {
    // Fetch article from local API route (which forwards to Cloudflare Worker)
    const response = await fetch(`/api/observations/${slug}`, {
      cache: 'no-store' // Ensure fresh data
    });
    
    console.log('[OBSERVATION_PAGE] response status:', response.status);
    console.log('[OBSERVATION_PAGE] response ok:', response.ok);
    
    if (!response.ok) {
      console.log('[OBSERVATION_PAGE] observation not found condition triggered');
      return null;
    }
    
    const article = await response.json();
    console.log('[OBSERVATION_PAGE] observation returned:', article ? 'YES' : 'NO');
    console.log('[OBSERVATION_PAGE] article ID:', article?.id);
    
    return article;
  } catch (error) {
    console.error('[OBSERVATION_PAGE] fetch error:', error);
    return null;
  }
}

export default async function ObservationPage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Observatory
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
        </article>
      </main>
    </div>
  );
}
