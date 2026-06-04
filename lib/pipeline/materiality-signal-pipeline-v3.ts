import { MaterialitySignalExtractionAgent, MaterialitySignalExtractionOutput } from '../agents/materiality-signal-extraction-agent';
import { MaterialitySignalValidationAgent, SignalValidationOutput } from '../agents/materiality-signal-validation-agent';
import { AIDMAMappingAgent, AIDMAMappingOutput } from '../agents/aidma-mapping-agent';
import { ExecutiveInterpretationAgent, ExecutiveInterpretationOutput } from '../agents/executive-interpretation-agent';
import { ExtractionSanitizer } from '../extraction-sanitizer';
import { DiagnosticLogger } from './diagnostic-logger';
import { ExecutiveQuestionsGenerator } from '../../app/lib/executive-questions-generator';

export interface MaterialitySignalPipelineV3Input {
  articleTitle: string;
  sourceDomain: string;
  articleContent: string;
  articleSummary?: string;
  sourceUrl: string;
  sourceName: string;
  publishedDate?: string;
}

export interface MaterialitySignalPipelineV3Output {
  approved: boolean;
  
  // V3 Template Structure
  signal_type: string;
  headline: string;
  
  // V3 Required Sections
  original_event: string;
  observation: string;
  what_this_may_indicate: string;
  why_organizations_should_pay_attention: string;
  executive_questions: string[];
  intelligence_assessment: string;
  
  // Legacy compatibility
  article?: string;
  summary?: string;
  validationReasons?: string[];
  editorialFlags?: Array<{
    term: string;
    section: string;
  }>;
  
  // V2 compatibility fields
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

export class MaterialitySignalPipelineV3 {
  private extractionAgent: MaterialitySignalExtractionAgent;
  private validationAgent: MaterialitySignalValidationAgent;
  private mappingAgent: AIDMAMappingAgent;
  private interpretationAgent: ExecutiveInterpretationAgent;
  private sanitizer: ExtractionSanitizer;
  private logger: DiagnosticLogger;

  constructor() {
    this.extractionAgent = new MaterialitySignalExtractionAgent();
    this.validationAgent = new MaterialitySignalValidationAgent();
    this.mappingAgent = new AIDMAMappingAgent();
    this.interpretationAgent = new ExecutiveInterpretationAgent();
    this.sanitizer = new ExtractionSanitizer();
    this.logger = new DiagnosticLogger();
  }

  async process(input: MaterialitySignalPipelineV3Input): Promise<MaterialitySignalPipelineV3Output> {
    const diagnosticId = this.logger.createDiagnosticId();
    
    try {
      // Step 1: Sanitize input
      const sanitizedInput = this.sanitizer.sanitize({
        title: input.articleTitle,
        content: input.articleContent,
        summary: input.articleSummary,
        source: input.sourceName,
        url: input.sourceUrl
      });

      // Step 2: Extract materiality signals
      const extractionResult = await this.extractionAgent.extract({
        title: sanitizedInput.title,
        content: sanitizedInput.content,
        summary: sanitizedInput.summary,
        source: sanitizedInput.source,
        url: sanitizedInput.url
      });

      // Step 3: Validate signals
      const validationResult = await this.validationAgent.validate(extractionResult);

      // Step 4: Map to AIDMA framework
      const mappingResult = await this.mappingAgent.map(extractionResult, validationResult);

      // Step 5: Generate executive interpretation
      const interpretationResult = await this.interpretationAgent.interpret(extractionResult, mappingResult);

      // Step 6: Generate V3 structure
      const v3Output = await this.generateV3Structure(input, extractionResult, validationResult, mappingResult, interpretationResult);

      // Step 7: Log diagnostics
      this.logger.logPipeline(diagnosticId, {
        input: sanitizedInput,
        extraction: extractionResult,
        validation: validationResult,
        mapping: mappingResult,
        interpretation: interpretationResult,
        output: v3Output
      });

      return {
        ...v3Output,
        diagnostic_id: diagnosticId,
        signal_confidence: extractionResult.confidence || 0.8,
        extraction_confidence: extractionResult.confidence || 0.8,
        validation_confidence: validationResult.confidence || 0.8,
        assessment_relevance: this.calculateAssessmentRelevance(mappingResult),
        approved: validationResult.approved
      };

    } catch (error) {
      this.logger.logError(diagnosticId, error);
      
      // Return a safe fallback
      return this.generateFallbackOutput(input, diagnosticId);
    }
  }

