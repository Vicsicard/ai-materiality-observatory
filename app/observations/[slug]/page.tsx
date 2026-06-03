import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  signal_type: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  // TODO: Implement real D1 database retrieval
  // For now, return null to show 404
  return null;
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
