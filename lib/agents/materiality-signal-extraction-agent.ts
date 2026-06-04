import { MATERIALITY_SIGNALS, MaterialitySignal } from '../signals/materiality-signal-registry';

export interface ValidatedCandidateSignal {
  signal_type: string;
  confidence: number;
  evidence_snippets: string[];
  why_this_is_material: string;
  aidma_dimensions: string[];
}

export interface RejectedSignal {
  signal_type: string;
  rejection_reason: string;
  evidence_count: number;
}

export interface MaterialitySignalExtractionOutput {
  primary_signal: ValidatedCandidateSignal | null;
  secondary_signals: ValidatedCandidateSignal[];
  rejected_signals: RejectedSignal[];
  extraction_confidence: number;
  extraction_reasoning: string;
}

export class MaterialitySignalExtractionAgent {
  async process(
    title: string,
    sourceDomain: string,
    content: string,
    summary?: string
  ): Promise<MaterialitySignalExtractionOutput> {
    console.log('=== MATERIALLITY SIGNAL EXTRACTION ===');
    console.log('Title:', title);
    console.log('Source:', sourceDomain);
    console.log('Content length:', content.length);
    
    const allText = `${title} ${content} ${summary || ''}`.toLowerCase();
    const originalText = `${title} ${content} ${summary || ''}`;
    
    const candidateSignals: ValidatedCandidateSignal[] = [];
    const rejectedSignals: RejectedSignal[] = [];
    
    // Process each signal type
    for (const signal of Object.values(MATERIALITY_SIGNALS)) {
      const result = this.extractSignal(signal, allText, originalText);
      
      if (result && result.evidence_snippets.length > 0) {
        candidateSignals.push(result);
        console.log(`✅ ${signal.label}: ${result.confidence.toFixed(2)} confidence, ${result.evidence_snippets.length} evidence snippets`);
      } else {
        rejectedSignals.push({
          signal_type: signal.id,
          rejection_reason: 'No supporting evidence found',
          evidence_count: 0
        });
        console.log(`❌ ${signal.label}: No evidence found`);
      }
    }
    
    // Sort by confidence
    candidateSignals.sort((a, b) => b.confidence - a.confidence);
    
    // Separate primary and secondary signals
    const primary_signal = candidateSignals.length > 0 ? candidateSignals[0] : null;
    const secondary_signals = candidateSignals.slice(1);
    
    // Calculate overall extraction confidence
    const extraction_confidence = primary_signal ? primary_signal.confidence : 0;
    
    // Generate extraction reasoning
    const extraction_reasoning = this.generateExtractionReasoning(
      primary_signal,
      secondary_signals,
      rejectedSignals
    );
    
    console.log('=== SIGNAL EXTRACTION RESULTS ===');
    console.log('Primary signal:', primary_signal?.signal_type || 'None');
    console.log('Secondary signals:', secondary_signals.length);
    console.log('Rejected signals:', rejectedSignals.length);
    console.log('Overall confidence:', extraction_confidence.toFixed(2));
    
    return {
      primary_signal,
      secondary_signals,
      rejected_signals: rejectedSignals,
      extraction_confidence,
      extraction_reasoning
    };
  }
  
  private extractSignal(
    signal: MaterialitySignal,
    allText: string,
    originalText: string
  ): ValidatedCandidateSignal | null {
    const evidence_snippets: string[] = [];
    let totalScore = 0;
    let maxWeight = 0;
    
    // Check each evidence pattern
    for (const pattern of signal.evidence_patterns) {
      maxWeight += pattern.weight;
      
      try {
        const regex = new RegExp(pattern.pattern, 'gi');
        const matches = allText.match(regex);
        
        if (matches && matches.length > 0) {
          const patternScore = pattern.weight * Math.min(matches.length / 2, 1); // Cap at 1 per pattern
          totalScore += patternScore;
          
          // Extract evidence snippets
          for (const match of matches.slice(0, 3)) { // Limit to 3 snippets per pattern
            const snippet = this.extractContextSnippet(originalText, match, 150);
            if (snippet && !evidence_snippets.includes(snippet)) {
              evidence_snippets.push(snippet);
            }
          }
          
          console.log(`  Pattern "${pattern.pattern}": ${matches.length} matches, score ${patternScore.toFixed(2)}`);
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern.pattern}`, error);
      }
    }
    
    // Calculate confidence
    const confidence = maxWeight > 0 ? totalScore / maxWeight : 0;
    
    // Require minimum confidence and evidence
    if (confidence < 0.3 || evidence_snippets.length === 0) {
      return null;
    }
    
    // Determine AIDMA dimensions (those with weight > 0.5)
    const aidma_dimensions = Object.entries(signal.aidma_dimension_weights)
      .filter(([, weight]) => weight > 0.5)
      .map(([dimension]) => dimension);
    
    // Generate materiality reasoning
    const why_this_is_material = this.generateMaterialityReasoning(signal, evidence_snippets, confidence);
    
    return {
      signal_type: signal.id,
      confidence,
      evidence_snippets,
      why_this_is_material,
      aidma_dimensions
    };
  }
  
  private extractContextSnippet(text: string, match: string, contextLength: number): string {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + match.length + contextLength / 2);
    
    let snippet = text.substring(start, end).trim();
    
    // Add ellipsis if truncated
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }
  
  private generateMaterialityReasoning(
    signal: MaterialitySignal,
    evidence_snippets: string[],
    confidence: number
  ): string {
    const evidence_count = evidence_snippets.length;
    const confidence_level = confidence > 0.7 ? 'strong' : confidence > 0.5 ? 'moderate' : 'weak';
    
    return `This ${confidence_level} ${signal.label.toLowerCase()} signal is material because the article provides ${evidence_count} piece${evidence_count !== 1 ? 's' : ''} of direct evidence that ${signal.definition.toLowerCase()}. The evidence suggests operational significance that organizations should monitor for AI planning and governance purposes.`;
  }
  
  private generateExtractionReasoning(
    primary_signal: ValidatedCandidateSignal | null,
    secondary_signals: ValidatedCandidateSignal[],
    rejected_signals: RejectedSignal[]
  ): string {
    if (!primary_signal) {
      return `No materiality signals detected. Analyzed ${Object.values(MATERIALITY_SIGNALS).length} signal types, but none met the minimum evidence requirements. This suggests the article may not contain evidence of operational AI significance.`;
    }
    
    const reasoning = [
      `Primary signal identified: ${primary_signal.signal_type} with ${(primary_signal.confidence * 100).toFixed(1)}% confidence based on ${primary_signal.evidence_snippets.length} evidence snippets.`,
      secondary_signals.length > 0 ? 
        `Secondary signals detected: ${secondary_signals.map(s => s.signal_type).join(', ')}.` :
        'No secondary signals met the evidence threshold.',
      `${rejected_signals.length} signal types were rejected due to insufficient evidence.`
    ];
    
    return reasoning.join(' ');
  }
  
  // Helper method to test extraction on sample content
  async testExtraction(content: string, title: string = 'Test Article'): Promise<MaterialitySignalExtractionOutput> {
    return this.process(title, 'test.com', content);
  }
}
