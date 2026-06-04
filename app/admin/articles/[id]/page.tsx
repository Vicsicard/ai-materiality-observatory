'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Check, 
  FileText,
  ExternalLink,
  Eye,
  Edit
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  signal_type: string;
  created_at: string;
  updated_at: string;
  source_url: string;
  event_id?: number;
  executive_observation?: string;
  why_this_matters?: string;
  organizational_relevance?: string[];
  related_dimensions?: string[];
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/articles/${articleId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load article');
      }

      setArticle(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      loadArticleData();
    }
  }, [articleId]);

  const publishArticle = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // Reload article data
        await loadArticleData();
      } else {
        setError(data.error || 'Failed to publish article');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish article');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSignalTypeBadge = (signalType: string) => {
    const variants = {
      'AI Visibility': 'bg-blue-100 text-blue-800',
      'Operational Dependency': 'bg-orange-100 text-orange-800',
      'Governance Pressure': 'bg-purple-100 text-purple-800',
      'Resource Readiness': 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={variants[signalType as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {signalType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-red-800">
              <h3 className="font-semibold mb-2">Error Loading Article</h3>
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Article not found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Article Review</h1>
            <p className="text-gray-600">ID: {article.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(article.status)}
          {getSignalTypeBadge(article.signal_type)}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="p-4">
            <div className="text-red-800">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Article Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">Generated Headline</Label>
            <p className="text-gray-900 mt-1 text-lg">{article.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Article Status</Label>
              <div className="mt-1">{getStatusBadge(article.status)}</div>
            </div>
            <div>
              <Label className="font-semibold">Signal Type</Label>
              <div className="mt-1">{getSignalTypeBadge(article.signal_type)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Created</Label>
              <p className="text-gray-700">{new Date(article.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="font-semibold">Last Updated</Label>
              <p className="text-gray-700">{new Date(article.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label className="font-semibold">Source URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <a 
                href={article.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {article.source_url}
              </a>
            </div>
          </div>

          <div>
            <Label className="font-semibold">Article Slug</Label>
            <p className="text-gray-700 font-mono text-sm bg-gray-50 p-2 rounded">
              {article.slug}
            </p>
          </div>

          {article.executive_observation && (
            <div>
              <Label className="font-semibold">Executive Observation</Label>
              <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{article.executive_observation}</p>
            </div>
          )}

          {article.why_this_matters && (
            <div>
              <Label className="font-semibold">Why This Matters</Label>
              <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{article.why_this_matters}</p>
            </div>
          )}

          {article.organizational_relevance && article.organizational_relevance.length > 0 && (
            <div>
              <Label className="font-semibold">Organizational Relevance</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {article.organizational_relevance.map((item, index) => (
                  <Badge key={index} variant="outline">{item}</Badge>
                ))}
              </div>
            </div>
          )}

          {article.related_dimensions && article.related_dimensions.length > 0 && (
            <div>
              <Label className="font-semibold">Related Dimensions</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {article.related_dimensions.map((dimension, index) => (
                  <Badge key={index} variant="secondary">{dimension}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Article Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Generated Article Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded max-h-96 overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{article.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {article.status === 'draft' && (
              <Button 
                onClick={publishArticle}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Publish Article
              </Button>
            )}

            {article.status === 'published' && (
              <a 
                href={`/observations/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Published Article
              </a>
            )}

            <Button 
              variant="outline"
              onClick={() => router.push('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
