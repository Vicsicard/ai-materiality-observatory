import { MaterialitySignalExtractionAgent, MaterialitySignalExtractionOutput } from '../agents/materiality-signal-extraction-agent';
import { MaterialitySignalValidationAgent, SignalValidationOutput } from '../agents/materiality-signal-validation-agent';
import { AIDMAMappingAgent, AIDMAMappingOutput } from '../agents/aidma-mapping-agent';
import { ExecutiveInterpretationAgent, ExecutiveInterpretationOutput } from '../agents/executive-interpretation-agent';
import { ExtractionSanitizer } from '../extraction-sanitizer';
import { DiagnosticLogger } from './diagnostic-logger';

export interface MaterialitySignalPipelineInput {
  articleTitle: string;
  sourceDomain: string;
  articleContent: string;
  articleSummary?: string;
  sourceUrl: string;
  sourceName: string;
  publishedDate?: string;
}

export interface MaterialitySignalPipelineOutput {
  approved: boolean;
  article?: string;
  signal_type?: string;
  headline?: string;
  summary?: string;
  validationReasons?: string[];
  editorialFlags?: Array<{
    term: string;
    section: string;
  }>;
  // V2 specific outputs
  materiality_signal?: string;
  executive_observation?: string;
  why_this_matters?: string;
  organizational_relevance?: string[];
  related_dimensions?: string[];
  questions_for_organizations?: string[];
  assessment_connection?: string;
  evidence_trail?: Array<{
    snippet: string;
    signal_type: string;
    relevance: string;
  }>;
  primary_dimensions?: string[];
  secondary_dimensions?: string[];
  assessment_relevance?: "High" | "Medium" | "Low";
  signal_confidence?: number;
  extraction_confidence?: number;
  validation_confidence?: number;
  diagnostic_id?: string;
}

export class MaterialitySignalPipeline {
  private signalExtractionAgent: MaterialitySignalExtractionAgent;
  private signalValidationAgent: MaterialitySignalValidationAgent;
  private aidmaMappingAgent: AIDMAMappingAgent;
  private executiveInterpretationAgent: ExecutiveInterpretationAgent;
  
  // Feature flag
  private readonly USE_MATERIALITY_SIGNAL_PIPELINE = process.env.USE_MATERIALITY_SIGNAL_PIPELINE === 'true';
  
  constructor() {
    this.signalExtractionAgent = new MaterialitySignalExtractionAgent();
    this.signalValidationAgent = new MaterialitySignalValidationAgent();
    this.aidmaMappingAgent = new AIDMAMappingAgent();
    this.executiveInterpretationAgent = new ExecutiveInterpretationAgent();
  }
  
