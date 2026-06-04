import { ExecutiveQuestionsGenerator } from '../../app/lib/executive-questions-generator';

export interface MaterialitySignalPipelineV3SimpleInput {
  articleTitle: string;
  sourceDomain: string;
  articleContent: string;
  articleSummary?: string;
  sourceUrl: string;
  sourceName: string;
  publishedDate?: string;
}

export interface MaterialitySignalPipelineV3SimpleOutput {
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
  article: string;
  summary: string;
  validationReasons: string[];
  editorialFlags: Array<{
    term: string;
    section: string;
  }>;
  
  // Metadata
  signal_confidence: number;
  extraction_confidence: number;
  validation_confidence: number;
  assessment_relevance: "High" | "Medium" | "Low";
}

export class MaterialitySignalPipelineV3Simple {
  async process(input: MaterialitySignalPipelineV3SimpleInput): Promise<MaterialitySignalPipelineV3SimpleOutput> {
    try {
      // Determine signal type based on content analysis
      const signalType = this.determineSignalType(input);
      
      // Generate V3 structure
      const v3Output = this.generateV3Structure(input, signalType);

      return {
        ...v3Output,
        signal_confidence: 0.8,
        extraction_confidence: 0.8,
        validation_confidence: 0.8,
        assessment_relevance: "High",
        approved: true
      };

    } catch (error) {
      console.error('V3 Pipeline processing failed:', error);
      
      // Return a safe fallback
      return this.generateFallbackOutput(input);
    }
  }

  private generateV3Structure(
    input: MaterialitySignalPipelineV3SimpleInput,
    signalType: string
  ): Omit<MaterialitySignalPipelineV3SimpleOutput, 'signal_confidence' | 'extraction_confidence' | 'validation_confidence' | 'assessment_relevance' | 'approved'> {
    
    return {
      signal_type: signalType,
      headline: input.articleTitle,
      
      // V3 Required Sections
      original_event: this.generateOriginalEvent(input),
      observation: this.generateObservation(input, signalType),
      what_this_may_indicate: this.generateWhatThisMayIndicate(input, signalType),
      why_organizations_should_pay_attention: this.generateWhyOrganizationsShouldPayAttention(signalType),
      executive_questions: ExecutiveQuestionsGenerator.generateQuestions(signalType, 6),
      intelligence_assessment: this.generateIntelligenceAssessment(input, signalType),
      
      // Legacy compatibility
      article: this.generateIntelligenceAssessment(input, signalType),
      summary: this.generateSummary(input),
      validationReasons: [],
      editorialFlags: []
    };
  }

  private determineSignalType(input: MaterialitySignalPipelineV3SimpleInput): string {
    const content = (input.articleContent + ' ' + input.articleTitle).toLowerCase();
    
    // Simple keyword-based signal type determination
    if (content.includes('governance') || content.includes('compliance') || content.includes('regulation') || content.includes('policy')) {
      return 'Governance Pressure';
    }
    
    if (content.includes('dependency') || content.includes('operational') || content.includes('workflow') || content.includes('process')) {
      return 'Operational Dependency';
    }
    
    if (content.includes('resource') || content.includes('investment') || content.includes('budget') || content.includes('infrastructure')) {
      return 'Resource Readiness';
    }
    
    // Default to AI Visibility
    return 'AI Visibility';
  }

  private generateOriginalEvent(input: MaterialitySignalPipelineV3SimpleInput): string {
    return `${input.sourceName} announced developments related to ${input.articleTitle.toLowerCase()}.

The initiative involves changes that may have implications for AI adoption and operational practices.

This announcement reflects ongoing trends in AI deployment and governance that could signal broader organizational changes.

The development represents a response to evolving AI capabilities and organizational needs.`;
  }

  private generateObservation(input: MaterialitySignalPipelineV3SimpleInput, signalType: string): string {
    const signalFocus = {
      'AI Visibility': 'AI tracking and monitoring capabilities',
      'Operational Dependency': 'AI integration into critical business processes',
      'Governance Pressure': 'AI governance and oversight requirements',
      'Resource Readiness': 'AI resource allocation and capability development'
    };

    const focus = signalFocus[signalType as keyof typeof signalFocus] || 'AI organizational impact';

    return `This event is noteworthy because it reveals patterns in how organizations are approaching ${focus}.

The behavior demonstrated suggests a shift from experimental AI use to more structured, operational deployment.

This indicates growing organizational maturity in handling AI systems and their impacts on business operations.

The response to this development shows how AI is becoming embedded in standard organizational practices rather than remaining a specialized function.

Such patterns often precede broader organizational changes as AI becomes more central to daily operations.`;
  }

  private generateWhatThisMayIndicate(input: MaterialitySignalPipelineV3SimpleInput, signalType: string): string {
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

  private generateWhyOrganizationsShouldPayAttention(signalType: string): string {
    return `Organizations frequently experience these conditions long before leadership realizes the extent of AI adoption.

Hidden AI adoption can create visibility gaps that make it difficult to understand actual AI exposure.

Unmanaged AI growth can lead to operational dependencies that emerge without proper oversight or planning.

Reporting challenges often arise when AI usage outpaces existing governance and tracking mechanisms.

Dependency accumulation can occur gradually, making it difficult to assess the true operational significance of AI systems.

These conditions can create material risks that remain invisible until they become operational problems.

The key issue is not whether AI is being used, but whether its use is understood, managed, and governed appropriately.`;
  }

  private generateIntelligenceAssessment(input: MaterialitySignalPipelineV3SimpleInput, signalType: string): string {
    return `This event suggests that AI is becoming increasingly embedded in organizational operations and decision-making processes.

The significance extends beyond the originating company and may indicate broader industry trends that could affect other organizations.

What organizations may be overlooking is the gradual nature of AI operational significance - it often emerges through accumulated small decisions rather than large strategic initiatives.

Visibility matters because organizations cannot govern what they cannot see, and AI adoption often outpaces visibility systems.

The pattern indicates that AI may be becoming operationally significant in ways that are not immediately apparent to leadership.

This suggests that organizations should examine their own AI adoption patterns to determine whether similar conditions exist internally.

The key insight is that operational significance often precedes strategic recognition, creating potential gaps between AI reality and organizational awareness.`;
  }

  private generateSummary(input: MaterialitySignalPipelineV3SimpleInput): string {
    return `Analysis of ${input.articleTitle} reveals potential organizational implications for AI adoption and operational significance. The event may indicate emerging patterns in ${this.determineSignalType(input)} that could affect multiple organizations.`;
  }

  private generateFallbackOutput(input: MaterialitySignalPipelineV3SimpleInput): MaterialitySignalPipelineV3SimpleOutput {
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
      signal_confidence: 0.1,
      extraction_confidence: 0.1,
      validation_confidence: 0.1,
      assessment_relevance: "Low"
    };
  }
}
