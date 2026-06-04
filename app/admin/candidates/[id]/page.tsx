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
  X, 
  Play, 
  AlertCircle,
  FileText,
  ExternalLink,
  Target
} from 'lucide-react';

interface Candidate {
  id: number;
  title: string;
  url: string;
  source_name: string;
  status: 'new' | 'screened' | 'approved' | 'rejected' | 'processed';
  relevance_score: number;
  screener_reason?: string;
  recommended_dimensions?: string[];
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  summary?: string;
  published_at?: string;
  rss_source_name?: string;
}

interface RSSArticle {
  id: number;
  title: string;
  content: string;
  summary?: string;
  url: string;
  source_name: string;
  published_date: string;
  created_at: string;
}

interface AMOArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  signal_type: string;
  created_at: string;
  executive_observation?: string;
  why_this_matters?: string;
  organizational_relevance?: string[];
  related_dimensions?: string[];
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [rssArticle, setRSSArticle] = useState<RSSArticle | null>(null);
  const [amoArticle, setAMOArticle] = useState<AMOArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidateData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load candidate details
      const candidateResponse = await fetch(`/api/admin/candidates/${candidateId}`);
      const candidateData = await candidateResponse.json();

      if (!candidateData.success) {
        throw new Error(candidateData.error || 'Failed to load candidate');
      }

      setCandidate(candidateData.data);

      // Load RSS article if candidate has rss_article_id
      if (candidateData.data.rss_article_id) {
        const rssResponse = await fetch(`/api/admin/rss-articles/${candidateData.data.rss_article_id}`);
        const rssData = await rssResponse.json();

        if (rssData.success) {
          setRSSArticle(rssData.data);
        }
      }

      // Load AMO article if one exists
      if (candidateData.data.amo_article_id) {
        const amoResponse = await fetch(`/api/admin/articles/${candidateData.data.amo_article_id}`);
        const amoData = await amoResponse.json();

        if (amoData.success) {
          setAMOArticle(amoData.data);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidate data');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateAction = async (action: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload candidate data
        await loadCandidateData();
        
        // If processed and AMO article created, load it
        if (action === 'process' && data.amo_article_id) {
          const amoResponse = await fetch(`/api/admin/articles/${data.amo_article_id}`);
          const amoData = await amoResponse.json();

          if (amoData.success) {
            setAMOArticle(amoData.data);
          }
        }
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      loadCandidateData();
    }
  }, [candidateId]);

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-gray-100 text-gray-800',
      screened: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processed: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800">{score}%</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">{score}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{score}%</Badge>;
    }
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
              <h3 className="font-semibold mb-2">Error Loading Candidate</h3>
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/admin/candidates')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Candidates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Candidate not found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/admin/candidates')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Candidates
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
            onClick={() => router.push('/admin/candidates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Candidate Review</h1>
            <p className="text-gray-600">ID: {candidate.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(candidate.status)}
          {getScoreBadge(candidate.relevance_score)}
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

      {/* Candidate Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Candidate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">Original Headline</Label>
            <p className="text-gray-900 mt-1">{candidate.title}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Source Name</Label>
              <p className="text-gray-700">{candidate.source_name}</p>
            </div>
            <div>
              <Label className="font-semibold">RSS Source</Label>
              <p className="text-gray-700">{candidate.rss_source_name || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Publication Date</Label>
              <p className="text-gray-700">
                {new Date(candidate.published_at || candidate.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="font-semibold">Candidate Created</Label>
              <p className="text-gray-700">
                {new Date(candidate.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <Label className="font-semibold">Source URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <a 
                href={candidate.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {candidate.url}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Candidate Status</Label>
              <div className="mt-1">{getStatusBadge(candidate.status)}</div>
            </div>
            <div>
              <Label className="font-semibold">Relevance Score</Label>
              <div className="mt-1">{getScoreBadge(candidate.relevance_score)}</div>
            </div>
          </div>

          {candidate.screener_reason && (
            <div>
              <Label className="font-semibold">Screener Reason</Label>
              <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{candidate.screener_reason}</p>
            </div>
          )}

          {candidate.recommended_dimensions && candidate.recommended_dimensions.length > 0 && (
            <div>
              <Label className="font-semibold">Recommended Dimensions</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {candidate.recommended_dimensions.map((dimension, index) => (
                  <Badge key={index} variant="secondary">{dimension}</Badge>
                ))}
              </div>
            </div>
          )}

          {candidate.summary && (
            <div>
              <Label className="font-semibold">Summary</Label>
              <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{candidate.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSS Article Content */}
      {rssArticle ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              RSS Article Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-semibold">Article Title</Label>
              <p className="text-gray-900 mt-1">{rssArticle.title}</p>
            </div>

            {rssArticle.summary && (
              <div>
                <Label className="font-semibold">Article Summary</Label>
                <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{rssArticle.summary}</p>
              </div>
            )}

            <div>
              <Label className="font-semibold">Full Article Content</Label>
              <div className="mt-1 bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{rssArticle.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-yellow-200">
          <CardContent className="p-6">
            <div className="text-yellow-800">
              <FileText className="w-5 h-5 mb-2" />
              <p className="font-semibold">No RSS Article Found</p>
              <p className="text-sm">The associated RSS article could not be loaded.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AMO Article Content */}
      {amoArticle ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated AMO Article
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Generated Headline</Label>
                <p className="text-gray-900 mt-1">{amoArticle.title}</p>
              </div>
              <div>
                <Label className="font-semibold">Signal Type</Label>
                <Badge className="mt-1">{amoArticle.signal_type}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Article Status</Label>
                <div className="mt-1">{getStatusBadge(amoArticle.status)}</div>
              </div>
              <div>
                <Label className="font-semibold">Created</Label>
                <p className="text-gray-700">{new Date(amoArticle.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {amoArticle.executive_observation && (
              <div>
                <Label className="font-semibold">Executive Observation</Label>
                <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{amoArticle.executive_observation}</p>
              </div>
            )}

            {amoArticle.why_this_matters && (
              <div>
                <Label className="font-semibold">Why This Matters</Label>
                <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded">{amoArticle.why_this_matters}</p>
              </div>
            )}

            {amoArticle.organizational_relevance && amoArticle.organizational_relevance.length > 0 && (
              <div>
                <Label className="font-semibold">Organizational Relevance</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {amoArticle.organizational_relevance.map((item, index) => (
                    <Badge key={index} variant="outline">{item}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="font-semibold">Generated Article Content</Label>
              <div className="mt-1 bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{amoArticle.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-gray-200">
          <CardContent className="p-6">
            <div className="text-gray-500">
              <FileText className="w-5 h-5 mb-2" />
              <p className="font-semibold">No AMO Article Generated</p>
              <p className="text-sm">An AMO article has not been created for this candidate yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editorial Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Editorial Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {candidate.status === 'new' && (
              <Button 
                onClick={() => handleCandidateAction('screen')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Screen Candidate
              </Button>
            )}

            {candidate.status === 'screened' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleCandidateAction('reject')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></div>
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleCandidateAction('approve')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}

            {candidate.status === 'approved' && (
              <Button 
                onClick={() => handleCandidateAction('process')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Process AMO
              </Button>
            )}

            {amoArticle && amoArticle.status === 'draft' && (
              <Button 
                variant="default"
                onClick={() => window.open(`/observations/${amoArticle.slug}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Article
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