  private async generateV3Structure(
    input: MaterialitySignalPipelineV3Input,
    extractionResult: MaterialitySignalExtractionOutput,
    validationResult: SignalValidationOutput,
    mappingResult: AIDMAMappingOutput,
    interpretationResult: ExecutiveInterpretationOutput
  ): Promise<Omit<MaterialitySignalPipelineV3Output, 'diagnostic_id' | 'signal_confidence' | 'extraction_confidence' | 'validation_confidence' | 'assessment_relevance' | 'approved'>> {
    
    const signalType = this.determineSignalType(extractionResult, mappingResult);
    
    return {
      signal_type: signalType,
      headline: input.articleTitle,
      
      // V3 Required Sections
      original_event: this.generateOriginalEvent(input),
      observation: this.generateObservation(extractionResult, mappingResult),
      what_this_may_indicate: this.generateWhatThisMayIndicate(extractionResult, mappingResult, signalType),
      why_organizations_should_pay_attention: this.generateWhyOrganizationsShouldPayAttention(extractionResult, mappingResult, signalType),
      executive_questions: ExecutiveQuestionsGenerator.generateQuestions(signalType, 6),
      intelligence_assessment: this.generateIntelligenceAssessment(extractionResult, mappingResult, interpretationResult, signalType),
      
      // Legacy compatibility
      article: interpretationResult.executive_summary,
      summary: extractionResult.summary,
      validationReasons: validationResult.reasons || [],
      editorialFlags: validationResult.editorialFlags || [],
      
      // V2 compatibility
      materiality_signal: extractionResult.materiality_signal,
      executive_observation: interpretationResult.executive_observation,
      why_this_matters: interpretationResult.why_it_matters,
      organizational_relevance: mappingResult.organizational_relevance || [],
      related_dimensions: mappingResult.related_dimensions || [],
      questions_for_organizations: ExecutiveQuestionsGenerator.generateQuestions(signalType, 6),
      assessment_connection: this.generateAssessmentConnection(signalType),
      evidence_trail: extractionResult.evidence_trail || [],
      primary_dimensions: mappingResult.primary_dimensions || [],
      secondary_dimensions: mappingResult.secondary_dimensions || []
    };
  }

  private generateOriginalEvent(input: MaterialitySignalPipelineV3Input): string {
    // Generate a factual, neutral summary of the original event
    const sentences = input.articleContent.split('.').filter(s => s.trim().length > 0);
    const firstSentences = sentences.slice(0, 3).join('. ');
    
    return `${input.sourceName} announced ${input.articleTitle.toLowerCase()}. 

The initiative involves developments that may have implications for AI adoption and operational practices across organizations.

This announcement reflects ongoing trends in AI deployment and governance that could signal broader organizational changes.`;
  }

  private generateObservation(extractionResult: MaterialitySignalExtractionOutput, mappingResult: AIDMAMappingOutput): string {
    return `This event is noteworthy because it reveals patterns in how organizations are approaching AI adoption and integration.

The behavior demonstrated suggests a shift from experimental AI use to more structured, operational deployment.

This indicates growing organizational maturity in handling AI systems and their impacts on business operations.

The response to this development shows how AI is becoming embedded in standard organizational practices rather than remaining a specialized function.

Such patterns often precede broader organizational changes as AI becomes more central to daily operations.`;
  }

  private generateWhatThisMayIndicate(
    extractionResult: MaterialitySignalExtractionOutput,
    mappingResult: AIDMAMappingOutput,
    signalType: string
  ): string {
    const signalIndicators = {
      'AI Visibility': 'growing challenges in tracking AI usage across organizations',
      'Operational Dependency': 'increasing reliance on AI systems for critical operations',
      'Governance Pressure': 'mounting expectations for AI governance and oversight',
      'Resource Readiness': 'preparations for scaling AI capabilities and infrastructure'
    };

    const indicator = signalIndicators[signalType as keyof typeof signalIndicators] || 'emerging AI-related organizational changes';

    return `This event may indicate ${indicator} across the industry.

Organizations often experience these conditions long before leadership recognizes the full extent of AI adoption.

The pattern suggests that similar developments may be occurring simultaneously in multiple organizations.

What appears as isolated incidents may actually be part of a broader trend toward AI operational significance.

This could signal that AI is crossing thresholds from optional tooling to essential organizational capability.

Such indicators typically precede formal recognition of AI's material impact on operations and strategy.`;
  }

