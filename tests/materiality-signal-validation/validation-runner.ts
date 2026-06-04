import { ExtractorV2 } from '../../lib/extractor-v2';
import { MaterialitySignalPipeline, MaterialitySignalPipelineInput } from '../../lib/pipeline/materiality-signal-pipeline';
import { VALIDATION_TEST_CASES, ValidationResult, ValidationReport, ValidationTestCase } from './validation-test-cases';
import { DiagnosticLogger } from '../../lib/pipeline/diagnostic-logger';

export class ValidationRunner {
  private pipeline: MaterialitySignalPipeline;
  private extractor: ExtractorV2;
  
  constructor() {
    this.pipeline = new MaterialitySignalPipeline();
    this.extractor = new ExtractorV2();
  }
  
  async runAllTests(): Promise<ValidationReport> {
    console.log('=== AMO V2 VALIDATION HARNESS ===');
    console.log(`Running ${VALIDATION_TEST_CASES.length} validation tests...\n`);
    
    // Clear diagnostic logs
    DiagnosticLogger.clearLogs();
    
    const results: ValidationResult[] = [];
    let passedTests = 0;
    
    for (const testCase of VALIDATION_TEST_CASES) {
      console.log(`\n=== TESTING: ${testCase.name} ===`);
      console.log(`URL: ${testCase.source_url}`);
      console.log(`Expected Primary Signal: ${testCase.expected_primary_signal}`);
      
      try {
        const result = await this.runSingleTest(testCase);
        results.push(result);
        
        const passed = this.evaluateTestResultForPrint(result);
        if (passed) {
          passedTests++;
          console.log(`✅ PASSED: ${testCase.name}`);
        } else {
          console.log(`❌ FAILED: ${testCase.name}`);
          this.printFailureDetails(result);
        }
        
      } catch (error) {
        console.error(`💥 ERROR in ${testCase.name}:`, error);
        results.push({
          test_case: testCase,
          actual_secondary_signals: [],
          actual_primary_dimensions: [],
          actual_evidence_count: 0,
          signal_confidence: 0,
          evidence_snippets: [],
          processing_time_ms: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const report = this.generateReport(results, passedTests);
    this.printReportSummary(report);
    
    return report;
  }
  
  private async runSingleTest(testCase: ValidationTestCase): Promise<ValidationResult> {
    const startTime = Date.now();
    
    // Step 1: Extract article content
    console.log('Extracting article content...');
    const extractionResult = await this.extractor.extractFromUrl(testCase.source_url);
    
    if (extractionResult.rejected || !extractionResult.candidate) {
      throw new Error(`Extraction failed: ${extractionResult.rejectionReason || 'Unknown reason'}`);
    }
    
    console.log(`Extracted ${extractionResult.candidate.contentLength} characters`);
    
    // Step 2: Run through V2 pipeline
    console.log('Running V2 materiality signal pipeline...');
    
    const pipelineInput: MaterialitySignalPipelineInput = {
      articleTitle: extractionResult.candidate.headline,
      sourceDomain: new URL(testCase.source_url).hostname,
      articleContent: extractionResult.candidate.content,
      articleSummary: extractionResult.candidate.content.slice(0, 500), // Simple summary
      sourceUrl: testCase.source_url,
      sourceName: new URL(testCase.source_url).hostname,
      publishedDate: extractionResult.candidate.publishedDate
    };
    
    const pipelineResult = await this.pipeline.process(pipelineInput);
    const processingTime = Date.now() - startTime;
    
    console.log(`Pipeline completed in ${processingTime}ms`);
    console.log(`Primary signal: ${pipelineResult.materiality_signal || 'None'}`);
    console.log(`Confidence: ${pipelineResult.signal_confidence?.toFixed(2) || 'N/A'}`);
    console.log(`Evidence snippets: ${pipelineResult.evidence_trail?.length || 0}`);
    
    return {
      test_case: testCase,
      actual_primary_signal: pipelineResult.signal_type,
      actual_secondary_signals: pipelineResult.related_dimensions || [],
      actual_primary_dimensions: pipelineResult.primary_dimensions || [],
      actual_relevance_level: pipelineResult.assessment_relevance,
      actual_evidence_count: pipelineResult.evidence_trail?.length || 0,
      signal_confidence: pipelineResult.signal_confidence || 0,
      evidence_snippets: pipelineResult.evidence_trail?.map(e => e.snippet) || [],
      executive_observation: pipelineResult.executive_observation,
      organizational_relevance: pipelineResult.organizational_relevance,
      questions_for_organizations: pipelineResult.questions_for_organizations,
      assessment_connection: pipelineResult.assessment_connection,
      processing_time_ms: processingTime
    };
  }
  
  private evaluateTestResultForPrint(result: ValidationResult): boolean {
    if (result.error) return false;
    
    // Primary signal accuracy (most important)
    const primarySignalMatch = result.actual_primary_signal === result.test_case.expected_primary_signal;
    
    // Secondary signals (at least one match)
    const secondarySignalMatch = result.test_case.expected_secondary_signals.some(signal => 
      result.actual_secondary_signals.includes(signal)
    );
    
    // Primary dimensions (at least one match)
    const primaryDimensionMatch = result.test_case.expected_primary_dimensions.some(dimension => 
      result.actual_primary_dimensions.includes(dimension)
    );
    
    // Relevance level (exact match or higher)
    const relevanceMatch = !result.actual_relevance_level || 
      result.actual_relevance_level === result.test_case.expected_relevance_level ||
      (result.actual_relevance_level === 'High' && result.test_case.expected_relevance_level !== 'High');
    
    // Evidence quality (minimum evidence)
    const evidenceQuality = result.actual_evidence_count >= Math.max(1, Math.floor(result.test_case.expected_evidence_count * 0.5));
    
    // Confidence threshold
    const confidenceThreshold = result.signal_confidence >= 0.3;
    
    const passed = primarySignalMatch && secondarySignalMatch && primaryDimensionMatch && 
                   relevanceMatch && evidenceQuality && confidenceThreshold;
    
    console.log(`  Primary Signal Match: ${primarySignalMatch ? '✅' : '❌'}`);
    console.log(`  Secondary Signal Match: ${secondarySignalMatch ? '✅' : '❌'}`);
    console.log(`  Primary Dimension Match: ${primaryDimensionMatch ? '✅' : '❌'}`);
    console.log(`  Relevance Match: ${relevanceMatch ? '✅' : '❌'}`);
    console.log(`  Evidence Quality: ${evidenceQuality ? '✅' : '❌'} (${result.actual_evidence_count}/${result.test_case.expected_evidence_count})`);
    console.log(`  Confidence Threshold: ${confidenceThreshold ? '✅' : '❌'} (${result.signal_confidence.toFixed(2)})`);
    
    return passed;
  }
  
  private printFailureDetails(result: ValidationResult): void {
    console.log(`  Expected Primary: ${result.test_case.expected_primary_signal}`);
    console.log(`  Actual Primary: ${result.actual_primary_signal || 'None'}`);
    console.log(`  Expected Secondary: [${result.test_case.expected_secondary_signals.join(', ')}]`);
    console.log(`  Actual Secondary: [${result.actual_secondary_signals.join(', ')}]`);
    console.log(`  Expected Dimensions: [${result.test_case.expected_primary_dimensions.join(', ')}]`);
    console.log(`  Actual Dimensions: [${result.actual_primary_dimensions.join(', ')}]`);
    console.log(`  Expected Relevance: ${result.test_case.expected_relevance_level}`);
    console.log(`  Actual Relevance: ${result.actual_relevance_level || 'None'}`);
    console.log(`  Evidence Count: ${result.actual_evidence_count}/${result.test_case.expected_evidence_count}`);
    console.log(`  Confidence: ${result.signal_confidence.toFixed(2)}`);
  }
  
  private generateReport(results: ValidationResult[], passedTests: number): ValidationReport {
    const totalTests = results.length;
    const failedTests = totalTests - passedTests;
    
    // Calculate accuracy metrics
    const signalAccuracy = this.calculateSignalAccuracy(results);
    const aidmaAccuracy = this.calculateAIDMAAccuracy(results);
    const relevanceAccuracy = this.calculateRelevanceAccuracy(results);
    const evidenceQualityScore = this.calculateEvidenceQualityScore(results);
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processing_time_ms, 0) / totalTests;
    
    const summary = this.generateSummary(passedTests, totalTests, signalAccuracy, aidmaAccuracy, relevanceAccuracy);
    
    return {
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
      overall_accuracy: passedTests / totalTests,
      signal_accuracy: signalAccuracy,
      aidma_accuracy: aidmaAccuracy,
      relevance_accuracy: relevanceAccuracy,
      evidence_quality_score: evidenceQualityScore,
      average_processing_time: averageProcessingTime,
      results: results,
      summary: summary
    };
  }
  
  private calculateSignalAccuracy(results: ValidationResult[]): number {
    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return 0;
    
    const correctSignals = validResults.filter(r => 
      r.actual_primary_signal === r.test_case.expected_primary_signal
    ).length;
    
    return correctSignals / validResults.length;
  }
  
  private calculateAIDMAAccuracy(results: ValidationResult[]): number {
    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return 0;
    
    let totalDimensions = 0;
    let correctDimensions = 0;
    
    for (const result of validResults) {
      const expectedDimensions = result.test_case.expected_primary_dimensions;
      const actualDimensions = result.actual_primary_dimensions;
      
      totalDimensions += expectedDimensions.length;
      correctDimensions += expectedDimensions.filter(d => actualDimensions.includes(d)).length;
    }
    
    return totalDimensions > 0 ? correctDimensions / totalDimensions : 0;
  }
  
  private calculateRelevanceAccuracy(results: ValidationResult[]): number {
    const validResults = results.filter(r => !r.error && r.actual_relevance_level);
    if (validResults.length === 0) return 0;
    
    const correctRelevance = validResults.filter(r => 
      r.actual_relevance_level === r.test_case.expected_relevance_level ||
      (r.actual_relevance_level === 'High' && r.test_case.expected_relevance_level !== 'High')
    ).length;
    
    return correctRelevance / validResults.length;
  }
  
  private calculateEvidenceQualityScore(results: ValidationResult[]): number {
    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return 0;
    
    const totalExpectedEvidence = validResults.reduce((sum, r) => sum + r.test_case.expected_evidence_count, 0);
    const totalActualEvidence = validResults.reduce((sum, r) => sum + r.actual_evidence_count, 0);
    
    return totalExpectedEvidence > 0 ? Math.min(totalActualEvidence / totalExpectedEvidence, 1) : 0;
  }
  
  private generateSummary(passedTests: number, totalTests: number, signalAccuracy: number, aidmaAccuracy: number, relevanceAccuracy: number): string {
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    const signalRate = (signalAccuracy * 100).toFixed(1);
    const aidmaRate = (aidmaAccuracy * 100).toFixed(1);
    const relevanceRate = (relevanceAccuracy * 100).toFixed(1);
    
    return `AMO V2 Validation Results: ${passedTests}/${totalTests} tests passed (${passRate}%). Signal accuracy: ${signalRate}%, AIDMA accuracy: ${aidmaRate}%, Relevance accuracy: ${relevanceRate}%.`;
  }
  
  private printReportSummary(report: ValidationReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 AMO V2 VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.total_tests}`);
    console.log(`Passed: ${report.passed_tests} ✅`);
    console.log(`Failed: ${report.failed_tests} ❌`);
    console.log(`Overall Accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`);
    console.log(`Signal Accuracy: ${(report.signal_accuracy * 100).toFixed(1)}%`);
    console.log(`AIDMA Accuracy: ${(report.aidma_accuracy * 100).toFixed(1)}%`);
    console.log(`Relevance Accuracy: ${(report.relevance_accuracy * 100).toFixed(1)}%`);
    console.log(`Evidence Quality Score: ${(report.evidence_quality_score * 100).toFixed(1)}%`);
    console.log(`Average Processing Time: ${report.average_processing_time.toFixed(0)}ms`);
    console.log('='.repeat(60));
    console.log(`📋 ${report.summary}`);
    
    if (report.failed_tests > 0) {
      console.log('\n❌ FAILED TESTS:');
      for (const result of report.results.filter(r => r.error || !this.evaluateTestResultForPrint(r))) {
        console.log(`  - ${result.test_case.name}: ${result.error || 'Accuracy threshold not met'}`);
      }
    }
  }
  
  private evaluateTestResultForSummary(result: ValidationResult): boolean {
    if (result.error) return false;
    
    const primarySignalMatch = result.actual_primary_signal === result.test_case.expected_primary_signal;
    const secondarySignalMatch = result.test_case.expected_secondary_signals.some(signal => 
      result.actual_secondary_signals.includes(signal)
    );
    const primaryDimensionMatch = result.test_case.expected_primary_dimensions.some(dimension => 
      result.actual_primary_dimensions.includes(dimension)
    );
    const relevanceMatch = !result.actual_relevance_level || 
      result.actual_relevance_level === result.test_case.expected_relevance_level ||
      (result.actual_relevance_level === 'High' && result.test_case.expected_relevance_level !== 'High');
    const evidenceQuality = result.actual_evidence_count >= Math.max(1, Math.floor(result.test_case.expected_evidence_count * 0.5));
    const confidenceThreshold = result.signal_confidence >= 0.3;
    
    return primarySignalMatch && secondarySignalMatch && primaryDimensionMatch && 
           relevanceMatch && evidenceQuality && confidenceThreshold;
  }
}
