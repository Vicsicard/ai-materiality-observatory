import { ValidatedCandidateSignal } from './materiality-signal-extraction-agent';
import { MATERIALITY_SIGNALS } from '../signals/materiality-signal-registry';

export interface AIDMAMappingOutput {
  primary_dimensions: string[];
  secondary_dimensions: string[];
  dimension_scores: Record<string, number>;
  assessment_relevance: "High" | "Medium" | "Low";
  mapping_reasoning: string;
}

export class AIDMAMappingAgent {
  private readonly AIDMA_DIMENSIONS = [
    'AI Visibility',
    'Resource Readiness',
    'Operational Dependency',
    'Infrastructure Readiness',
    'Governance Readiness',
    'Sustainability Readiness',
    'Reporting Pressure'
  ];
  
  async process(
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[] = []
  ): Promise<AIDMAMappingOutput> {
    console.log('=== AIDMA MAPPING ===');
    console.log('Qualified signals:', qualified_signals.length);
    console.log('Mixed signals:', mixed_signals.length);
    
    const all_signals = [...qualified_signals, ...mixed_signals];
    const dimension_scores: Record<string, number> = {};
    
    // Initialize all dimensions to 0
    for (const dimension of this.AIDMA_DIMENSIONS) {
      dimension_scores[dimension] = 0;
    }
    
    // Calculate dimension scores from signals
    for (const signal of all_signals) {
      const signal_def = MATERIALITY_SIGNALS[signal.signal_type as keyof typeof MATERIALITY_SIGNALS];
      if (signal_def) {
        const signal_weight = qualified_signals.includes(signal) ? 1.0 : 0.5; // Mixed signals get half weight
        
        for (const [dimension, weight] of Object.entries(signal_def.aidma_dimension_weights)) {
          dimension_scores[dimension] += weight * signal_weight * signal.confidence;
        }
        
        console.log(`Signal ${signal.signal_type} (confidence: ${signal.confidence.toFixed(2)}, weight: ${signal_weight}) contributes to dimensions:`, 
          Object.entries(signal_def.aidma_dimension_weights)
            .filter(([_, w]) => w > 0)
            .map(([d, w]) => `${d}: ${(w * signal_weight * signal.confidence).toFixed(2)}`)
            .join(', ')
        );
      }
    }
    
    // Normalize scores to 0-1 range
    const max_score = Math.max(...Object.values(dimension_scores));
    if (max_score > 0) {
      for (const dimension of this.AIDMA_DIMENSIONS) {
        dimension_scores[dimension] = dimension_scores[dimension] / max_score;
      }
    }
    
    // Sort dimensions by score
    const sorted_dimensions = Object.entries(dimension_scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0.1); // Only include dimensions with meaningful scores
    
    // Separate primary and secondary dimensions
    const primary_dimensions = sorted_dimensions
      .slice(0, 3)
      .map(([dimension]) => dimension);
    
    const secondary_dimensions = sorted_dimensions
      .slice(3, 6)
      .map(([dimension]) => dimension);
    
    // Determine assessment relevance
    const assessment_relevance = this.calculateAssessmentRelevance(dimension_scores, qualified_signals.length);
    
    // Generate mapping reasoning
    const mapping_reasoning = this.generateMappingReasoning(
      primary_dimensions,
      secondary_dimensions,
      dimension_scores,
      qualified_signals,
      mixed_signals,
      assessment_relevance
    );
    
    console.log('=== AIDMA MAPPING RESULTS ===');
    console.log('Primary dimensions:', primary_dimensions);
    console.log('Secondary dimensions:', secondary_dimensions);
    console.log('Assessment relevance:', assessment_relevance);
    
    return {
      primary_dimensions,
      secondary_dimensions,
      dimension_scores,
      assessment_relevance,
      mapping_reasoning
    };
  }
  
  private calculateAssessmentRelevance(
    dimension_scores: Record<string, number>,
    qualified_signal_count: number
  ): "High" | "Medium" | "Low" {
    // High relevance: Multiple strong dimensions and qualified signals
    const strong_dimensions = Object.values(dimension_scores).filter(score => score > 0.7).length;
    const moderate_dimensions = Object.values(dimension_scores).filter(score => score > 0.4).length;
    
    if (qualified_signal_count >= 2 && strong_dimensions >= 2) {
      return "High";
    }
    
    if (qualified_signal_count >= 1 && moderate_dimensions >= 2) {
      return "Medium";
    }
    
    if (moderate_dimensions >= 1) {
      return "Low";
    }
    
    return "Low";
  }
  
  private generateMappingReasoning(
    primary_dimensions: string[],
    secondary_dimensions: string[],
    dimension_scores: Record<string, number>,
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[],
    assessment_relevance: "High" | "Medium" | "Low"
  ): string {
    const parts: string[] = [];
    
    // Signal summary
    const total_signals = qualified_signals.length + mixed_signals.length;
    parts.push(`Based on ${total_signals} detected materiality signal${total_signals !== 1 ? 's' : ''}`);
    
    // Primary dimensions
    if (primary_dimensions.length > 0) {
      const primary_desc = primary_dimensions.map(dim => 
        `${dim} (${(dimension_scores[dim] * 100).toFixed(1)}% score)`
      ).join(', ');
      parts.push(`Primary AIDMA dimensions: ${primary_desc}`);
    }
    
    // Secondary dimensions
    if (secondary_dimensions.length > 0) {
      const secondary_desc = secondary_dimensions.map(dim => 
        `${dim} (${(dimension_scores[dim] * 100).toFixed(1)}% score)`
      ).join(', ');
      parts.push(`Secondary dimensions: ${secondary_desc}`);
    }
    
    // Assessment relevance explanation
    const relevance_explanations: Record<string, string> = {
      "High": "This indicates strong materiality signals that should be prioritized in organizational AI assessments",
      "Medium": "This suggests moderate materiality relevance that warrants consideration in AI planning",
      "Low": "This indicates limited but potentially relevant materiality signals for organizational awareness"
    };
    
    parts.push(`Assessment relevance: ${assessment_relevance} - ${relevance_explanations[assessment_relevance]}`);
    
    return parts.join('. ') + '.';
  }
  
  // Helper method to get dimension descriptions
  getDimensionDescriptions(): Record<string, string> {
    return {
      'AI Visibility': 'Organizational ability to see and understand AI usage, costs, and impacts across the enterprise',
      'Resource Readiness': 'Organizational preparedness to allocate budget, infrastructure, and personnel for AI initiatives',
      'Operational Dependency': 'Degree to which business processes rely on AI systems for critical operations',
      'Infrastructure Readiness': 'Preparedness of technical infrastructure (compute, networking, facilities) to support AI workloads',
      'Governance Readiness': 'Organizational capability to provide oversight, control, and compliance for AI systems',
      'Sustainability Readiness': 'Ability to manage environmental and resource impacts of AI operations',
      'Reporting Pressure': 'Requirements and expectations for disclosing AI usage and impacts to stakeholders'
    };
  }
  
  // Helper method to test mapping
  async testMapping(
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[] = []
  ): Promise<AIDMAMappingOutput> {
    return this.process(qualified_signals, mixed_signals);
  }
}
