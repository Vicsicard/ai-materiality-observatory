'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/process-article', {
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
      
      if (data.approved) {
        setResult(`Article processed and published successfully! Signal type: ${data.signalType}`);
      } else {
        setError(`Article not approved: ${data.validationReasons?.join(', ') || 'Unknown reason'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline Process</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Article extraction from URL</li>
            <li>2. Signal detection and analysis</li>
            <li>3. Materiality qualification</li>
            <li>4. Signal classification</li>
            <li>5. Organizational relevance assessment</li>
            <li>6. Observatory brief generation</li>
            <li>7. Editorial validation</li>
            <li>8. Database storage and publication</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
