export interface DiagnosticLog {
  article_url: string;
  processing_timestamp: string;
  extraction_sanitization: {
    original_length: number;
    sanitized_length: number;
    pollution_detected: boolean;
    pollution_issues: string[];
    content_reduction_percentage: number;
  };
  classification: {
    winning_category: string;
    confidence_score: number;
    all_scores: { [key: string]: number };
    classification_reason: string;
    classification_details: string[];
    ambiguous_efficiency_handling: boolean;
  };
  materiality_interpretation: {
    evidence_sources: string[];
    reasoning_trail: string[];
    evidence_based: boolean;
    generic_fallback_used: boolean;
  };
  title_generation: {
    generated_title: string;
    source_headline: string;
    title_reasoning: string;
  };
  quality_metrics: {
    total_processing_time_ms: number;
    pipeline_stages_completed: string[];
    validation_passed: boolean;
    validation_reasons: string[];
  };
}

export class DiagnosticLogger {
  private static logs: DiagnosticLog[] = [];
  
  static logProcessingStart(articleUrl: string, originalLength: number): string {
    const processingId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const log: Partial<DiagnosticLog> = {
      article_url: articleUrl,
      processing_timestamp: new Date().toISOString(),
      extraction_sanitization: {
        original_length: originalLength,
        sanitized_length: 0,
        pollution_detected: false,
        pollution_issues: [],
        content_reduction_percentage: 0
      },
      classification: {
        winning_category: '',
        confidence_score: 0,
        all_scores: {},
        classification_reason: '',
        classification_details: [],
        ambiguous_efficiency_handling: false
      },
      materiality_interpretation: {
        evidence_sources: [],
        reasoning_trail: [],
        evidence_based: false,
        generic_fallback_used: false
      },
      title_generation: {
        generated_title: '',
        source_headline: '',
        title_reasoning: ''
      },
      quality_metrics: {
        total_processing_time_ms: 0,
        pipeline_stages_completed: [],
        validation_passed: false,
        validation_reasons: []
      }
    };
    
    // Store with processingId as key (in production, use proper storage)
    this.logs.push(log as DiagnosticLog);
    return processingId;
  }
  
  static logSanitization(processingId: string, originalLength: number, sanitizedLength: number, pollutionIssues: string[]): void {
    const log = this.findLog(processingId);
    if (log) {
      log.extraction_sanitization = {
        original_length: originalLength,
        sanitized_length: sanitizedLength,
        pollution_detected: pollutionIssues.length > 0,
        pollution_issues: pollutionIssues,
        content_reduction_percentage: ((originalLength - sanitizedLength) / originalLength) * 100
      };
    }
  }
  
  static logClassification(processingId: string, category: string, confidence: number, allScores: { [key: string]: number }, reason: string, details: string[], ambiguousEfficiency: boolean): void {
    const log = this.findLog(processingId);
    if (log) {
      log.classification = {
        winning_category: category,
        confidence_score: confidence,
        all_scores: allScores,
        classification_reason: reason,
        classification_details: details,
        ambiguous_efficiency_handling: ambiguousEfficiency
      };
    }
  }
  
  static logMaterialityInterpretation(processingId: string, evidenceSources: string[], reasoningTrail: string[], evidenceBased: boolean, genericFallback: boolean): void {
    const log = this.findLog(processingId);
    if (log) {
      log.materiality_interpretation = {
        evidence_sources: evidenceSources,
        reasoning_trail: reasoningTrail,
        evidence_based: evidenceBased,
        generic_fallback_used: genericFallback
      };
    }
  }
  
  static logTitleGeneration(processingId: string, generatedTitle: string, sourceHeadline: string, reasoning: string): void {
    const log = this.findLog(processingId);
    if (log) {
      log.title_generation = {
        generated_title: generatedTitle,
        source_headline: sourceHeadline,
        title_reasoning: reasoning
      };
    }
  }
  
  static logProcessingComplete(processingId: string, processingTimeMs: number, completedStages: string[], validationPassed: boolean, validationReasons: string[]): void {
    const log = this.findLog(processingId);
    if (log) {
      log.quality_metrics = {
        total_processing_time_ms: processingTimeMs,
        pipeline_stages_completed: completedStages,
        validation_passed: validationPassed,
        validation_reasons: validationReasons
      };
    }
  }
  
  static getDiagnosticLog(processingId: string): DiagnosticLog | null {
    return this.findLog(processingId) || null;
  }
  
  static getAllLogs(): DiagnosticLog[] {
    return [...this.logs];
  }
  
  static getLogsByUrl(articleUrl: string): DiagnosticLog[] {
    return this.logs.filter(log => log.article_url === articleUrl);
  }
  
  static getLogsByCategory(category: string): DiagnosticLog[] {
    return this.logs.filter(log => log.classification.winning_category === category);
  }
  
  static getLowConfidenceClassifications(threshold: number = 0.4): DiagnosticLog[] {
    return this.logs.filter(log => log.classification.confidence_score < threshold);
  }
  
  static getPollutedArticles(): DiagnosticLog[] {
    return this.logs.filter(log => log.extraction_sanitization.pollution_detected);
  }
  
  static getNonEvidenceBasedInterpretations(): DiagnosticLog[] {
    return this.logs.filter(log => !log.materiality_interpretation.evidence_based);
  }
  
  static generateQualityReport(): {
    total_processed: number;
    average_confidence: number;
    pollution_rate: number;
    evidence_based_rate: number;
    validation_pass_rate: number;
    category_distribution: { [key: string]: number };
    common_pollution_issues: { [key: string]: number };
  } {
    const logs = this.logs;
    
    if (logs.length === 0) {
      return {
        total_processed: 0,
        average_confidence: 0,
        pollution_rate: 0,
        evidence_based_rate: 0,
        validation_pass_rate: 0,
        category_distribution: {},
        common_pollution_issues: {}
      };
    }
    
    const totalProcessed = logs.length;
    const averageConfidence = logs.reduce((sum, log) => sum + log.classification.confidence_score, 0) / totalProcessed;
    const pollutionRate = logs.filter(log => log.extraction_sanitization.pollution_detected).length / totalProcessed;
    const evidenceBasedRate = logs.filter(log => log.materiality_interpretation.evidence_based).length / totalProcessed;
    const validationPassRate = logs.filter(log => log.quality_metrics.validation_passed).length / totalProcessed;
    
    const categoryDistribution: { [key: string]: number } = {};
    logs.forEach(log => {
      categoryDistribution[log.classification.winning_category] = (categoryDistribution[log.classification.winning_category] || 0) + 1;
    });
    
    const commonPollutionIssues: { [key: string]: number } = {};
    logs.forEach(log => {
      log.extraction_sanitization.pollution_issues.forEach(issue => {
        commonPollutionIssues[issue] = (commonPollutionIssues[issue] || 0) + 1;
      });
    });
    
    return {
      total_processed: totalProcessed,
      average_confidence: averageConfidence,
      pollution_rate: pollutionRate,
      evidence_based_rate: evidenceBasedRate,
      validation_pass_rate: validationPassRate,
      category_distribution: categoryDistribution,
      common_pollution_issues: commonPollutionIssues
    };
  }
  
  private static findLog(processingId: string): DiagnosticLog | undefined {
    // In production, use proper lookup by processingId
    // For now, return the last log (simplified for demo)
    return this.logs[this.logs.length - 1];
  }
  
  static clearLogs(): void {
    this.logs = [];
  }
}
