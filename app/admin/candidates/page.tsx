/**
 * AMO V3 Candidate Queue Admin Interface
 * 
 * Features:
 * - Candidate listing with filtering
 * - Individual candidate actions
 * - Batch operations
 * - Real-time status updates
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Check, 
  X, 
  Play, 
  RefreshCw, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText
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

interface QueueStats {
  new: number;
  screened: number;
  approved: number;
  rejected: number;
  processed: number;
}

export default function CandidateQueuePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<QueueStats>({ new: 0, screened: 0, approved: 0, rejected: 0, processed: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, [selectedStatus, searchTerm]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: selectedStatus,
        limit: '50',
        offset: '0'
      });

      const response = await fetch(`/api/admin/candidates?${params}`);
      const data = await response.json();

      if (data.success) {
        setCandidates(data.data.candidates);
        setStats(data.data.counts);
      } else {
        console.error('Failed to fetch candidates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateAction = async (candidateId: number, action: string) => {
    setActionLoading(candidateId);
    try {
      const response = await fetch(`/api/admin/candidates?id=${candidateId}&action=${action}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh candidates list
        fetchCandidates();
        
        // Show success message
        console.log(`Action ${action} completed:`, data.data.message);
      } else {
        console.error('Action failed:', data.error);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-gray-100 text-gray-800',
      screened: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processed: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score === 0) return <Badge variant="outline">Not Screened</Badge>;
    
    let variant = 'bg-red-100 text-red-800';
    if (score >= 80) variant = 'bg-green-100 text-green-800';
    else if (score >= 60) variant = 'bg-yellow-100 text-yellow-800';
    else if (score >= 40) variant = 'bg-orange-100 text-orange-800';

    return <Badge className={variant}>{score}/100</Badge>;
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.source_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CandidateRow = ({ candidate }: { candidate: Candidate }) => (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{candidate.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{candidate.source_name}</span>
            <span>•</span>
            <span>{new Date(candidate.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(candidate.status)}
          {getScoreBadge(candidate.relevance_score)}
        </div>
      </div>

      {candidate.screener_reason && (
        <p className="text-sm text-gray-700 mb-2">{candidate.screener_reason}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {candidate.recommended_dimensions && candidate.recommended_dimensions.length > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{candidate.recommended_dimensions.length} dimensions</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(candidate.published_at || candidate.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <CandidateDetail candidate={candidate} />
            </DialogContent>
          </Dialog>

          {candidate.status === 'new' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCandidateAction(candidate.id, 'screen')}
              disabled={actionLoading === candidate.id}
            >
              {actionLoading === candidate.id ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1" />
              )}
              Screen
            </Button>
          )}

          {candidate.status === 'screened' && candidate.relevance_score >= 80 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCandidateAction(candidate.id, 'approve')}
              disabled={actionLoading === candidate.id}
            >
              {actionLoading === candidate.id ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Approve
            </Button>
          )}

          {candidate.status === 'screened' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCandidateAction(candidate.id, 'reject')}
              disabled={actionLoading === candidate.id}
            >
              {actionLoading === candidate.id ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-1" />
              )}
              Reject
            </Button>
          )}

          {candidate.status === 'approved' && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleCandidateAction(candidate.id, 'process')}
              disabled={actionLoading === candidate.id}
            >
              {actionLoading === candidate.id ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Process AMO
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const CandidateDetail = ({ candidate }: { candidate: Candidate }) => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {getStatusBadge(candidate.status)}
          {getScoreBadge(candidate.relevance_score)}
          {candidate.title}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="font-semibold">Source</Label>
          <p>{candidate.source_name}</p>
        </div>
        <div>
          <Label className="font-semibold">Published</Label>
          <p>{new Date(candidate.published_at || candidate.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <Label className="font-semibold">URL</Label>
          <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {candidate.url}
          </a>
        </div>
        <div>
          <Label className="font-semibold">Created</Label>
          <p>{new Date(candidate.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {candidate.summary && (
        <div>
          <Label className="font-semibold">Summary</Label>
          <p className="text-gray-700">{candidate.summary}</p>
        </div>
      )}

      {candidate.screener_reason && (
        <div>
          <Label className="font-semibold">Screening Reason</Label>
          <p className="text-gray-700">{candidate.screener_reason}</p>
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

      <div className="flex justify-end gap-2 pt-4 border-t">
        {candidate.status === 'new' && (
          <Button onClick={() => handleCandidateAction(candidate.id, 'screen')}>
            Screen Candidate
          </Button>
        )}
        {candidate.status === 'screened' && (
          <>
            <Button variant="outline" onClick={() => handleCandidateAction(candidate.id, 'reject')}>
              Reject
            </Button>
            <Button onClick={() => handleCandidateAction(candidate.id, 'approve')}>
              Approve
            </Button>
          </>
        )}
        {candidate.status === 'approved' && (
          <Button onClick={() => handleCandidateAction(candidate.id, 'process')}>
            Process Through AMO
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Candidate Queue</h1>
        <p className="text-gray-600">Review and manage RSS-sourced article candidates for AMO processing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-gray-600">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.screened}</p>
                <p className="text-sm text-gray-600">Screened</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.processed}</p>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Label>Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="screened">Screened</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Label>Search:</Label>
              <Input
                placeholder="Search by title or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Button variant="outline" onClick={fetchCandidates} disabled={loading}>
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidate List */}
      <Card>
        <CardHeader>
          <CardTitle>Candidates ({filteredCandidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No candidates found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map(candidate => (
                <CandidateRow key={candidate.id} candidate={candidate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
