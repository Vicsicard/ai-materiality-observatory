/**
 * AMO V3 Candidate Screener
 * 
 * Purpose: Determine whether an article supports the AMO mission
 * Mission: Visibility → Materiality → Assessment
 * 
 * Approval Threshold: 80+
 */

export interface ScreeningResult {
  relevance_score: number;
  decision: 'approve' | 'reject';
  primary_reason: string;
  relevant_dimensions: string[];
  evidence: string[];
}

export interface CandidateArticle {
  id: number;
  title: string;
  url: string;
  source_name: string;
  summary?: string;
  content?: string;
}

export class AMOCandidateScreener {
  private readonly APPROVAL_THRESHOLD = 80;
  private readonly MATERIALITY_DIMENSIONS = [
    'AI Visibility',
    'Resource Readiness', 
    'Operational Dependency',
    'Governance Pressure',
    'Reporting Pressure',
    'Infrastructure Readiness',
    'Sustainability Impact'
  ];
  
  async screenCandidate(candidate: CandidateArticle): Promise<ScreeningResult> {
    console.log(`🔍 Screening candidate: ${candidate.title}`);
    
    // Build screening prompt
    const prompt = this.buildScreeningPrompt(candidate);
    
    // For now, implement rule-based screening
    // In production, this would call an AI service
    const result = await this.performRuleBasedScreening(candidate);
    
    console.log(`✅ Screening complete: ${result.decision} (${result.relevance_score}/100)`);
    
    return result;
  }
  
  private buildScreeningPrompt(candidate: CandidateArticle): string {
    return `You are the AI Materiality Observatory Candidate Screener.

Your task is NOT to summarize the article.

Your task is to determine whether the article provides meaningful evidence that AI is becoming operationally significant for organizations.

The Observatory focuses on:

* AI Visibility
* Resource Readiness
* Operational Dependency
* Governance Pressure
* Reporting Pressure
* Infrastructure Readiness
* Sustainability Impact

Examples of HIGH RELEVANCE:

* Enterprise AI adoption
* AI spending
* AI resource planning
* AI infrastructure expansion
* Datacenter growth
* Governance requirements
* Reporting obligations
* AI dependency
* Organizational AI usage
* Surveys showing AI adoption

Examples of LOW RELEVANCE:

* Consumer AI features
* Prompt engineering tips
* AI entertainment
* Personal productivity hacks
* Product reviews
* Hobbyist content

Article Title: ${candidate.title}
Source: ${candidate.source_name}
URL: ${candidate.url}
${candidate.summary ? `Summary: ${candidate.summary}` : ''}
${candidate.content ? `Content: ${candidate.content.slice(0, 2000)}...` : ''}

Return JSON:
{
  "relevance_score": 0,
  "decision": "approve",
  "primary_reason": "",
  "relevant_dimensions": [],
  "evidence": []
}

Approval Threshold: 80+
Only approve articles that clearly support the Observatory mission.`;
  }
  
  private async performRuleBasedScreening(candidate: CandidateArticle): Promise<ScreeningResult> {
    const text = `${candidate.title} ${candidate.summary || ''} ${candidate.content || ''}`.toLowerCase();
    
    let score = 0;
    const evidence: string[] = [];
    const relevantDimensions: string[] = [];
    let primaryReason = '';
    
    // High relevance indicators (+20 points each)
    const highRelevancePatterns = [
      { pattern: /enterprise|business|organization|company|corporate/g, dimension: 'Operational Dependency', reason: 'Enterprise context' },
      { pattern: /spending|budget|cost|investment|funding|financial/g, dimension: 'Resource Readiness', reason: 'Financial impact' },
      { pattern: /infrastructure|datacenter|server|computing|hardware/g, dimension: 'Infrastructure Readiness', reason: 'Infrastructure requirements' },
      { pattern: /governance|regulation|compliance|policy|oversight/g, dimension: 'Governance Pressure', reason: 'Governance implications' },
      { pattern: /reporting|disclosure|transparency|stakeholder/g, dimension: 'Reporting Pressure', reason: 'Reporting requirements' },
      { pattern: /survey|study|research|adoption|implementation/g, dimension: 'AI Visibility', reason: 'Adoption evidence' },
      { pattern: /dependency|reliant|critical|essential|required/g, dimension: 'Operational Dependency', reason: 'Operational dependency' },
      { pattern: /energy|power|sustainability|environmental|emission/g, dimension: 'Sustainability Impact', reason: 'Environmental impact' }
    ];
    
    // Medium relevance indicators (+10 points each)
    const mediumRelevancePatterns = [
      { pattern: /ai adoption|ai implementation|ai deployment/g, dimension: 'AI Visibility', reason: 'AI adoption' },
      { pattern: /ai strategy|ai planning|ai roadmap/g, dimension: 'Resource Readiness', reason: 'Strategic planning' },
      { pattern: /ai governance|ai policy|ai framework/g, dimension: 'Governance Pressure', reason: 'Governance planning' },
      { pattern: /ai cost|ai expense|ai investment/g, dimension: 'Resource Readiness', reason: 'Cost considerations' }
    ];
    
    // Low relevance indicators (-10 points each)
    const lowRelevancePatterns = [
      { pattern: /consumer|personal|individual|user|customer/g, reason: 'Consumer focus' },
      { pattern: /prompt|chatbot|assistant|tool|app/g, reason: 'Tool/utility focus' },
      { pattern: /tutorial|guide|how to|tips|tricks/g, reason: 'Tutorial content' },
      { pattern: /review|rating|comparison|best|top/g, reason: 'Review content' },
      { pattern: /entertainment|fun|creative|art|music/g, reason: 'Entertainment focus' }
    ];
    
    // Score high relevance patterns
    for (const { pattern, dimension, reason } of highRelevancePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        score += 20;
        if (!relevantDimensions.includes(dimension)) {
          relevantDimensions.push(dimension);
        }
        evidence.push(`High relevance: ${reason} (${matches.length} occurrences)`);
        if (!primaryReason) primaryReason = reason;
      }
    }
    