  async process(input: MaterialitySignalPipelineInput): Promise<MaterialitySignalPipelineOutput> {
    // Check feature flag
    if (!this.USE_MATERIALITY_SIGNAL_PIPELINE) {
      console.log('=== MATERIALITY SIGNAL PIPELINE DISABLED ===');
      console.log('Set USE_MATERIALITY_SIGNAL_PIPELINE=true to enable V2 pipeline');
      return this.generateFallbackResponse();
    }
    
    console.log('=== MATERIALLITY SIGNAL PIPELINE V2 ===');
    console.log('Feature flag: ENABLED');
    
    const startTime = Date.now();
    let diagnosticId: string | undefined;
    
    try {
      // Step 0: Sanitize extracted content
      console.log('=== STEP 0: CONTENT SANITIZATION ===');
      const originalLength = input.articleContent.length;
      const pollutionReport = ExtractionSanitizer.getPollutionReport(input.articleContent);
      const sanitizedContent = ExtractionSanitizer.sanitize(input.articleContent);
      const sanitizedLength = sanitizedContent.length;
      
      console.log('Original length:', originalLength);
      console.log('Sanitized length:', sanitizedLength);
      console.log('Content reduction:', ((originalLength - sanitizedLength) / originalLength * 100).toFixed(1) + '%');
      console.log('Pollution detected:', pollutionReport.polluted);
      if (pollutionReport.polluted) {
        console.log('Pollution issues:', pollutionReport.issues);
      }
      
      // Start diagnostic logging
      diagnosticId = DiagnosticLogger.logProcessingStart(input.sourceUrl, originalLength);
      DiagnosticLogger.logSanitization(diagnosticId, originalLength, sanitizedLength, pollutionReport.issues);
      
      // Step 1: Signal Extraction
      console.log('=== STEP 1: SIGNAL EXTRACTION ===');
      const extractionOutput = await this.signalExtractionAgent.process(
        input.articleTitle,
        input.sourceDomain,
        sanitizedContent,
        input.articleSummary
      );
      
      DiagnosticLogger.logClassification(
        diagnosticId,
        extractionOutput.primary_signal?.signal_type || 'none',
        extractionOutput.extraction_confidence,
        {},
        extractionOutput.extraction_reasoning,
        extractionOutput.primary_signal?.evidence_snippets || [],
        false
      );
      
      if (!extractionOutput.primary_signal) {
        console.log('No primary signal detected - article may not contain materiality evidence');
        return {
          approved: false,
          validationReasons: [extractionOutput.extraction_reasoning],
          diagnostic_id: diagnosticId
        };
      }
      
      // Step 2: Signal Validation
      console.log('=== STEP 2: SIGNAL VALIDATION ===');
      const validationOutput = await this.signalValidationAgent.process(
        extractionOutput.primary_signal,
        extractionOutput.secondary_signals,
        extractionOutput.rejected_signals
      );
      
      // Step 3: AIDMA Mapping
      console.log('=== STEP 3: AIDMA MAPPING ===');
      const aidmaOutput = await this.aidmaMappingAgent.process(
        validationOutput.qualified_signals,
        validationOutput.mixed_signals
      );
      
      // Step 4: Executive Interpretation
      console.log('=== STEP 4: EXECUTIVE INTERPRETATION ===');
      const interpretationOutput = await this.executiveInterpretationAgent.process(
        extractionOutput.primary_signal,
        validationOutput.qualified_signals,
        validationOutput.mixed_signals,
        aidmaOutput,
        input.articleTitle,
        input.sourceDomain
      );
      
      // Step 5: Generate Article
      console.log('=== STEP 5: ARTICLE GENERATION ===');
      const article = this.generateArticle(interpretationOutput, input);
      
      // Step 6: Editorial Validation (simplified for V2)
      console.log('=== STEP 6: EDITORIAL VALIDATION ===');
      const editorialValidation = this.performEditorialValidation(article, interpretationOutput);
      
      // Complete diagnostic logging
      const processingTime = Date.now() - startTime;
      DiagnosticLogger.logProcessingComplete(
        diagnosticId,
        processingTime,
        ['sanitization', 'extraction', 'validation', 'mapping', 'interpretation', 'generation', 'validation'],
        editorialValidation.approved,
        editorialValidation.reasons || []
      );
      
      console.log('=== V2 PIPELINE COMPLETE ===');
      console.log('Processing time:', processingTime + 'ms');
      console.log('Approved:', editorialValidation.approved);
      console.log('Primary signal:', extractionOutput.primary_signal.signal_type);
      console.log('Confidence:', extractionOutput.extraction_confidence.toFixed(2));
      
      return {
        approved: editorialValidation.approved,
        article: editorialValidation.approved ? article : undefined,
        signal_type: extractionOutput.primary_signal.signal_type,
        headline: this.extractTitle(article),
        summary: this.extractSummary(article),
        validationReasons: editorialValidation.reasons,
        editorialFlags: editorialValidation.editorial_flags,
        
        // V2 specific outputs
        materiality_signal: interpretationOutput.materiality_signal,
        executive_observation: interpretationOutput.executive_observation,
        why_this_matters: interpretationOutput.why_this_matters,
        organizational_relevance: interpretationOutput.organizational_relevance,
        related_dimensions: interpretationOutput.related_dimensions,
        questions_for_organizations: interpretationOutput.questions_for_organizations,
        assessment_connection: interpretationOutput.assessment_connection,
        evidence_trail: interpretationOutput.evidence_trail,
        primary_dimensions: aidmaOutput.primary_dimensions,
        secondary_dimensions: aidmaOutput.secondary_dimensions,
        assessment_relevance: aidmaOutput.assessment_relevance,
        signal_confidence: extractionOutput.extraction_confidence,
        extraction_confidence: extractionOutput.extraction_confidence,
        validation_confidence: validationOutput.overall_confidence,
        diagnostic_id: diagnosticId
      };
      
    } catch (error) {
      console.error('V2 Pipeline Error:', error);
      return {
        approved: false,
        validationReasons: [`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        diagnostic_id: diagnosticId
      };
    }
  }
  
  private generateArticle(interpretation: ExecutiveInterpretationOutput, input: MaterialitySignalPipelineInput): string {
    const sections = [
      `# ${this.generateTitle(interpretation, input)}`,
      '',
      '## Executive Observation',
      interpretation.executive_observation,
      '',
      '## Materiality Signal',
      `**${interpretation.materiality_signal}**`,
      '',
      '## Why This Signal Matters',
      interpretation.why_this_matters,
      '',
      '## Organizational Relevance',
      ...interpretation.organizational_relevance.map(relevance => `- ${relevance}`),
      '',
      '## Questions Organizations Should Consider',
      ...interpretation.questions_for_organizations.map(question => `- ${question}`),
      '',
      '## Assessment Connection',
      interpretation.assessment_connection,
      '',
      '## Evidence Trail',
      ...interpretation.evidence_trail.map(evidence => `**${evidence.signal_type}:** ${evidence.snippet}`),
      '',
      `---`,
      '',
      `*Source: ${input.sourceName}*`,
      `*Original Article: [${input.articleTitle}](${input.sourceUrl})*`,
      `*Processed: ${new Date().toISOString()}*`
    ];
    
    return sections.join('\n');
  }
  
  private generateTitle(interpretation: ExecutiveInterpretationOutput, input: MaterialitySignalPipelineInput): string {
    // Generate a title based on the signal and evidence
    const signal = interpretation.materiality_signal.toLowerCase();
    const domain = input.sourceDomain.replace(/^www\./, '');
    
    // Simple title generation - can be enhanced
    if (signal.includes('resource readiness')) {
      return `${input.articleTitle} Highlights AI Cost Planning And Resource Management`;
    } else if (signal.includes('operational dependency')) {
      return `${input.articleTitle} Signals Growing AI Operational Dependency`;
    } else if (signal.includes('visibility gap')) {
      return `${input.articleTitle} Reveals AI Visibility Challenges For Organizations`;
    } else if (signal.includes('governance pressure')) {
      return `${input.articleTitle} Indicates Rising AI Governance Requirements`;
    } else if (signal.includes('reporting pressure')) {
      return `${input.articleTitle} Suggests Increased AI Disclosure Needs`;
    } else if (signal.includes('infrastructure readiness')) {
      return `${input.articleTitle} Highlights AI Infrastructure Planning Requirements`;
    } else if (signal.includes('sustainability impact')) {
      return `${input.articleTitle} Signals AI Environmental Impact Considerations`;
    } else {
      return `${input.articleTitle}: AI Materiality Signal Analysis`;
    }
  }
  
  private extractTitle(article: string): string {
    const titleMatch = article.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'AI Materiality Observation';
  }
  
  private extractSummary(article: string): string {
    // Extract first paragraph after title
    const lines = article.split('\n');
    let inContent = false;
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        inContent = true;
        continue;
      }
      if (inContent && line.trim()) {
        return line.trim();
      }
    }
    
    return 'AI materiality analysis and organizational implications';
  }
  