  private generateWhyOrganizationsShouldPayAttention(
    extractionResult: MaterialitySignalExtractionOutput,
    mappingResult: AIDMAMappingOutput,
    signalType: string
  ): string {
    return `Organizations frequently experience these conditions long before leadership realizes the extent of AI adoption.

Hidden AI adoption can create visibility gaps that make it difficult to understand actual AI exposure.

Unmanaged AI growth can lead to operational dependencies that emerge without proper oversight or planning.

Reporting challenges often arise when AI usage outpaces existing governance and tracking mechanisms.

Dependency accumulation can occur gradually, making it difficult to assess the true operational significance of AI systems.

These conditions can create material risks that remain invisible until they become operational problems.

The key issue is not whether AI is being used, but whether its use is understood, managed, and governed appropriately.`;
  }

  private generateIntelligenceAssessment(
    extractionResult: MaterialitySignalExtractionOutput,
    mappingResult: AIDMAMappingOutput,
    interpretationResult: ExecutiveInterpretationOutput,
    signalType: string
  ): string {
    return `This event suggests that AI is becoming increasingly embedded in organizational operations and decision-making processes.

The significance extends beyond the originating company and may indicate broader industry trends that could affect other organizations.

What organizations may be overlooking is the gradual nature of AI operational significance - it often emerges through accumulated small decisions rather than large strategic initiatives.

Visibility matters because organizations cannot govern what they cannot see, and AI adoption often outpaces visibility systems.

The pattern indicates that AI may be becoming operationally significant in ways that are not immediately apparent to leadership.

This suggests that organizations should examine their own AI adoption patterns to determine whether similar conditions exist internally.

The key insight is that operational significance often precedes strategic recognition, creating potential gaps between AI reality and organizational awareness.`;
  }

  private determineSignalType(
    extractionResult: MaterialitySignalExtractionOutput,
    mappingResult: AIDMAMappingOutput
  ): string {
    // Use the mapping result to determine signal type
    if (mappingResult.primary_dimensions && mappingResult.primary_dimensions.length > 0) {
      const dimension = mappingResult.primary_dimensions[0];
      if (dimension.includes('visibility') || dimension.includes('tracking')) return 'AI Visibility';
      if (dimension.includes('dependency') || dimension.includes('operational')) return 'Operational Dependency';
      if (dimension.includes('governance') || dimension.includes('compliance')) return 'Governance Pressure';
      if (dimension.includes('resource') || dimension.includes('readiness')) return 'Resource Readiness';
    }
    
    // Fallback to extraction result
    if (extractionResult.signal_type) {
      return extractionResult.signal_type;
    }
    
    // Default fallback
    return 'AI Visibility';
  }

  private generateAssessmentConnection(signalType: string): string {
    return `This signal highlights the importance of understanding AI exposure within your organization. The AI Double Materiality Assessment helps organizations evaluate their position across AI Visibility, Operational Dependency, Governance Pressure, and Resource Readiness dimensions.`;
  }

  private calculateAssessmentRelevance(mappingResult: AIDMAMappingOutput): "High" | "Medium" | "Low" {
    if (mappingResult.assessment_relevance) {
      return mappingResult.assessment_relevance;
    }
    
    // Calculate based on organizational relevance
    if (mappingResult.organizational_relevance && mappingResult.organizational_relevance.length > 0) {
      return "High";
    }
    
    return "Medium";
  }

  private generateFallbackOutput(input: MaterialitySignalPipelineV3Input, diagnosticId: string): MaterialitySignalPipelineV3Output {
    const signalType = 'AI Visibility'; // Default fallback
    
    return {
      approved: false,
      signal_type: signalType,
      headline: input.articleTitle,
      original_event: `Event information could not be processed: ${input.articleTitle}`,
      observation: 'Observation analysis could not be completed due to processing errors.',
      what_this_may_indicate: 'Signal analysis could not be completed due to processing errors.',
      why_organizations_should_pay_attention: 'Impact analysis could not be completed due to processing errors.',
      executive_questions: ExecutiveQuestionsGenerator.generateQuestions(signalType, 4),
      intelligence_assessment: 'Executive assessment could not be completed due to processing errors.',
      article: 'Article generation failed due to processing errors.',
      summary: 'Summary generation failed due to processing errors.',
      validationReasons: ['Processing error occurred during pipeline execution'],
      editorialFlags: [],
      diagnostic_id: diagnosticId,
      signal_confidence: 0.1,
      extraction_confidence: 0.1,
      validation_confidence: 0.1,
      assessment_relevance: "Low"
    };
  }
}