    // Score medium relevance patterns
    for (const { pattern, dimension, reason } of mediumRelevancePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        score += 10;
        if (!relevantDimensions.includes(dimension)) {
          relevantDimensions.push(dimension);
        }
        evidence.push(`Medium relevance: ${reason} (${matches.length} occurrences)`);
        if (!primaryReason) primaryReason = reason;
      }
    }
    
    // Penalize low relevance patterns
    for (const { pattern, reason } of lowRelevancePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) { // Only penalize if significant
        score -= 10;
        evidence.push(`Low relevance penalty: ${reason} (${matches.length} occurrences)`);
      }
    }
    
    // Additional scoring factors
    if (text.includes('survey') && text.includes('%')) {
      score += 15;
      evidence.push('Survey data with percentages');
    }
    
    if (text.includes('$') || text.includes('million') || text.includes('billion')) {
      score += 15;
      evidence.push('Financial metrics present');
    }
    
    if (text.match(/\d{4}/) && (text.includes('growth') || text.includes('increase'))) {
      score += 10;
      evidence.push('Quantitative growth indicators');
    }
    
    // Source quality bonus
    const sourceBonus = this.getSourceQualityBonus(candidate.source_name);
    score += sourceBonus;
    if (sourceBonus > 0) {
      evidence.push(`Source quality bonus: ${candidate.source_name}`);
    }
    
    // Cap score at 100
    score = Math.min(Math.max(score, 0), 100);
    
    // Determine decision
    const decision = score >= this.APPROVAL_THRESHOLD ? 'approve' : 'reject';
    
    // Set primary reason if not determined
    if (!primaryReason) {
      primaryReason = decision === 'approve' ? 'Meets materiality criteria' : 'Below relevance threshold';
    }
    
    return {
      relevance_score: score,
      decision,
      primary_reason: primaryReason,
      relevant_dimensions: relevantDimensions,
      evidence: evidence.slice(0, 5) // Limit to top 5 evidence items
    };
  }
  
  private getSourceQualityBonus(sourceName: string): number {
    const highQualitySources = [
      'mckinsey', 'deloitte', 'pwc', 'gartner', 'forrester',
      'sec', 'nist', 'europa.eu', 'whitehouse.gov',
      'openai', 'anthropic', 'microsoft', 'aws', 'nvidia',
      'technologyreview', 'venturebeat', 'techcrunch'
    ];
    
    const mediumQualitySources = [
      'forbes', 'wsj', 'ft.com', 'hbr.org', 'reuters'
    ];
    
    const sourceLower = sourceName.toLowerCase();
    
    if (highQualitySources.some(source => sourceLower.includes(source))) {
      return 10;
    }
    
    if (mediumQualitySources.some(source => sourceLower.includes(source))) {
      return 5;
    }
    
    return 0;
  }
  
  // Batch screening for multiple candidates
  async screenBatch(candidates: CandidateArticle[]): Promise<ScreeningResult[]> {
    console.log(`🔍 Screening batch of ${candidates.length} candidates`);
    
    const results: ScreeningResult[] = [];
    
    for (const candidate of candidates) {
      try {
        const result = await this.screenCandidate(candidate);
        results.push(result);
      } catch (error) {
        console.error(`Error screening candidate ${candidate.id}:`, error);
        results.push({
          relevance_score: 0,
          decision: 'reject',
          primary_reason: 'Screening error',
          relevant_dimensions: [],
          evidence: []
        });
      }
    }
    
    const approved = results.filter(r => r.decision === 'approve').length;
    console.log(`✅ Batch screening complete: ${approved}/${candidates.length} approved`);
    
    return results;
  }
  
  // Get screening statistics
  getScreeningStats(results: ScreeningResult[]): {
    total: number;
    approved: number;
    rejected: number;
    average_score: number;
    approval_rate: number;
  } {
    const total = results.length;
    const approved = results.filter(r => r.decision === 'approve').length;
    const rejected = total - approved;
    const average_score = results.reduce((sum, r) => sum + r.relevance_score, 0) / total;
    const approval_rate = (approved / total) * 100;
    
    return {
      total,
      approved,
      rejected,
      average_score,
      approval_rate
    };
  }
}
