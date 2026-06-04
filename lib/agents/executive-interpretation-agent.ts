import { ValidatedCandidateSignal } from './materiality-signal-extraction-agent';
import { AIDMAMappingOutput } from './aidma-mapping-agent';
import { MATERIALITY_SIGNALS } from '../signals/materiality-signal-registry';

export interface EvidenceCitation {
  snippet: string;
  signal_type: string;
  relevance: string;
}

export interface ExecutiveInterpretationOutput {
  executive_observation: string;
  materiality_signal: string;
  why_this_matters: string;
  organizational_relevance: string[];
  related_dimensions: string[];
  questions_for_organizations: string[];
  assessment_connection: string;
  evidence_trail: EvidenceCitation[];
}

export class ExecutiveInterpretationAgent {
  async process(
    primary_signal: ValidatedCandidateSignal | null,
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[],
    aidma_mapping: AIDMAMappingOutput,
    article_title: string,
    source_domain: string
  ): Promise<ExecutiveInterpretationOutput> {
    console.log('=== EXECUTIVE INTERPRETATION ===');
    console.log('Primary signal:', primary_signal?.signal_type || 'None');
    console.log('Qualified signals:', qualified_signals.length);
    console.log('Mixed signals:', mixed_signals.length);
    console.log('Primary dimensions:', aidma_mapping.primary_dimensions.join(', '));
    
    // Use primary signal if available, otherwise use highest confidence qualified signal
    const selected_signal = primary_signal || (qualified_signals.length > 0 ? qualified_signals[0] : null);
    
    if (!selected_signal) {
      throw new Error('No valid signal available for interpretation');
    }
    
    const signal_def = MATERIALITY_SIGNALS[selected_signal.signal_type as keyof typeof MATERIALITY_SIGNALS];
    
    // Generate executive observation
    const executive_observation = this.generateExecutiveObservation(
      selected_signal,
      signal_def,
      article_title,
      source_domain
    );
    
    // Generate why this matters
    const why_this_matters = this.generateWhyThisMatters(selected_signal, signal_def);
    
    // Generate organizational relevance
    const organizational_relevance = this.generateOrganizationalRelevance(
      selected_signal,
      signal_def,
      aidma_mapping
    );
    
    // Generate questions for organizations
    const questions_for_organizations = this.generateQuestionsForOrganizations(
      selected_signal,
      signal_def,
      aidma_mapping
    );
    
    // Generate assessment connection
    const assessment_connection = this.generateAssessmentConnection(
      selected_signal,
      signal_def,
      aidma_mapping
    );
    
    // Generate evidence trail
    const evidence_trail = this.generateEvidenceTrail(selected_signal, qualified_signals, mixed_signals);
    
    console.log('=== EXECUTIVE INTERPRETATION RESULTS ===');
    console.log('Executive observation generated');
    console.log('Organizational relevance points:', organizational_relevance.length);
    console.log('Questions for organizations:', questions_for_organizations.length);
    console.log('Evidence citations:', evidence_trail.length);
    
    return {
      executive_observation,
      materiality_signal: signal_def.label,
      why_this_matters,
      organizational_relevance,
      related_dimensions: aidma_mapping.primary_dimensions,
      questions_for_organizations,
      assessment_connection,
      evidence_trail
    };
  }
  
  private generateExecutiveObservation(
    signal: ValidatedCandidateSignal,
    signal_def: any,
    article_title: string,
    source_domain: string
  ): string {
    const evidence_summary = signal.evidence_snippets.slice(0, 2).map(snippet => 
      this.cleanEvidenceSnippet(snippet)
    ).join('; ');
    
    return `Organizations are showing increased ${signal_def.label.toLowerCase()} as evidenced by ${evidence_summary}. This development from ${source_domain} indicates that AI is becoming operationally significant in ways that require organizational attention and planning.`;
  }
  
  private generateWhyThisMatters(
    signal: ValidatedCandidateSignal,
    signal_def: any
  ): string {
    return `This ${signal_def.label.toLowerCase()} signal matters because it provides concrete evidence that AI is transitioning from experimental to operational. Organizations that recognize and respond to this pattern can better prepare for AI-related costs, dependencies, and governance requirements while those that ignore it may face unexpected operational disruptions or resource constraints.`;
  }
  
