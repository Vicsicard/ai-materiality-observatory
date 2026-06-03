'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  source_url: string;
  signal_type: string;
}

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://ai-materiality-observatory.vic-76c.workers.dev/api/process-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to process article');
      }

      const data = await response.json();
      
      if (data.status === 'already_exists') {
        setResult(`Article already exists! Event ID: ${data.eventId}, Article ID: ${data.articleId}`);
      } else if (data.persisted || data.articleId) {
        const statusText = data.approved ? 'published' : 'saved for review';
        setResult(`✓ Observation Created Successfully\n\nTitle: ${data.headline}\nArticle ID: ${data.articleId}\nStatus: ${statusText}\nSlug: ${data.slug}`);
        // Refresh articles list after successful creation
        fetchArticles();
      } else {
        setError(`Article not approved: ${data.validationReasons?.join(', ') || 'Unknown reason'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchArticles = async () => {
    console.log('[ADMIN_DASHBOARD_FETCH] requesting articles');
    setIsLoadingArticles(true);
    try {
      const response = await fetch('https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles');
      console.log('[ADMIN_DASHBOARD_FETCH] response status:', response.status);
      const data = await response.json();
      console.log('[ADMIN_DASHBOARD_FETCH] response data:', data);
      setArticles(data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const publishArticle = async (articleId: number) => {
    try {
      const response = await fetch(`https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/${articleId}/publish`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchArticles(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to publish article:', err);
    }
  };

  const deleteArticle = async (articleId: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        const response = await fetch(`https://ai-materiality-observatory.vic-76c.workers.dev/api/admin/articles/${articleId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchArticles(); // Refresh list
        }
      } catch (err) {
        console.error('Failed to delete article:', err);
      }
    }
  };

  // Load articles on component mount
  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin - Submit Article</h1>
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Observatory
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Article URL</h2>
          <p className="text-gray-600 mb-6">
            Submit an article URL to extract content, run it through the AI pipeline, and publish an observatory brief.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Article URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/article"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !url}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Process Article'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{result}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Generated Observations Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">GENERATED OBSERVATIONS</h2>
          <p className="text-gray-600 mb-6">
            All stored observations, including drafts and published articles.
          </p>

          {isLoadingArticles ? (
            <p className="text-gray-500">Loading articles...</p>
          ) : articles.length === 0 ? (
            <p className="text-gray-500">No articles found.</p>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{article.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium">{article.status || 'draft'}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(article.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Slug: <span className="font-mono text-xs">{article.slug}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Source: {new URL(article.source_url).hostname}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <a
                        href={`/observations/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                      {article.status !== 'published' && (
                        <button
                          onClick={() => publishArticle(article.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