  private performEditorialValidation(article: string, interpretation: ExecutiveInterpretationOutput): {
    approved: boolean;
    reasons?: string[];
    editorial_flags?: Array<{ term: string; section: string }>;
  } {
    const reasons: string[] = [];
    const editorial_flags: Array<{ term: string; section: string }> = [];
    
    // Check for minimum content requirements
    if (article.length < 500) {
      reasons.push('Article too short for publication');
    }
    
    // Check for evidence trail
    if (interpretation.evidence_trail.length === 0) {
      reasons.push('No evidence trail provided');
    }
    
    // Check for organizational relevance
    if (interpretation.organizational_relevance.length < 3) {
      reasons.push('Insufficient organizational relevance');
    }
    
    // Check for questions
    if (interpretation.questions_for_organizations.length < 3) {
      reasons.push('Insufficient questions for organizations');
    }
    
    // Check for prohibited language (simplified)
    const prohibitedPatterns = [
      /essential/gi,
      /critical/gi,
      /must/gi,
      /should/gi,
      /need to/gi,
      /required/gi
    ];
    
    for (const pattern of prohibitedPatterns) {
      const matches = article.match(pattern);
      if (matches && matches.length > 0) {
        editorial_flags.push({
          term: matches[0],
          section: 'Article contains potentially problematic language'
        });
      }
    }
    
    return {
      approved: reasons.length === 0 && editorial_flags.length <= 2,
      reasons: reasons.length > 0 ? reasons : undefined,
      editorial_flags: editorial_flags.length > 0 ? editorial_flags : undefined
    };
  }
  
  private generateFallbackResponse(): MaterialitySignalPipelineOutput {
    return {
      approved: false,
      validationReasons: ['Materiality Signal Pipeline V2 is disabled. Set USE_MATERIALITY_SIGNAL_PIPELINE=true to enable.']
    };
  }
}