  private generateOrganizationalRelevance(
    signal: ValidatedCandidateSignal,
    signal_def: any,
    aidma_mapping: AIDMAMappingOutput
  ): string[] {
    const relevance_points: string[] = [];
    
    // Signal-specific relevance
    switch (signal.signal_type) {
      case 'resource_readiness':
        relevance_points.push('Budget planning for AI tools and infrastructure');
        relevance_points.push('Financial governance around AI spending');
        relevance_points.push('Cost visibility across AI-assisted workflows');
        relevance_points.push('Resource allocation for AI initiatives');
        break;
        
      case 'operational_dependency':
        relevance_points.push('Business continuity planning for AI-dependent processes');
        relevance_points.push('Operational risk assessment for AI systems');
        relevance_points.push('Performance monitoring for AI-critical workflows');
        relevance_points.push('Backup planning for AI-supported operations');
        break;
        
      case 'visibility_gap':
        relevance_points.push('AI inventory and usage tracking');
        relevance_points.push('Shadow IT discovery and management');
        relevance_points.push('Comprehensive AI governance frameworks');
        relevance_points.push('Cross-departmental AI coordination');
        break;
        
      case 'governance_pressure':
        relevance_points.push('AI policy development and implementation');
        relevance_points.push('Compliance program updates for AI systems');
        relevance_points.push('Board-level AI oversight structures');
        relevance_points.push('Risk management framework adjustments');
        break;
        
      case 'reporting_pressure':
        relevance_points.push('AI disclosure and transparency programs');
        relevance_points.push('Stakeholder communication strategies');
        relevance_points.push('Investor relations for AI initiatives');
        relevance_points.push('Regulatory reporting compliance');
        break;
        
      case 'infrastructure_readiness':
        relevance_points.push('Infrastructure capacity planning for AI');
        relevance_points.push('Technical readiness assessments');
        relevance_points.push('Vendor management for AI infrastructure');
        relevance_points.push('Scalability planning for AI growth');
        break;
        
      case 'sustainability_impact':
        relevance_points.push('Environmental impact assessment for AI');
        relevance_points.push('ESG reporting for AI operations');
        relevance_points.push('Energy efficiency planning for AI systems');
        relevance_points.push('Sustainability goal alignment for AI initiatives');
        break;
    }
    
    // Add dimension-specific relevance
    for (const dimension of aidma_mapping.primary_dimensions) {
      switch (dimension) {
        case 'AI Visibility':
          relevance_points.push('Enhanced visibility into AI usage and impact');
          break;
        case 'Resource Readiness':
          relevance_points.push('Resource planning for AI adoption');
          break;
        case 'Operational Dependency':
          relevance_points.push('Dependency management for AI systems');
          break;
        case 'Infrastructure Readiness':
          relevance_points.push('Infrastructure preparation for AI workloads');
          break;
        case 'Governance Readiness':
          relevance_points.push('Governance framework development for AI');
          break;
        case 'Sustainability Readiness':
          relevance_points.push('Sustainability planning for AI operations');
          break;
        case 'Reporting Pressure':
          relevance_points.push('Reporting preparation for AI disclosures');
          break;
      }
    }
    
    // Remove duplicates and return
    return [...new Set(relevance_points)];
  }
  
