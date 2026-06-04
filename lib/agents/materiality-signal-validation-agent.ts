import { ValidatedCandidateSignal, RejectedSignal } from './materiality-signal-extraction-agent';

export interface SignalValidationOutput {
  qualified_signals: ValidatedCandidateSignal[];
  mixed_signals: ValidatedCandidateSignal[];
  rejected_signals: RejectedSignal[];
  overall_confidence: number;
  validation_reasoning: string;
}

export interface EvidenceQuality {
  direct_evidence: number;
  circumstantial_evidence: number;
  speculative_evidence: number;
  unsupported_claims: number;
}

export class MaterialitySignalValidationAgent {
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.3;
  private readonly MIXED_SIGNAL_MIN = 0.3;
  private readonly QUALIFIED_SIGNAL_MIN = 0.6;
  
  async process(
    primary_signal: ValidatedCandidateSignal | null,
    secondary_signals: ValidatedCandidateSignal[],
    rejected_signals: RejectedSignal[]
  ): Promise<SignalValidationOutput> {
    console.log('=== SIGNAL VALIDATION ===');
    console.log('Primary signal:', primary_signal?.signal_type || 'None');
    console.log('Secondary signals:', secondary_signals.length);
    console.log('Rejected signals:', rejected_signals.length);
    
    const qualified_signals: ValidatedCandidateSignal[] = [];
    const mixed_signals: ValidatedCandidateSignal[] = [];
    const final_rejected_signals: RejectedSignal[] = [...rejected_signals];
    
    // Validate primary signal
    if (primary_signal) {
      const validation = this.validateSignal(primary_signal);
      const categorized_signal = { ...primary_signal, ...validation };
      
      if (validation.adjusted_confidence >= this.QUALIFIED_SIGNAL_MIN) {
        qualified_signals.push(categorized_signal);
        console.log(`✅ Qualified signal: ${primary_signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      } else if (validation.adjusted_confidence >= this.MIXED_SIGNAL_MIN) {
        mixed_signals.push(categorized_signal);
        console.log(`⚠️ Mixed signal: ${primary_signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      } else {
        final_rejected_signals.push({
          signal_type: primary_signal.signal_type,
          rejection_reason: validation.rejection_reason || 'Confidence below minimum threshold',
          evidence_count: primary_signal.evidence_snippets.length
        });
        console.log(`❌ Rejected primary signal: ${primary_signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      }
    }
    
    // Validate secondary signals
    for (const signal of secondary_signals) {
      const validation = this.validateSignal(signal);
      const categorized_signal = { ...signal, ...validation };
      
      if (validation.adjusted_confidence >= this.QUALIFIED_SIGNAL_MIN) {
        qualified_signals.push(categorized_signal);
        console.log(`✅ Qualified secondary signal: ${signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      } else if (validation.adjusted_confidence >= this.MIXED_SIGNAL_MIN) {
        mixed_signals.push(categorized_signal);
        console.log(`⚠️ Mixed secondary signal: ${signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      } else {
        final_rejected_signals.push({
          signal_type: signal.signal_type,
          rejection_reason: validation.rejection_reason || 'Confidence below minimum threshold',
          evidence_count: signal.evidence_snippets.length
        });
        console.log(`❌ Rejected secondary signal: ${signal.signal_type} (${validation.adjusted_confidence.toFixed(2)})`);
      }
    }
    
    // Calculate overall confidence
    const overall_confidence = this.calculateOverallConfidence(qualified_signals, mixed_signals);
    
    // Generate validation reasoning
    const validation_reasoning = this.generateValidationReasoning(
      qualified_signals,
      mixed_signals,
      final_rejected_signals,
      overall_confidence
    );
    
    console.log('=== VALIDATION RESULTS ===');
    console.log('Qualified signals:', qualified_signals.length);
    console.log('Mixed signals:', mixed_signals.length);
    console.log('Total rejected signals:', final_rejected_signals.length);
    console.log('Overall confidence:', overall_confidence.toFixed(2));
    
    return {
      qualified_signals,
      mixed_signals,
      rejected_signals: final_rejected_signals,
      overall_confidence,
      validation_reasoning
    };
  }
  
  private validateSignal(signal: ValidatedCandidateSignal): {
    adjusted_confidence: number;
    evidence_quality: EvidenceQuality;
    rejection_reason?: string;
  } {
    const evidence_quality = this.assessEvidenceQuality(signal);
    let adjusted_confidence = signal.confidence;
    let rejection_reason: string | undefined;
    
    // Apply evidence quality adjustments
    if (evidence_quality.unsupported_claims > 0) {
      adjusted_confidence *= 0.5; // Significant penalty for unsupported claims
      rejection_reason = 'Contains unsupported claims';
    }
    
    if (evidence_quality.speculative_evidence > evidence_quality.direct_evidence) {
      adjusted_confidence *= 0.7; // Penalty for speculative evidence
      if (!rejection_reason) rejection_reason = 'Primarily speculative evidence';
    }
    
    if (evidence_quality.direct_evidence === 0 && evidence_quality.circumstantial_evidence === 0) {
      adjusted_confidence *= 0.3; // Major penalty if no direct/circumstantial evidence
      if (!rejection_reason) rejection_reason = 'Lacks direct or circumstantial evidence';
    }
    
    // Bonus for strong direct evidence
    if (evidence_quality.direct_evidence >= 2) {
      adjusted_confidence *= 1.2; // Bonus for multiple direct evidence pieces
    }
    
    // Cap confidence at 1.0
    adjusted_confidence = Math.min(adjusted_confidence, 1.0);
    
    return {
      adjusted_confidence,
      evidence_quality
    };
  }
  
  private assessEvidenceQuality(signal: ValidatedCandidateSignal): EvidenceQuality {
    let direct_evidence = 0;
    let circumstantial_evidence = 0;
    let speculative_evidence = 0;
    let unsupported_claims = 0;
    
    for (const snippet of signal.evidence_snippets) {
      const quality = this.classifyEvidence(snippet);
      
      switch (quality) {
        case 'direct':
          direct_evidence++;
          break;
        case 'circumstantial':
          circumstantial_evidence++;
          break;
        case 'speculative':
          speculative_evidence++;
          break;
        case 'unsupported':
          unsupported_claims++;
          break;
      }
    }
    
    return {
      direct_evidence,
      circumstantial_evidence,
      speculative_evidence,
      unsupported_claims
    };
  }
  
  private classifyEvidence(snippet: string): 'direct' | 'circumstantial' | 'speculative' | 'unsupported' {
    const lower = snippet.toLowerCase();
    
    // Direct evidence indicators
    const directIndicators = [
      /\$\d+/,
      /\d+%/,
      /\d+ (times?|x|fold)/,
      /(according to|study shows|research indicates|survey found|data reveals)/,
      /(reported|announced|disclosed|published)/,
      /(q[1-4]|fy\d{4}|h[1-2])/i
    ];
    
    // Speculative evidence indicators
    const speculativeIndicators = [
      /(could|might|may|would|could be|potential|possible)/,
      /(expected|projected|forecast|predicted|estimated)/,
      /(if|when|assuming|hypothetically)/,
      /(in the future|going forward|upcoming)/
    ];
    
    // Unsupported evidence indicators
    const unsupportedIndicators = [
      /(should|must|need to|have to)/,
      /(best practice|recommended|advised)/,
      /(important|critical|essential|vital)/
    ];
    
    // Check for unsupported claims first
    if (unsupportedIndicators.some(pattern => pattern.test(lower))) {
      return 'unsupported';
    }
    
    // Check for speculative language
    if (speculativeIndicators.some(pattern => pattern.test(lower))) {
      return 'speculative';
    }
    
    // Check for direct evidence
    if (directIndicators.some(pattern => pattern.test(lower))) {
      return 'direct';
    }
    
    // Default to circumstantial
    return 'circumstantial';
  }
  
  private calculateOverallConfidence(
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[]
  ): number {
    if (qualified_signals.length === 0 && mixed_signals.length === 0) {
      return 0;
    }
    
    const all_signals = [...qualified_signals, ...mixed_signals];
    const total_confidence = all_signals.reduce((sum, signal) => sum + signal.confidence, 0);
    const average_confidence = total_confidence / all_signals.length;
    
    // Weight qualified signals higher
    const qualified_weight = qualified_signals.length * 1.0;
    const mixed_weight = mixed_signals.length * 0.5;
    const total_weight = qualified_weight + mixed_weight || 1;
    
    const weighted_confidence = (qualified_weight + mixed_weight * 0.5) / total_weight;
    
    return Math.min(average_confidence * weighted_confidence, 1.0);
  }
  
  private generateValidationReasoning(
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[],
    rejected_signals: RejectedSignal[],
    overall_confidence: number
  ): string {
    const parts: string[] = [];
    
    if (qualified_signals.length > 0) {
      parts.push(`Qualified ${qualified_signals.length} signal${qualified_signals.length !== 1 ? 's' : ''} with strong evidence support`);
    }
    
    if (mixed_signals.length > 0) {
      parts.push(`Identified ${mixed_signals.length} mixed signal${mixed_signals.length !== 1 ? 's' : ''} requiring further review`);
    }
    
    if (rejected_signals.length > 0) {
      parts.push(`Rejected ${rejected_signals.length} signal${rejected_signals.length !== 1 ? 's' : ''} due to insufficient evidence or quality issues`);
    }
    
    const confidence_level = overall_confidence > 0.7 ? 'high' : overall_confidence > 0.5 ? 'moderate' : 'low';
    parts.push(`Overall validation confidence: ${confidence_level} (${(overall_confidence * 100).toFixed(1)}%)`);
    
    return parts.join('. ') + '.';
  }
  
  // Helper method to test validation
  async testValidation(
    primary_signal: ValidatedCandidateSignal | null,
    secondary_signals: ValidatedCandidateSignal[],
    rejected_signals: RejectedSignal[]
  ): Promise<SignalValidationOutput> {
    return this.process(primary_signal, secondary_signals, rejected_signals);
  }
}