  private generateQuestionsForOrganizations(
    signal: ValidatedCandidateSignal,
    signal_def: any,
    aidma_mapping: AIDMAMappingOutput
  ): string[] {
    const questions: string[] = [];
    
    // Signal-specific questions
    switch (signal.signal_type) {
      case 'resource_readiness':
        questions.push('How are we tracking AI-related costs across the organization?');
        questions.push('What budget processes exist for AI tool procurement and usage?');
        questions.push('How do we measure ROI from AI investments?');
        questions.push('What financial governance applies to AI spending?');
        break;
        
      case 'operational_dependency':
        questions.push('Which business processes depend on AI systems?');
        questions.push('What contingency plans exist for AI system failures?');
        questions.push('How do we monitor AI system performance and reliability?');
        questions.push('What operational risks arise from AI dependencies?');
        break;
        
      case 'visibility_gap':
        questions.push('What AI tools are being used without organizational approval?');
        questions.push('How comprehensive is our AI inventory and tracking?');
        questions.push('What blind spots exist in our AI usage visibility?');
        questions.push('How do we discover unauthorized AI implementations?');
        break;
        
      case 'governance_pressure':
        questions.push('What AI governance policies do we need to develop?');
        questions.push('How will board oversight handle AI-related decisions?');
        questions.push('What compliance requirements apply to our AI usage?');
        questions.push('How do we ensure AI aligns with organizational values?');
        break;
        
      case 'reporting_pressure':
        questions.push('What AI disclosures do stakeholders expect from us?');
        questions.push('How do we prepare for AI-related investor questions?');
        questions.push('What regulatory reporting applies to our AI systems?');
        questions.push('How transparent should we be about AI usage and impact?');
        break;
        
      case 'infrastructure_readiness':
        questions.push('What infrastructure upgrades are needed for AI workloads?');
        questions.push('How do we plan for AI-related capacity constraints?');
        questions.push('What technical dependencies arise from AI adoption?');
        questions.push('How do we ensure infrastructure can scale with AI growth?');
        break;
        
      case 'sustainability_impact':
        questions.push('What is the environmental impact of our AI operations?');
        questions.push('How do we measure AI energy consumption and emissions?');
        questions.push('What sustainability reporting applies to AI systems?');
        questions.push('How can we optimize AI efficiency and environmental impact?');
        break;
    }
    
    // Add dimension-specific questions
    for (const dimension of aidma_mapping.primary_dimensions) {
      switch (dimension) {
        case 'AI Visibility':
          questions.push('How can we improve visibility into AI usage and costs?');
          break;
        case 'Resource Readiness':
          questions.push('Are we adequately prepared for AI resource demands?');
          break;
        case 'Operational Dependency':
          questions.push('What operational dependencies on AI are emerging?');
          break;
        case 'Infrastructure Readiness':
          questions.push('Is our infrastructure ready for AI scaling?');
          break;
        case 'Governance Readiness':
          questions.push('How prepared are we for AI governance challenges?');
          break;
        case 'Sustainability Readiness':
          questions.push('Are we addressing AI sustainability requirements?');
          break;
        case 'Reporting Pressure':
          questions.push('How should we prepare for AI disclosure requirements?');
          break;
      }
    }
    
    // Remove duplicates and return
    return [...new Set(questions)];
  }
  
  private generateAssessmentConnection(
    signal: ValidatedCandidateSignal,
    signal_def: any,
    aidma_mapping: AIDMAMappingOutput
  ): string {
    const dimension_list = aidma_mapping.primary_dimensions.join(', ');
    return `This signal directly impacts organizational AI assessment by highlighting ${signal_def.label.toLowerCase()} concerns. The evidence supports evaluation across ${dimension_list}, providing concrete data points for organizations to assess their AI maturity and identify areas requiring attention or investment.`;
  }
  
  private generateEvidenceTrail(
    primary_signal: ValidatedCandidateSignal,
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[]
  ): EvidenceCitation[] {
    const citations: EvidenceCitation[] = [];
    
    // Add primary signal evidence
    for (const snippet of primary_signal.evidence_snippets) {
      citations.push({
        snippet: this.cleanEvidenceSnippet(snippet),
        signal_type: primary_signal.signal_type,
        relevance: 'Primary evidence supporting the main materiality signal'
      });
    }
    
    // Add qualified signal evidence
    for (const signal of qualified_signals) {
      if (signal.signal_type !== primary_signal.signal_type) {
        for (const snippet of signal.evidence_snippets.slice(0, 2)) {
          citations.push({
            snippet: this.cleanEvidenceSnippet(snippet),
            signal_type: signal.signal_type,
            relevance: 'Supporting evidence for additional materiality signals'
          });
        }
      }
    }
    
    // Add mixed signal evidence (limited)
    for (const signal of mixed_signals) {
      for (const snippet of signal.evidence_snippets.slice(0, 1)) {
        citations.push({
          snippet: this.cleanEvidenceSnippet(snippet),
          signal_type: signal.signal_type,
          relevance: 'Preliminary evidence requiring further validation'
        });
      }
    }
    
    return citations;
  }
  
  private cleanEvidenceSnippet(snippet: string): string {
    // Remove ellipsis and clean up
    return snippet.replace(/^\.\.\.|\.\.\.$/g, '').trim();
  }
  
  // Helper method to test interpretation
  async testInterpretation(
    primary_signal: ValidatedCandidateSignal | null,
    qualified_signals: ValidatedCandidateSignal[],
    mixed_signals: ValidatedCandidateSignal[],
    aidma_mapping: AIDMAMappingOutput,
    article_title: string = 'Test Article',
    source_domain: string = 'test.com'
  ): Promise<ExecutiveInterpretationOutput> {
    return this.process(primary_signal, qualified_signals, mixed_signals, aidma_mapping, article_title, source_domain);
  }
}
